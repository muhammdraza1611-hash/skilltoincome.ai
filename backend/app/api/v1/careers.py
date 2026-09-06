from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.schemas.career import CareerPathResponse
from app.services.career_service import CareerService
from typing import List

router = APIRouter(prefix="/careers", tags=["Career Analysis"])


@router.post("/analyze", response_model=List[CareerPathResponse])
async def analyze_careers(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = CareerService(db)
    return await service.analyze_careers(current_user.id)


@router.get("/", response_model=List[CareerPathResponse])
async def get_career_paths(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = CareerService(db)
    return await service.get_user_careers(current_user.id)
