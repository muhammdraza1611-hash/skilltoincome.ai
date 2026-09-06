from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from app.db.base import Base, TimestampMixin


class CareerPath(Base, TimestampMixin):
    __tablename__ = "career_paths"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    market_demand_score = Column(Float, default=0.0)
    difficulty_level = Column(String(50))
    avg_salary_min = Column(Float, default=0.0)
    avg_salary_max = Column(Float, default=0.0)
    remote_opportunities = Column(Boolean, default=True)
    future_growth_percentage = Column(Float, default=0.0)
    career_suitability_score = Column(Float, default=0.0)
    required_skills = Column(JSON)
    missing_skills = Column(JSON)
    ai_analysis = Column(Text)
    is_recommended = Column(Boolean, default=False)

    user = relationship("User", back_populates="career_paths")
