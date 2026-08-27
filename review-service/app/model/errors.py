"""
OpenAPI 에 실을 에러 응답 정의

FastAPI 는 성공 응답과 422 만 자동으로 문서화한다.
평가 서비스는 403/404/409 가 도메인 규칙 그 자체이므로
명세만 보고도 계약을 알 수 있도록 직접 기술한다.
"""

from typing import Any, Dict
from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """FastAPI HTTPException 의 응답 형태"""
    detail: str = Field(..., examples=["해당 실증 건의 당사자가 아닙니다"])


def _err(description: str, example: str) -> Dict[str, Any]:
    return {
        "model": ErrorResponse,
        "description": description,
        "content": {"application/json": {"example": {"detail": example}}},
    }


UNAUTHORIZED = _err("토큰이 없거나 유효하지 않음", "유효하지 않은 토큰입니다")

NOT_PARTICIPANT = _err(
    "해당 실증 건의 당사자가 아님",
    "해당 실증 건의 당사자가 아닙니다",
)

NOT_OWN_REVIEW = _err(
    "본인이 작성한 평가가 아님",
    "본인이 작성한 평가만 수정/삭제할 수 있습니다",
)

REVIEW_NOT_FOUND = _err("평가를 찾을 수 없음", "평가를 찾을 수 없습니다: 42")

SLOT_NOT_FOUND = _err("실증 슬롯을 찾을 수 없음", "실증 슬롯을 찾을 수 없습니다: 42")

ALREADY_REVIEWED = _err(
    "이미 평가했거나 확정되지 않은 실증 건",
    "이미 이 실증 건에 대한 평가를 남겼습니다",
)

BAD_TARGET = _err(
    "평가 대상이 잘못됨",
    "해당 실증 건의 스타트업이 아닙니다. 호스트로 평가하려면 revieweeId를 함께 보내세요",
)

UPSTREAM_DOWN = _err(
    "연동 서비스(enrollment/course) 연결 실패",
    "실증 신청 서비스에 연결할 수 없습니다",
)


# 라우트별 조합
CREATE_ERRORS = {
    400: BAD_TARGET,
    401: UNAUTHORIZED,
    403: NOT_PARTICIPANT,
    404: SLOT_NOT_FOUND,
    409: ALREADY_REVIEWED,
    503: UPSTREAM_DOWN,
}

MODIFY_ERRORS = {
    401: UNAUTHORIZED,
    403: NOT_OWN_REVIEW,
    404: REVIEW_NOT_FOUND,
}

AUTH_ERRORS = {
    401: UNAUTHORIZED,
}

PENDING_ERRORS = {
    401: UNAUTHORIZED,
    404: SLOT_NOT_FOUND,
    503: UPSTREAM_DOWN,
}
