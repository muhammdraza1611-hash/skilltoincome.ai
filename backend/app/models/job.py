from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from datetime import datetime, timedelta
from app.db.base import Base, TimestampMixin


class Job(Base, TimestampMixin):
    """Jobs aggregated from RemoteOK and other sources"""
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(100), unique=True, index=True, nullable=False)  # RemoteOK job ID
    title = Column(String(300), nullable=False, index=True)
    company = Column(String(200), nullable=False, index=True)
    company_logo = Column(String(500))  # URL to logo
    location = Column(String(200), default="Remote")
    job_type = Column(String(50), default="Full-time")  # Full-time, Contract, Part-time
    description = Column(Text)
    tags = Column(JSON, default=list)  # ["Python", "React", "Remote"]
    apply_url = Column(String(500), nullable=False)
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    source = Column(String(50), default="remoteok")  # remoteok, indeed, manual
    is_active = Column(Boolean, default=True)
    posted_date = Column(DateTime)
    expires_at = Column(DateTime)  # Auto-expire after 30 days
    
    # Relationships
    saved_by_users = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")


class SavedJob(Base, TimestampMixin):
    """User's saved/bookmarked jobs"""
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    notes = Column(Text)  # User's personal notes
    ai_match_score = Column(Float)  # 0-100 score based on user skills
    ai_match_reasons = Column(JSON, default=list)  # ["Strong Python skills", "React experience"]
    
    # Relationships
    user = relationship("User", back_populates="saved_jobs")
    job = relationship("Job", back_populates="saved_by_users")


class JobApplication(Base, TimestampMixin):
    """Track which jobs user applied to"""
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="applied")  # applied, interview, rejected, accepted
    applied_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)
    
    # Relationships
    user = relationship("User", back_populates="job_applications")
    job = relationship("Job", back_populates="applications")
