from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Float, Text, ARRAY
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base, TimestampMixin


class SkillLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class UserSkill(Base, TimestampMixin):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(200), nullable=False)
    level = Column(Enum(SkillLevel), default=SkillLevel.BEGINNER, nullable=False)
    years_experience = Column(Float, default=0.0)
    is_primary = Column(Integer, default=0)  # 0=no, 1=yes

    user = relationship("User", back_populates="skills")


class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    interests = Column(Text, nullable=True)          # JSON string list
    career_goals = Column(Text, nullable=True)       # JSON string list
    learning_hours_per_day = Column(Float, default=2.0)
    current_occupation = Column(String(200), nullable=True)
    education_level = Column(String(100), nullable=True)
    location = Column(String(200), nullable=True)
    github_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
