import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.career_repository import CareerRepository
from app.repositories.skill_repository import UserSkillRepository, UserProfileRepository
from app.models.career import CareerPath
from app.ai.ai_client import call_ai, parse_ai_json
from app.ai.prompts import CAREER_ANALYSIS_PROMPT
from app.core.exceptions import NotFoundException
from loguru import logger


class CareerService:
    def __init__(self, db: AsyncSession):
        self.repo = CareerRepository(db)
        self.skill_repo = UserSkillRepository(db)
        self.profile_repo = UserProfileRepository(db)

    async def analyze_careers(self, user_id: int) -> list:
        skills = await self.skill_repo.get_by_user(user_id)
        if not skills:
            raise NotFoundException("Skills - Please complete skill assessment first")

        profile = await self.profile_repo.get_by_user(user_id)

        skills_str = ", ".join([s.skill_name for s in skills])
        skill_levels = ", ".join([f"{s.skill_name}: {s.level}" for s in skills])

        interests = []
        career_goals = []
        learning_hours = 2.0
        location = "Global"

        if profile:
            if profile.interests:
                try:
                    interests = json.loads(profile.interests) if isinstance(profile.interests, str) else profile.interests
                except Exception:
                    interests = []
            if profile.career_goals:
                try:
                    career_goals = json.loads(profile.career_goals) if isinstance(profile.career_goals, str) else profile.career_goals
                except Exception:
                    career_goals = []
            learning_hours = profile.learning_hours_per_day or 2.0
            location = profile.location or "Global"

        prompt = CAREER_ANALYSIS_PROMPT.format(
            skills=skills_str,
            skill_levels=skill_levels,
            interests=", ".join(interests),
            career_goals=", ".join(career_goals),
            learning_hours=learning_hours,
            location=location,
        )

        response = await call_ai(prompt)
        career_data = await parse_ai_json(response)

        if isinstance(career_data, dict) and "career_paths" in career_data:
            career_data = career_data["career_paths"]

        saved_paths = []
        for item in career_data:
            career = CareerPath(
                user_id=user_id,
                title=item.get("title", ""),
                description=item.get("description", ""),
                market_demand_score=item.get("market_demand_score", 0),
                difficulty_level=item.get("difficulty_level", "medium"),
                avg_salary_min=item.get("avg_salary_min", 0),
                avg_salary_max=item.get("avg_salary_max", 0),
                remote_opportunities=item.get("remote_opportunities", True),
                future_growth_percentage=item.get("future_growth_percentage", 0),
                career_suitability_score=item.get("career_suitability_score", 0),
                required_skills=item.get("required_skills", []),
                missing_skills=item.get("missing_skills", []),
                is_recommended=item.get("is_recommended", False),
                ai_analysis=json.dumps(item),
            )
            saved = await self.repo.create(career)
            saved_paths.append(saved)

        return saved_paths

    async def get_user_careers(self, user_id: int) -> list:
        return await self.repo.get_by_user(user_id)
