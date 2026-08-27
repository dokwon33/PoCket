import logging
from dataclasses import dataclass
from typing import List, Optional

import httpx
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.client.course_client import course_client
from app.client.enrollment_client import enrollment_client
from app.model.entity import Review
from app.model.enums import EnrollmentStatus, ReviewerRole
from app.model.schemas import (
    PendingReviewResponse,
    ReputationResponse,
    ReviewCreateRequest,
    ReviewResponse,
    ReviewUpdateRequest,
)
from app.repository.review_repository import review_repository

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Participants:
    """검증을 통과한 평가 당사자"""
    enrollment_id: int
    course_id: int
    reviewer_id: int
    reviewee_id: int
    reviewer_role: ReviewerRole


class ReviewService:
    """
    상호 평가 도메인 로직

    핵심 규칙
      1. 확정(ACTIVE)된 실증 건에 대해서만 평가할 수 있다.
      2. 그 실증 건의 당사자(호스트 또는 스타트업)만 평가할 수 있다.
      3. 한 실증 건당 각자 1회만 평가한다. (uq_enrollment_reviewer)
      4. 자기 자신은 평가할 수 없다.
    """

    # ── 당사자 검증 ────────────────────────────────────

    async def _resolve_participants(
        self,
        reviewer_id: int,
        enrollment_id: int,
        reviewee_id: Optional[int],
    ) -> Participants:
        """
        기존 서비스의 공개 엔드포인트만으로 평가 자격을 확인한다.

        - 스타트업 경로: reviewer 의 실증 신청 목록에 enrollment_id 가 있으면
          평가 대상은 그 슬롯의 호스트(course.instructorId)로 자동 결정된다.
        - 호스트 경로: reviewee(스타트업)의 신청 목록에 enrollment_id 가 있고
          그 슬롯의 호스트가 reviewer 본인이어야 한다.
        """
        try:
            own = await enrollment_client.get_user_enrollments(reviewer_id)
        except httpx.HTTPError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="실증 신청 서비스에 연결할 수 없습니다",
            )

        as_startup = next((e for e in own if e.id == enrollment_id), None)
        if as_startup is not None:
            self._require_active(as_startup.status)
            course = await self._get_course(as_startup.courseId)
            host_id = course.instructorId

            if host_id == reviewer_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="자기 자신은 평가할 수 없습니다",
                )
            if reviewee_id is not None and reviewee_id != host_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="평가 대상이 해당 실증의 호스트와 일치하지 않습니다",
                )

            return Participants(
                enrollment_id=enrollment_id,
                course_id=as_startup.courseId,
                reviewer_id=reviewer_id,
                reviewee_id=host_id,
                reviewer_role=ReviewerRole.STARTUP,
            )

        # 호스트 경로는 평가 대상(스타트업)을 알아야 신청 건을 특정할 수 있다.
        # revieweeId 가 없으면 '호스트인데 대상을 빠뜨린 것'인지
        # '아예 당사자가 아닌 것'인지 구분할 수 없으므로 둘 다 안내한다.
        if reviewee_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "해당 실증 건의 스타트업이 아닙니다. "
                    "호스트로 평가하려면 revieweeId를 함께 보내세요"
                ),
            )

        try:
            counterpart = await enrollment_client.get_user_enrollments(reviewee_id)
        except httpx.HTTPError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="실증 신청 서비스에 연결할 수 없습니다",
            )

        target = next((e for e in counterpart if e.id == enrollment_id), None)
        if target is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="해당 실증 건의 당사자가 아닙니다",
            )

        self._require_active(target.status)
        course = await self._get_course(target.courseId)

        if course.instructorId != reviewer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="해당 실증 슬롯의 호스트가 아닙니다",
            )
        if reviewee_id == reviewer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="자기 자신은 평가할 수 없습니다",
            )

        return Participants(
            enrollment_id=enrollment_id,
            course_id=target.courseId,
            reviewer_id=reviewer_id,
            reviewee_id=reviewee_id,
            reviewer_role=ReviewerRole.HOST,
        )

    @staticmethod
    def _require_active(raw_status: str) -> None:
        if raw_status != EnrollmentStatus.ACTIVE.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"확정된 실증 건만 평가할 수 있습니다 (현재 상태: {raw_status})",
            )

    @staticmethod
    async def _get_course(course_id: int):
        try:
            course = await course_client.get_course(course_id)
        except httpx.HTTPError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="실증 슬롯 서비스에 연결할 수 없습니다",
            )
        if course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"실증 슬롯을 찾을 수 없습니다: {course_id}",
            )
        return course

    # ── 명령 ──────────────────────────────────────────

    async def create(
        self, session: AsyncSession, reviewer_id: int, request: ReviewCreateRequest
    ) -> ReviewResponse:
        participants = await self._resolve_participants(
            reviewer_id, request.enrollmentId, request.revieweeId
        )

        existing = await review_repository.find_by_enrollment_and_reviewer(
            session, participants.enrollment_id, reviewer_id
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 이 실증 건에 대한 평가를 남겼습니다",
            )

        review = Review(
            enrollment_id=participants.enrollment_id,
            course_id=participants.course_id,
            reviewer_id=participants.reviewer_id,
            reviewee_id=participants.reviewee_id,
            reviewer_role=participants.reviewer_role.value,
            rating=request.rating,
            comment=request.comment,
        )

        try:
            saved = await review_repository.save(session, review)
        except IntegrityError:
            await session.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 이 실증 건에 대한 평가를 남겼습니다",
            )

        logger.info(
            f"[ReviewService] 평가 등록 - reviewId: {saved.id}, "
            f"enrollmentId: {saved.enrollment_id}, "
            f"{saved.reviewer_id}({saved.reviewer_role}) → {saved.reviewee_id}, "
            f"rating: {saved.rating}"
        )
        return ReviewResponse.from_entity(saved)

    async def update(
        self,
        session: AsyncSession,
        reviewer_id: int,
        review_id: int,
        request: ReviewUpdateRequest,
    ) -> ReviewResponse:
        review = await self._require_own_review(session, reviewer_id, review_id)

        review.rating = request.rating
        review.comment = request.comment
        updated = await review_repository.update(session, review)

        logger.info(f"[ReviewService] 평가 수정 - reviewId: {review_id}")
        return ReviewResponse.from_entity(updated)

    async def delete(
        self, session: AsyncSession, reviewer_id: int, review_id: int
    ) -> None:
        review = await self._require_own_review(session, reviewer_id, review_id)
        await session.delete(review)
        await session.commit()
        logger.info(f"[ReviewService] 평가 삭제 - reviewId: {review_id}")

    async def _require_own_review(
        self, session: AsyncSession, reviewer_id: int, review_id: int
    ) -> Review:
        review = await review_repository.find_by_id(session, review_id)
        if review is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"평가를 찾을 수 없습니다: {review_id}",
            )
        if review.reviewer_id != reviewer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인이 작성한 평가만 수정/삭제할 수 있습니다",
            )
        return review

    # ── 조회 ──────────────────────────────────────────

    async def get_received(
        self, session: AsyncSession, user_id: int, limit: int, offset: int
    ) -> List[ReviewResponse]:
        rows = await review_repository.find_received(session, user_id, limit, offset)
        return [ReviewResponse.from_entity(r) for r in rows]

    async def get_written(
        self, session: AsyncSession, user_id: int, limit: int, offset: int
    ) -> List[ReviewResponse]:
        rows = await review_repository.find_written(session, user_id, limit, offset)
        return [ReviewResponse.from_entity(r) for r in rows]

    async def get_by_enrollment(
        self, session: AsyncSession, enrollment_id: int
    ) -> List[ReviewResponse]:
        rows = await review_repository.find_by_enrollment(session, enrollment_id)
        return [ReviewResponse.from_entity(r) for r in rows]

    async def get_reputation(
        self, session: AsyncSession, user_id: int
    ) -> ReputationResponse:
        """다음 매칭의 신뢰 근거 — 받은 평가 요약"""
        distribution = await review_repository.rating_distribution(session, user_id)
        count = sum(distribution.values())
        average = (
            round(
                sum(rating * n for rating, n in distribution.items()) / count,
                2,
            )
            if count
            else None
        )
        return ReputationResponse(
            userId=user_id,
            reviewCount=count,
            averageRating=average,
            ratingDistribution=distribution,
        )

    async def get_pending(
        self, session: AsyncSession, user_id: int
    ) -> List[PendingReviewResponse]:
        """
        내가 아직 평가하지 않은 확정 실증 건 (스타트업 입장)

        호스트 입장의 미평가 목록은 '호스트의 슬롯별 신청자 조회' 엔드포인트가
        필요해 기존 백엔드 수정 없이는 만들 수 없다. 화면에서는 슬롯 상세의
        신청자 목록을 통해 평가를 남기는 흐름으로 처리한다.
        """
        try:
            enrollments = await enrollment_client.get_user_enrollments(user_id)
        except httpx.HTTPError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="실증 신청 서비스에 연결할 수 없습니다",
            )

        reviewed = set(
            await review_repository.find_reviewed_enrollment_ids(session, user_id)
        )

        pending: List[PendingReviewResponse] = []
        for enrollment in enrollments:
            if enrollment.status != EnrollmentStatus.ACTIVE.value:
                continue
            if enrollment.id in reviewed:
                continue

            course = await self._get_course(enrollment.courseId)
            if course.instructorId == user_id:
                continue

            pending.append(
                PendingReviewResponse(
                    enrollmentId=enrollment.id,
                    courseId=enrollment.courseId,
                    revieweeId=course.instructorId,
                    reviewerRole=ReviewerRole.STARTUP,
                )
            )

        return pending


review_service = ReviewService()
