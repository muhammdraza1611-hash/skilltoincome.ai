import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.progress_repository import ChatRepository
from app.repositories.skill_repository import UserSkillRepository, UserProfileRepository
from app.repositories.roadmap_repository import RoadmapRepository
from app.models.progress import ChatMessage
from app.ai.ai_client import call_ai
from app.ai.prompts import MENTOR_CHAT_SYSTEM_PROMPT
from loguru import logger


class ChatService:
    def __init__(self, db: AsyncSession):
        self.chat_repo = ChatRepository(db)
        self.skill_repo = UserSkillRepository(db)
        self.profile_repo = UserProfileRepository(db)
        self.roadmap_repo = RoadmapRepository(db)

    async def chat(self, user_id: int, message: str, session_id: str, user_name: str) -> str:
        skills = await self.skill_repo.get_by_user(user_id)
        profile = await self.profile_repo.get_by_user(user_id)
        roadmap = await self.roadmap_repo.get_active_by_user(user_id)

        skills_str = ", ".join([s.skill_name for s in skills]) if skills else "Not specified"
        career_goal = "Not specified"
        learning_hours = 2.0
        progress = 0

        if profile and profile.career_goals:
            import json
            try:
                goals = json.loads(profile.career_goals) if isinstance(profile.career_goals, str) else profile.career_goals
                career_goal = ", ".join(goals) if goals else "Not specified"
            except Exception:
                pass
            learning_hours = profile.learning_hours_per_day or 2.0

        if roadmap:
            progress = roadmap.completion_percentage

        system_prompt = MENTOR_CHAT_SYSTEM_PROMPT.format(
            name=user_name,
            skills=skills_str,
            career_goal=career_goal,
            progress=round(progress, 1),
            learning_hours=learning_hours,
        )

        # Get conversation history for context
        history = await self.chat_repo.get_by_session(user_id, session_id, limit=10)
        history_context = ""
        if history:
            for msg in history[-6:]:  # last 3 exchanges
                history_context += f"{msg.role.capitalize()}: {msg.content}\n"

        full_message = f"{history_context}User: {message}"

        response = await call_ai(full_message, system_prompt=system_prompt, expect_json=False)

        # Save both messages
        user_msg = ChatMessage(user_id=user_id, role="user", content=message, session_id=session_id)
        assistant_msg = ChatMessage(user_id=user_id, role="assistant", content=response, session_id=session_id)
        await self.chat_repo.create(user_msg)
        await self.chat_repo.create(assistant_msg)

        return response

    async def get_chat_history(self, user_id: int, session_id: str):
        return await self.chat_repo.get_by_session(user_id, session_id)
