from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.progress import ProgressLog, ChatMessage, Notification
from app.repositories.base_repository import BaseRepository
from datetime import date


class ProgressRepository(BaseRepository[ProgressLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(ProgressLog, db)

    async def get_by_user(self, user_id: int, limit: int = 30) -> List[ProgressLog]:
        result = await self.db.execute(
            select(ProgressLog)
            .where(ProgressLog.user_id == user_id)
            .order_by(desc(ProgressLog.log_date))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_date(self, user_id: int, log_date: date) -> Optional[ProgressLog]:
        result = await self.db.execute(
            select(ProgressLog).where(ProgressLog.user_id == user_id, ProgressLog.log_date == log_date)
        )
        return result.scalar_one_or_none()


class ChatRepository(BaseRepository[ChatMessage]):
    def __init__(self, db: AsyncSession):
        super().__init__(ChatMessage, db)

    async def get_by_session(self, user_id: int, session_id: str, limit: int = 50) -> List[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id, ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_recent_by_user(self, user_id: int, limit: int = 20) -> List[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .order_by(desc(ChatMessage.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)

    async def get_by_user(self, user_id: int, unread_only: bool = False) -> List[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            query = query.where(Notification.is_read == False)
        query = query.order_by(desc(Notification.created_at))
        result = await self.db.execute(query)
        return list(result.scalars().all())
