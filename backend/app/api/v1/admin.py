from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.deps import get_db, get_current_admin
from app.models.user import User
from app.models.roadmap import Roadmap
from app.models.career import CareerPath
from app.models.progress import ChatMessage
from app.schemas.user import UserResponse
from app.schemas.common import AdminStatsResponse
from typing import List

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(admin=Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    active_users = (await db.execute(select(func.count()).select_from(User).where(User.is_active == True))).scalar_one()
    total_roadmaps = (await db.execute(select(func.count()).select_from(Roadmap))).scalar_one()
    total_careers = (await db.execute(select(func.count()).select_from(CareerPath))).scalar_one()
    total_chats = (await db.execute(select(func.count()).select_from(ChatMessage))).scalar_one()

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_roadmaps=total_roadmaps,
        total_career_analyses=total_careers,
        total_chat_messages=total_chats,
    )


@router.get("/users", response_model=List[UserResponse])
async def list_users(skip: int = 0, limit: int = 50, admin=Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).offset(skip).limit(limit).order_by(User.created_at.desc()))
    return list(result.scalars().all())


@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: int, admin=Depends(get_current_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.commit()
    return {"user_id": user_id, "is_active": user.is_active}
