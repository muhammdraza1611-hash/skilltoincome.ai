from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.schemas.common import ProgressLogCreate, NotificationResponse
from app.services.progress_service import ProgressService
from app.repositories.progress_repository import NotificationRepository
from typing import List

router = APIRouter(prefix="/progress", tags=["Progress Tracking"])


@router.post("/log")
async def log_progress(data: ProgressLogCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = ProgressService(db)
    return await service.log_progress(current_user.id, data.learning_hours, data.tasks_completed, data.notes)


@router.get("/weekly")
async def weekly_stats(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = ProgressService(db)
    return await service.get_weekly_stats(current_user.id)


@router.get("/monthly")
async def monthly_stats(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = ProgressService(db)
    return await service.get_monthly_stats(current_user.id)


@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = NotificationRepository(db)
    return await repo.get_by_user(current_user.id)


@router.patch("/notifications/{notif_id}/read")
async def mark_read(notif_id: int, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = NotificationRepository(db)
    notif = await repo.get_by_id(notif_id)
    if notif and notif.user_id == current_user.id:
        notif.is_read = True
        await repo.update(notif)
    return {"success": True}
