from pydantic import BaseModel
from typing import Optional, Any, List, Generic, TypeVar

T = TypeVar("T")


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str


class ProgressLogCreate(BaseModel):
    learning_hours: float
    tasks_completed: int
    notes: Optional[str] = None


class PortfolioAnalysisRequest(BaseModel):
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    career_goal: Optional[str] = None


class IncomePredictionRequest(BaseModel):
    career_path: str
    regenerate: bool = False


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    notification_type: Optional[str]

    model_config = {"from_attributes": True}


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_roadmaps: int
    total_career_analyses: int
    total_chat_messages: int
