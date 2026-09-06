from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.schemas.roadmap import RoadmapGenerateRequest, RoadmapResponse, TaskUpdateRequest
from app.services.roadmap_service import RoadmapService
from app.models.roadmap import TaskStatus
from typing import List

router = APIRouter(prefix="/roadmaps", tags=["Roadmaps"])


@router.post("/generate", response_model=RoadmapResponse)
async def generate_roadmap(data: RoadmapGenerateRequest, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = RoadmapService(db)
    return await service.generate_roadmap(current_user.id, data)


@router.get("/", response_model=List[RoadmapResponse])
async def get_roadmaps(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = RoadmapService(db)
    return await service.get_user_roadmaps(current_user.id)


@router.get("/active", response_model=RoadmapResponse)
async def get_active_roadmap(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = RoadmapService(db)
    roadmap = await service.repo.get_active_by_user(current_user.id)
    if not roadmap:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No active roadmap found")
    return roadmap


@router.patch("/tasks/{task_id}/status")
async def update_task_status(task_id: int, data: TaskUpdateRequest, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = RoadmapService(db)
    return await service.update_task_status(current_user.id, task_id, data.status)
