import json
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.skill_repository import UserSkillRepository, UserProfileRepository
from app.models.skill import UserSkill, UserProfile
from app.schemas.skill import SkillCreate, UserProfileCreate, AssessmentRequest
from app.ai.ai_client import call_ai, parse_ai_json
from app.ai.prompts import SKILL_ASSESSMENT_PROMPT
from loguru import logger


class SkillService:
    def __init__(self, db: AsyncSession):
        self.skill_repo = UserSkillRepository(db)
        self.profile_repo = UserProfileRepository(db)

    async def save_assessment(self, user_id: int, data: AssessmentRequest) -> dict:
        # Clear existing skills and replace
        await self.skill_repo.delete_by_user(user_id)

        saved_skills = []
        for skill_data in data.skills:
            skill = UserSkill(user_id=user_id, **skill_data.model_dump())
            saved = await self.skill_repo.create(skill)
            saved_skills.append(saved)

        # Upsert profile
        profile = await self.profile_repo.get_by_user(user_id)
        profile_data = data.profile.model_dump()
        profile_data["interests"] = json.dumps(profile_data.get("interests", []))
        profile_data["career_goals"] = json.dumps(profile_data.get("career_goals", []))

        if profile:
            for k, v in profile_data.items():
                setattr(profile, k, v)
            await self.profile_repo.update(profile)
        else:
            profile = UserProfile(user_id=user_id, **profile_data)
            profile = await self.profile_repo.create(profile)

        return {"skills": saved_skills, "profile": profile}

    async def get_user_skills(self, user_id: int) -> List[UserSkill]:
        return await self.skill_repo.get_by_user(user_id)

    async def get_user_profile(self, user_id: int) -> Optional[UserProfile]:
        profile = await self.profile_repo.get_by_user(user_id)
        if profile:
            # Parse JSON strings back to lists
            if profile.interests and isinstance(profile.interests, str):
                try:
                    profile.interests = json.loads(profile.interests)
                except Exception:
                    profile.interests = []
            if profile.career_goals and isinstance(profile.career_goals, str):
                try:
                    profile.career_goals = json.loads(profile.career_goals)
                except Exception:
                    profile.career_goals = []
        return profile

    async def analyze_skills(self, user_id: int) -> dict:
        skills = await self.skill_repo.get_by_user(user_id)
        profile = await self.get_user_profile(user_id)

        skills_list = "\n".join([f"- {s.skill_name} ({s.level})" for s in skills])
        interests = ", ".join(profile.interests if profile and profile.interests else [])
        career_goals = ", ".join(profile.career_goals if profile and profile.career_goals else [])

        prompt = SKILL_ASSESSMENT_PROMPT.format(
            skills_list=skills_list,
            interests=interests,
            career_goals=career_goals,
        )
        response = await call_ai(prompt)
        result = await parse_ai_json(response)
        # unwrap root key
        if isinstance(result, dict) and "assessment" in result:
            result = result["assessment"]
        return result
