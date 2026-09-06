from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.career import CareerPath
from app.repositories.base_repository import BaseRepository


class CareerRepository(BaseRepository[CareerPath]):
    def __init__(self, db: AsyncSession):
        super().__init__(CareerPath, db)

    async def get_by_user(self, user_id: int) -> List[CareerPath]:
        result = await self.db.execute(
            select(CareerPath).where(CareerPath.user_id == user_id).order_by(CareerPath.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_latest_by_user(self, user_id: int) -> Optional[CareerPath]:
        result = await self.db.execute(
            select(CareerPath).where(CareerPath.user_id == user_id).order_by(CareerPath.created_at.desc()).limit(1)
        )
        return result.scalar_one_or_none()
