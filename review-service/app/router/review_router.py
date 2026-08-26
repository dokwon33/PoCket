import logging
from typing import List

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_session
from app.config.security import get_current_user_id
from app.model.schemas import (
    PendingReviewResponse,
    ReputationResponse,
    ReviewCreateRequest,
    ReviewResponse,
    ReviewUpdateRequest,
)
from app.service.review_service import review_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    request: ReviewCreateRequest,
    user_id: int = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """
    POST /api/reviews - 상호 평가 등록

    확정(ACTIVE)된 실증 건의 당사자만, 건당 1회 남길 수 있다.
    """
    logger.info(f"[Router] 평가 등록 요청 - reviewerId: {user_id}, enrollmentId: {request.enrollmentId}")
    return await review_service.create(session, user_id, request)


@router.get("/me/pending", response_model=List[PendingReviewResponse])
async def get_my_pending_reviews(
    user_id: int = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """GET /api/reviews/me/pending - 내가 아직 평가하지 않은 확정 실증 건"""
    return await review_service.get_pending(session, user_id)


@router.get("/me/written", response_model=List[ReviewResponse])
async def get_my_written_reviews(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: int = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """GET /api/reviews/me/written - 내가 작성한 평가"""
    return await review_service.get_written(session, user_id, limit, offset)


@router.get("/user/{user_id}", response_model=List[ReviewResponse])
async def get_received_reviews(
    user_id: int,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    """GET /api/reviews/user/{userId} - 해당 사용자가 받은 평가 (공개)"""
    return await review_service.get_received(session, user_id, limit, offset)


@router.get("/user/{user_id}/reputation", response_model=ReputationResponse)
async def get_reputation(
    user_id: int,
    session: AsyncSession = Depends(get_session),
):
    """GET /api/reviews/user/{userId}/reputation - 평판 요약 (다음 매칭의 신뢰 근거)"""
    return await review_service.get_reputation(session, user_id)


@router.get("/enrollment/{enrollment_id}", response_model=List[ReviewResponse])
async def get_enrollment_reviews(
    enrollment_id: int,
    session: AsyncSession = Depends(get_session),
):
    """GET /api/reviews/enrollment/{enrollmentId} - 해당 실증 건의 양방향 평가"""
    return await review_service.get_by_enrollment(session, enrollment_id)


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    request: ReviewUpdateRequest,
    user_id: int = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """PUT /api/reviews/{reviewId} - 본인이 작성한 평가 수정"""
    return await review_service.update(session, user_id, review_id, request)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    user_id: int = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """DELETE /api/reviews/{reviewId} - 본인이 작성한 평가 삭제"""
    await review_service.delete(session, user_id, review_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
