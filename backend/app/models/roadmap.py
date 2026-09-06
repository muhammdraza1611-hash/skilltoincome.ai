from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON, Boolean, Float, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base, TimestampMixin


class RoadmapDuration(str, enum.Enum):
    DAYS_30 = "30_days"
    DAYS_60 = "60_days"
    DAYS_90 = "90_days"
    MONTHS_6 = "6_months"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class Roadmap(Base, TimestampMixin):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    career_path_id = Column(Integer, ForeignKey("career_paths.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(300), nullable=False)
    duration = Column(Enum(RoadmapDuration), nullable=False)
    description = Column(Text)
    completion_percentage = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    ai_generated_content = Column(JSON)  # full structured roadmap

    user = relationship("User", back_populates="roadmaps")
    tasks = relationship("RoadmapTask", back_populates="roadmap", cascade="all, delete-orphan")


class RoadmapTask(Base, TimestampMixin):
    __tablename__ = "roadmap_tasks"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False)
    week_number = Column(Integer, nullable=False)
    day_number = Column(Integer, nullable=True)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    resources = Column(JSON)        # list of {title, url, type}
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING)
    estimated_hours = Column(Float, default=1.0)
    is_milestone = Column(Boolean, default=False)

    roadmap = relationship("Roadmap", back_populates="tasks")
