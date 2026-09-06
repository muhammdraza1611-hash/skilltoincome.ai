from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.schemas.common import PortfolioAnalysisRequest
from app.services.portfolio_service import PortfolioService

router = APIRouter(prefix="/portfolio", tags=["Portfolio Analyzer"])


@router.post("/analyze")
async def analyze_portfolio(data: PortfolioAnalysisRequest, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = PortfolioService(db)
    return await service.analyze_portfolio(
        current_user.id,
        data.portfolio_url,
        data.github_url,
        data.career_goal,
    )


@router.get("/reviews")
async def get_reviews(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = PortfolioService(db)
    return await service.get_user_reviews(current_user.id)
