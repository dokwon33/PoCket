from typing import List, Optional, Sequence
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.model.entity import Review


class ReviewRepository:
    """reviews 테이블 전용 데이터 접근 계층"""

    async def save(self, session: AsyncSession, review: Review) -> Review:
        session.add(review)
        await session.commit()
        await session.refresh(review)
        return review

    async def update(self, session: AsyncSession, review: Review) -> Review:
        await session.commit()
        await session.refresh(review)
        return review

    async def find_by_id(self, session: AsyncSession, review_id: int) -> Optional[Review]:
        return await session.get(Review, review_id)

    async def find_by_enrollment_and_reviewer(
        self, session: AsyncSession, enrollment_id: int, reviewer_id: int
    ) -> Optional[Review]:
        stmt = select(Review).where(
            Review.enrollment_id == enrollment_id,
            Review.reviewer_id == reviewer_id,
        )
        return (await session.execute(stmt)).scalar_one_or_none()

    async def find_by_enrollment(
        self, session: AsyncSession, enrollment_id: int
    ) -> Sequence[Review]:
        stmt = (
            select(Review)
            .where(Review.enrollment_id == enrollment_id)
            .order_by(Review.created_at.desc())
        )
        return (await session.execute(stmt)).scalars().all()

    async def find_received(
        self, session: AsyncSession, user_id: int, limit: int, offset: int
    ) -> Sequence[Review]:
        stmt = (
            select(Review)
            .where(Review.reviewee_id == user_id)
            .order_by(Review.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return (await session.execute(stmt)).scalars().all()

    async def find_written(
        self, session: AsyncSession, user_id: int, limit: int, offset: int
    ) -> Sequence[Review]:
        stmt = (
            select(Review)
            .where(Review.reviewer_id == user_id)
            .order_by(Review.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return (await session.execute(stmt)).scalars().all()

    async def find_reviewed_enrollment_ids(
        self, session: AsyncSession, reviewer_id: int
    ) -> List[int]:
        stmt = select(Review.enrollment_id).where(Review.reviewer_id == reviewer_id)
        return list((await session.execute(stmt)).scalars().all())

    async def rating_distribution(
        self, session: AsyncSession, user_id: int
    ) -> dict[int, int]:
        stmt = (
            select(Review.rating, func.count(Review.id))
            .where(Review.reviewee_id == user_id)
            .group_by(Review.rating)
        )
        rows = (await session.execute(stmt)).all()
        return {int(rating): int(count) for rating, count in rows}


review_repository = ReviewRepository()
