from sqlalchemy import Column, Integer, String, Boolean, Enum, Text
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)

    # Relationships
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    career_paths = relationship("CareerPath", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")
    income_predictions = relationship("IncomePrediction", back_populates="user", cascade="all, delete-orphan")
    portfolio_reviews = relationship("PortfolioReview", back_populates="user", cascade="all, delete-orphan")
    chat_history = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    # Job Board Relationships
    saved_jobs = relationship("SavedJob", back_populates="user", cascade="all, delete-orphan")
    job_applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")
