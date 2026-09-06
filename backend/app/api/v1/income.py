from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.schemas.common import IncomePredictionRequest
from app.services.income_service import IncomeService

router = APIRouter(prefix="/income", tags=["Income Prediction"])


@router.post("/predict")
async def predict_income(data: IncomePredictionRequest, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = IncomeService(db)
    return await service.predict_income(current_user.id, data.career_path)


@router.get("/predictions")
async def get_predictions(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = IncomeService(db)
    return await service.get_user_predictions(current_user.id)
