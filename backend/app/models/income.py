from sqlalchemy import Column, Integer, Float, Text, ForeignKey, JSON, String
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class IncomePrediction(Base, TimestampMixin):
    __tablename__ = "income_predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    career_path = Column(String(200))
    freelance_monthly_min = Column(Float, default=0.0)
    freelance_monthly_max = Column(Float, default=0.0)
    job_salary_annual_min = Column(Float, default=0.0)
    job_salary_annual_max = Column(Float, default=0.0)
    time_to_first_client_days = Column(Integer, default=0)
    time_to_first_income_days = Column(Integer, default=0)
    growth_projection = Column(JSON)   # [{month: 1, income: 500}, ...]
    fiverr_niches = Column(JSON)
    upwork_categories = Column(JSON)
    gig_titles = Column(JSON)
    ai_analysis = Column(Text)

    user = relationship("User", back_populates="income_predictions")
