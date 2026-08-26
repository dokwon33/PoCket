import logging
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from app.config.settings import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


# pool_pre_ping 은 켜지 않는다.
# aiomysql 어댑터의 ping() 시그니처가 SQLAlchemy 의 pre-ping 호출과 맞지 않아
# 커넥션 재사용 시 TypeError 가 발생한다.
# 대신 MariaDB 의 wait_timeout(기본 8시간)보다 짧은 주기로 커넥션을 재활용한다.
engine = create_async_engine(
    settings.database_url,
    echo=settings.db_echo,
    pool_recycle=1800,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncSession:
    """FastAPI 의존성: 요청 단위 세션"""
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    """
    reviews 테이블만 생성한다. (init-db/02_review.sql 과 동일한 스키마)
    기존 테이블은 이 서비스가 소유하지 않으므로 절대 건드리지 않는다.
    """
    from app.model.entity import Review  # noqa: F401  (매퍼 등록용)

    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[Review.__table__],
        )
    logger.info("[DB] reviews 테이블 준비 완료")


async def close_db() -> None:
    await engine.dispose()
