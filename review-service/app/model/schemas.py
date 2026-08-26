from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.config.settings import settings
from app.model.enums import ReviewerRole


# ── 요청 ──────────────────────────────────────────────

class ReviewCreateRequest(BaseModel):
    """
    평가 등록 요청

    revieweeId 는 호스트가 스타트업을 평가할 때만 필수다.
    스타트업이 호스트를 평가할 때는 실증 슬롯의 소유자로 자동 결정된다.
    """
    enrollmentId: int = Field(..., description="평가 근거가 되는 실증 신청 ID")
    revieweeId: Optional[int] = Field(
        None, description="평가 대상 사용자 ID (호스트가 평가할 때 필수)"
    )
    rating: int = Field(
        ..., ge=settings.rating_min, le=settings.rating_max, description="1~5"
    )
    comment: Optional[str] = Field(None, max_length=2000)


class ReviewUpdateRequest(BaseModel):
    rating: int = Field(..., ge=settings.rating_min, le=settings.rating_max)
    comment: Optional[str] = Field(None, max_length=2000)


# ── 응답 ──────────────────────────────────────────────

class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    enrollmentId: int
    courseId: int
    reviewerId: int
    revieweeId: int
    reviewerRole: ReviewerRole
    rating: int
    comment: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    @classmethod
    def from_entity(cls, review) -> "ReviewResponse":
        return cls(
            id=review.id,
            enrollmentId=review.enrollment_id,
            courseId=review.course_id,
            reviewerId=review.reviewer_id,
            revieweeId=review.reviewee_id,
            reviewerRole=ReviewerRole(review.reviewer_role),
            rating=review.rating,
            comment=review.comment,
            createdAt=review.created_at,
            updatedAt=review.updated_at,
        )


class ReputationResponse(BaseModel):
    """다음 매칭의 신뢰 근거 — 사용자가 받은 평가 요약"""
    userId: int
    reviewCount: int
    averageRating: Optional[float] = None
    ratingDistribution: dict[int, int] = Field(default_factory=dict)


class PendingReviewResponse(BaseModel):
    """아직 평가를 남기지 않은 실증 건"""
    enrollmentId: int
    courseId: int
    revieweeId: int
    reviewerRole: ReviewerRole


class ApiResponse(BaseModel):
    """다른 서비스와 동일한 응답 래퍼 형태"""
    success: bool
    message: str
    data: Optional[object] = None

    @classmethod
    def ok(cls, data=None, message: str = "성공") -> "ApiResponse":
        return cls(success=True, message=message, data=data)


# ── 외부 서비스 응답 (enrollment / course) ─────────────

class CourseSummary(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: Optional[int] = None
    title: Optional[str] = None


class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: int
    userId: int
    courseId: int
    status: str
    createdAt: Optional[datetime] = None
    course: Optional[CourseSummary] = None


class CourseResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: int
    title: Optional[str] = None
    instructorId: int
