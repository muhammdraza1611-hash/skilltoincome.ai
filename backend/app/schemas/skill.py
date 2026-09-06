from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.skill import SkillLevel


class SkillCreate(BaseModel):
    skill_name: str
    level: SkillLevel = SkillLevel.BEGINNER
    years_experience: float = 0.0
    is_primary: int = 0


class SkillResponse(BaseModel):
    id: int
    skill_name: str
    level: SkillLevel
    years_experience: float
    is_primary: int
    created_at: datetime

    model_config = {"from_attributes": True}


class UserProfileCreate(BaseModel):
    interests: Optional[List[str]] = []
    career_goals: Optional[List[str]] = []
    learning_hours_per_day: float = 2.0
    current_occupation: Optional[str] = None
    education_level: Optional[str] = None
    location: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    linkedin_url: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    interests: Optional[List[str]] = []
    career_goals: Optional[List[str]] = []
    learning_hours_per_day: float
    current_occupation: Optional[str] = None
    education_level: Optional[str] = None
    location: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    linkedin_url: Optional[str] = None

    model_config = {"from_attributes": True}


class AssessmentRequest(BaseModel):
    skills: List[SkillCreate]
    profile: UserProfileCreate
