from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class CareerPathResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    market_demand_score: float
    difficulty_level: Optional[str]
    avg_salary_min: float
    avg_salary_max: float
    remote_opportunities: bool
    future_growth_percentage: float
    career_suitability_score: float
    required_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    is_recommended: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CareerAnalysisRequest(BaseModel):
    regenerate: bool = False
