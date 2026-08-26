from enum import Enum


class ReviewerRole(str, Enum):
    """
    평가를 남긴 쪽의 역할
    - HOST    : 테스트베드 호스트 (실증 슬롯 제공자, courses.instructor_id)
    - STARTUP : 스타트업 (실증 신청자, enrollments.user_id)
    """
    HOST = "HOST"
    STARTUP = "STARTUP"

    @property
    def counterpart(self) -> "ReviewerRole":
        return ReviewerRole.STARTUP if self is ReviewerRole.HOST else ReviewerRole.HOST


class EnrollmentStatus(str, Enum):
    """실증 신청 상태 (enrollment-service 값 그대로)"""
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    CANCELLED = "CANCELLED"
