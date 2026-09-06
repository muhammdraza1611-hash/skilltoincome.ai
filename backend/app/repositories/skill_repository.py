from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.skill import UserSkill, UserProfile
from app.repositories.base_repository import BaseRepository


class UserSkillRepository(BaseRepository[UserSkill]):
    def __init__(self, db: AsyncSession):
        super().__init__(UserSkill, db)

    async def get_by_user(self, user_id: int) -> List[UserSkill]:
        result = await self.db.execute(select(UserSkill).where(UserSkill.user_id == user_id))
        return list(result.scalars().all())

    async def delete_by_user(self, user_id: int) -> None:
        from sqlalchemy import delete
        await self.db.execute(delete(UserSkill).where(UserSkill.user_id == user_id))
        await self.db.commit()


class UserProfileRepository(BaseRepository[UserProfile]):
    def __init__(self, db: AsyncSession):
        super().__init__(UserProfile, db)

    async def get_by_user(self, user_id: int) -> Optional[UserProfile]:
        result = await self.db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        return result.scalar_one_or_none()
