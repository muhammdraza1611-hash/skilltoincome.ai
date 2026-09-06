from sqlalchemy import Column, Integer, Float, Text, ForeignKey, JSON, String
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class PortfolioReview(Base, TimestampMixin):
    __tablename__ = "portfolio_reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    portfolio_url = Column(String(500))
    github_url = Column(String(500))
    quality_score = Column(Float, default=0.0)        # 0-100
    resume_readiness_score = Column(Float, default=0.0)
    recruiter_attractiveness_score = Column(Float, default=0.0)
    missing_projects = Column(JSON)
    improvement_suggestions = Column(JSON)
    strengths = Column(JSON)
    ai_analysis = Column(Text)

    user = relationship("User", back_populates="portfolio_reviews")
