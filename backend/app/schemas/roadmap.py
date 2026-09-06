from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from app.models.roadmap import RoadmapDuration, TaskStatus


class RoadmapGenerateRequest(BaseModel):
    duration: RoadmapDuration
    career_path_id: Optional[int] = None
    career_title: Optional[str] = None


class TaskResponse(BaseModel):
    id: int
    week_number: int
    day_number: Optional[int]
    title: str
    description: Optional[str]
    resources: Optional[List[Any]] = []
    status: TaskStatus
    estimated_hours: float
    is_milestone: bool

    model_config = {"from_attributes": True}


class TaskUpdateRequest(BaseModel):
    status: TaskStatus


class RoadmapResponse(BaseModel):
    id: int
    title: str
    duration: RoadmapDuration
    description: Optional[str]
    completion_percentage: float
    is_active: bool
    tasks: List[TaskResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}
