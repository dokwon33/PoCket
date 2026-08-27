import logging
from contextlib import asynccontextmanager

import py_eureka_client.eureka_client as eureka_client
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import close_db, init_db
from app.config.settings import settings
from app.router import review_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행되는 이벤트"""

    logger.info(f"[{settings.app_name}] 서비스 시작")

    # reviews 테이블 준비 (기존 테이블은 건드리지 않는다)
    try:
        await init_db()
    except Exception as e:
        logger.error(f"[DB] 초기화 실패: {e}")

    # Eureka 등록
    try:
        await eureka_client.init_async(
            eureka_server=settings.eureka_server_url,
            app_name=settings.app_name,
            instance_port=settings.app_port,
            instance_host=settings.eureka_instance_host,
        )
        logger.info("[Eureka] 서비스 등록 완료")
    except Exception as e:
        logger.warning(f"[Eureka] 등록 실패 (개발 환경에서 무시 가능): {e}")

    yield

    logger.info(f"[{settings.app_name}] 서비스 종료")
    await close_db()
    try:
        await eureka_client.stop_async()
    except Exception as e:
        logger.warning(f"[Eureka] 해제 실패: {e}")


app = FastAPI(
    title="Review Service",
    description="PoCket - 호스트↔스타트업 상호 평가 · 평판 서비스",
    version="0.0.1",
    lifespan=lifespan,
)

# 게이트웨이를 경유하지 않고 브라우저가 직접 호출하는 확장 서비스이므로
# CORS 를 이 서비스에서 직접 허용한다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review_router.router)


@app.get("/health")
async def health():
    return {"status": "UP", "service": settings.app_name}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.app_port,
        reload=True,
    )
