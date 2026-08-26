from datetime import datetime
from sqlalchemy import (
    BigInteger,
    Index,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.mysql import DATETIME
from sqlalchemy.orm import Mapped, mapped_column
from app.config.database import Base


class Review(Base):
    """
    상호 평가 — 실증이 확정(ACTIVE)된 건에 대해 호스트↔스타트업이 서로 1회씩 남긴다.

    - 이 서비스가 소유하는 유일한 테이블이며 다른 서비스의 테이블은 읽지 않는다.
    - 참여자 검증은 DB 조인이 아니라 enrollment/course 서비스 REST 호출로 수행한다.
      (기존 백엔드 수정 0줄 원칙)
    """

    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("enrollment_id", "reviewer_id", name="uq_enrollment_reviewer"),
        Index("idx_reviews_reviewee", "reviewee_id"),
        Index("idx_reviews_enrollment", "enrollment_id"),
        {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # 평가의 근거가 되는 실증 건
    enrollment_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    course_id: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # 누가 → 누구를
    reviewer_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    reviewee_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    reviewer_role: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="HOST | STARTUP"
    )

    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False, comment="1~5")
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 기존 테이블(users/courses/…)과 동일하게 마이크로초 정밀도를 쓴다.
    created_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=6), nullable=False, server_default=func.now(6)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=6),
        nullable=False,
        server_default=func.now(6),
        server_onupdate=func.now(6),
        onupdate=func.now(6),
    )
