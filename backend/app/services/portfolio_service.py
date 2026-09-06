import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.skill_repository import UserSkillRepository, UserProfileRepository
from app.models.portfolio import PortfolioReview
from app.ai.ai_client import call_ai, parse_ai_json
from app.ai.prompts import PORTFOLIO_ANALYSIS_PROMPT
from sqlalchemy import select


class PortfolioService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.skill_repo = UserSkillRepository(db)
        self.profile_repo = UserProfileRepository(db)

    async def analyze_portfolio(self, user_id: int, portfolio_url: str, github_url: str, career_goal: str) -> PortfolioReview:
        skills = await self.skill_repo.get_by_user(user_id)
        skills_str = ", ".join([s.skill_name for s in skills])

        prompt = PORTFOLIO_ANALYSIS_PROMPT.format(
            portfolio_url=portfolio_url or "Not provided",
            github_url=github_url or "Not provided",
            skills=skills_str,
            career_goal=career_goal or "General software development",
        )

        response = await call_ai(prompt)
        data = await parse_ai_json(response)

        # unwrap root key
        if isinstance(data, dict) and "review" in data:
            data = data["review"]

        review = PortfolioReview(
            user_id=user_id,
            portfolio_url=portfolio_url,
            github_url=github_url,
            quality_score=data.get("quality_score", 0),
            resume_readiness_score=data.get("resume_readiness_score", 0),
            recruiter_attractiveness_score=data.get("recruiter_attractiveness_score", 0),
            missing_projects=data.get("missing_projects", []),
            improvement_suggestions=data.get("improvement_suggestions", []),
            strengths=data.get("strengths", []),
            ai_analysis=data.get("analysis", ""),
        )
        self.db.add(review)
        await self.db.commit()
        await self.db.refresh(review)
        return review

    async def get_user_reviews(self, user_id: int):
        result = await self.db.execute(
            select(PortfolioReview).where(PortfolioReview.user_id == user_id).order_by(PortfolioReview.created_at.desc())
        )
        return list(result.scalars().all())
