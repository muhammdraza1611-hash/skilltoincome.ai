import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.skill_repository import UserSkillRepository, UserProfileRepository
from app.models.income import IncomePrediction
from app.ai.ai_client import call_ai, parse_ai_json
from app.ai.prompts import INCOME_PREDICTION_PROMPT
from sqlalchemy import select


class IncomeService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.skill_repo = UserSkillRepository(db)
        self.profile_repo = UserProfileRepository(db)

    async def predict_income(self, user_id: int, career_path: str) -> IncomePrediction:
        skills = await self.skill_repo.get_by_user(user_id)
        profile = await self.profile_repo.get_by_user(user_id)

        skills_str = ", ".join([s.skill_name for s in skills])
        skill_levels = ", ".join([f"{s.skill_name}: {s.level}" for s in skills])
        learning_hours = profile.learning_hours_per_day if profile else 2.0
        location = profile.location if profile else "Global"

        prompt = INCOME_PREDICTION_PROMPT.format(
            career_path=career_path,
            skills=skills_str,
            skill_levels=skill_levels,
            learning_hours=learning_hours,
            location=location,
        )

        response = await call_ai(prompt)
        data = await parse_ai_json(response)

        # unwrap root key if Groq wraps it
        if isinstance(data, dict) and "prediction" in data:
            data = data["prediction"]

        prediction = IncomePrediction(
            user_id=user_id,
            career_path=career_path,
            freelance_monthly_min=data.get("freelance_monthly_min", 0),
            freelance_monthly_max=data.get("freelance_monthly_max", 0),
            job_salary_annual_min=data.get("job_salary_annual_min", 0),
            job_salary_annual_max=data.get("job_salary_annual_max", 0),
            time_to_first_client_days=data.get("time_to_first_client_days", 0),
            time_to_first_income_days=data.get("time_to_first_income_days", 0),
            growth_projection=data.get("growth_projection", []),
            fiverr_niches=data.get("fiverr_niches", []),
            upwork_categories=data.get("upwork_categories", []),
            gig_titles=data.get("gig_titles", []),
            ai_analysis=data.get("analysis", ""),
        )
        self.db.add(prediction)
        await self.db.commit()
        await self.db.refresh(prediction)
        return prediction

    async def get_user_predictions(self, user_id: int):
        result = await self.db.execute(
            select(IncomePrediction).where(IncomePrediction.user_id == user_id).order_by(IncomePrediction.created_at.desc())
        )
        return list(result.scalars().all())
