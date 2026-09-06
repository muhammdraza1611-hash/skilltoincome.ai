from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.roadmap import Roadmap, RoadmapTask
from app.repositories.base_repository import BaseRepository


class RoadmapRepository(BaseRepository[Roadmap]):
    def __init__(self, db: AsyncSession):
        super().__init__(Roadmap, db)

    async def get_by_user(self, user_id: int) -> List[Roadmap]:
        result = await self.db.execute(
            select(Roadmap)
            .where(Roadmap.user_id == user_id)
            .options(selectinload(Roadmap.tasks))
            .order_by(Roadmap.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_active_by_user(self, user_id: int) -> Optional[Roadmap]:
        result = await self.db.execute(
            select(Roadmap)
            .where(Roadmap.user_id == user_id, Roadmap.is_active == True)
            .options(selectinload(Roadmap.tasks))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_with_tasks(self, roadmap_id: int) -> Optional[Roadmap]:
        result = await self.db.execute(
            select(Roadmap).where(Roadmap.id == roadmap_id).options(selectinload(Roadmap.tasks))
        )
        return result.scalar_one_or_none()


class RoadmapTaskRepository(BaseRepository[RoadmapTask]):
    def __init__(self, db: AsyncSession):
        super().__init__(RoadmapTask, db)

    async def get_by_roadmap(self, roadmap_id: int) -> List[RoadmapTask]:
        result = await self.db.execute(
            select(RoadmapTask).where(RoadmapTask.roadmap_id == roadmap_id).order_by(
                RoadmapTask.week_number, RoadmapTask.day_number
            )
        )
        return list(result.scalars().all())
