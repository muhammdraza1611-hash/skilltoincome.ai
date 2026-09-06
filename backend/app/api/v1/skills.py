from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.schemas.skill import AssessmentRequest, SkillResponse, UserProfileResponse
from app.services.skill_service import SkillService
from typing import List

router = APIRouter(prefix="/skills", tags=["Skills & Assessment"])


@router.post("/assessment")
async def save_assessment(data: AssessmentRequest, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = SkillService(db)
    return await service.save_assessment(current_user.id, data)


@router.get("/", response_model=List[SkillResponse])
async def get_skills(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = SkillService(db)
    return await service.get_user_skills(current_user.id)


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = SkillService(db)
    return await service.get_user_profile(current_user.id)


@router.get("/analyze")
async def analyze_skills(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = SkillService(db)
    return await service.analyze_skills(current_user.id)
