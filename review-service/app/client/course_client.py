import httpx
import logging
from typing import Optional
from app.config.settings import settings
from app.model.schemas import CourseResponse

logger = logging.getLogger(__name__)


class CourseServiceClient:
    """
    실증 슬롯 서비스(course-service) REST 클라이언트

    기존 엔드포인트만 사용한다 — 백엔드 수정 0줄.
      GET /api/courses/internal/{id}
    """

    def __init__(self):
        self.base_url = settings.course_service_url

    async def get_course(self, course_id: int) -> Optional[CourseResponse]:
        url = f"{self.base_url}/api/courses/internal/{course_id}"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url)
                if response.status_code == 404:
                    return None
                response.raise_for_status()
                return CourseResponse(**response.json())
        except httpx.HTTPError as e:
            logger.error(f"[CourseClient] 실증 슬롯 조회 실패 - courseId: {course_id}, error: {e}")
            raise


course_client = CourseServiceClient()
