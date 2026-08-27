import httpx
import logging
from typing import List
from app.config.settings import settings
from app.model.schemas import EnrollmentResponse

logger = logging.getLogger(__name__)


class EnrollmentServiceClient:
    """
    실증 신청 서비스(enrollment-service) REST 클라이언트

    기존 엔드포인트만 사용한다 — 백엔드 수정 0줄.
      GET /api/enrollments/user/{userId}
    """

    def __init__(self):
        self.base_url = settings.enrollment_service_url

    async def get_user_enrollments(self, user_id: int) -> List[EnrollmentResponse]:
        url = f"{self.base_url}/api/enrollments/user/{user_id}"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                payload = response.json()
                items = payload.get("data") or []
                return [EnrollmentResponse(**item) for item in items]
        except httpx.HTTPError as e:
            logger.error(f"[EnrollmentClient] 실증 신청 조회 실패 - userId: {user_id}, error: {e}")
            # 평가는 참여자 검증이 핵심이므로 조용히 빈 목록을 반환하지 않고 호출부에 알린다.
            raise


enrollment_client = EnrollmentServiceClient()
