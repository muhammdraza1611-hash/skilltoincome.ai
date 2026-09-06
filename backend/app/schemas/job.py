from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class JobBase(BaseModel):
    title: str
    company: str
    location: str = "Remote"
    job_type: str = "Full-time"
    description: Optional[str] = None
    tags: List[str] = []
    apply_url: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None


class JobResponse(JobBase):
    id: int
    external_id: str
    company_logo: Optional[str] = None
    source: str
    is_active: bool
    posted_date: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class JobWithMatchResponse(JobResponse):
    """Job with AI match score"""
    match_score: Optional[float] = None
    match_reasons: List[str] = []


class JobListRequest(BaseModel):
    skip: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)
    search: Optional[str] = None
    tags: Optional[List[str]] = None
    location: Optional[str] = None


class SaveJobRequest(BaseModel):
    job_id: int
    notes: Optional[str] = None


class SavedJobResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    job: JobResponse
    notes: Optional[str] = None
    ai_match_score: Optional[float] = None
    ai_match_reasons: List[str] = []
    created_at: datetime
    
    class Config:
        from_attributes = True


class JobApplicationRequest(BaseModel):
    job_id: int


class JobApplicationResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    job: JobResponse
    status: str
    applied_at: datetime
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True


class JobSyncResponse(BaseModel):
    message: str
    jobs_added: int
    total_jobs: int
