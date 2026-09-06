import json
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.roadmap_repository import RoadmapRepository, RoadmapTaskRepository
from app.repositories.career_repository import CareerRepository
from app.repositories.skill_repository import UserSkillRepository, UserProfileRepository
from app.models.roadmap import Roadmap, RoadmapTask, TaskStatus
from app.schemas.roadmap import RoadmapGenerateRequest
from app.ai.ai_client import call_ai, parse_ai_json
from app.ai.prompts import ROADMAP_GENERATION_PROMPT
from app.core.exceptions import NotFoundException
from app.utils.youtube_search import search_youtube_video
from loguru import logger


class RoadmapService:
    def __init__(self, db: AsyncSession):
        self.repo = RoadmapRepository(db)
        self.task_repo = RoadmapTaskRepository(db)
        self.career_repo = CareerRepository(db)
        self.skill_repo = UserSkillRepository(db)
        self.profile_repo = UserProfileRepository(db)

    async def generate_roadmap(self, user_id: int, request: RoadmapGenerateRequest) -> Roadmap:
        skills = await self.skill_repo.get_by_user(user_id)
        profile = await self.profile_repo.get_by_user(user_id)
        learning_hours = profile.learning_hours_per_day if profile else 2.0

        career_title = request.career_title
        missing_skills = []

        if request.career_path_id:
            career = await self.career_repo.get_by_id(request.career_path_id)
            if career:
                career_title = career.title
                missing_skills = career.missing_skills or []

        if not career_title:
            raise NotFoundException("Career title is required")

        skills_str = ", ".join([f"{s.skill_name} ({s.level})" for s in skills])
        missing_str = ", ".join(missing_skills) if missing_skills else "None identified yet"

        # Calculate number of weeks based on duration
        duration_to_weeks = {
            "30_days": 4,   # 4 weeks = 28 days
            "60_days": 8,   # 8 weeks = 56 days  
            "90_days": 13,  # 13 weeks = 91 days
            "180_days": 26, # 26 weeks = 182 days (6 months)
        }
        weeks_count = duration_to_weeks.get(request.duration.value, 8)
        total_tasks = weeks_count * 7  # 7 days per week

        logger.info(f"Generating roadmap: {career_title}, Duration: {request.duration.value}, Weeks: {weeks_count}, Total tasks: {total_tasks}")

        prompt = ROADMAP_GENERATION_PROMPT.format(
            career_title=career_title,
            duration=request.duration.value,
            weeks_count=weeks_count,
            total_tasks=total_tasks,
            skills=skills_str,
            missing_skills=missing_str,
            learning_hours=learning_hours,
        )

        response = await call_ai(prompt)
        roadmap_data = await parse_ai_json(response)

        # unwrap root key for Groq compatibility
        if isinstance(roadmap_data, dict) and "roadmap" in roadmap_data:
            roadmap_data = roadmap_data["roadmap"]

        # Deactivate previous roadmaps
        existing = await self.repo.get_active_by_user(user_id)
        if existing:
            existing.is_active = False
            await self.repo.update(existing)

        roadmap = Roadmap(
            user_id=user_id,
            career_path_id=request.career_path_id,
            title=roadmap_data.get("title", f"{career_title} Roadmap"),
            duration=request.duration,
            description=roadmap_data.get("description", ""),
            ai_generated_content=roadmap_data,
            is_active=True,
        )
        saved_roadmap = await self.repo.create(roadmap)

        # Create tasks from weeks
        for week in roadmap_data.get("weeks", []):
            week_num = week.get("week_number", 1)
            for task_data in week.get("tasks", []):
                task_title = task_data.get("title", "")
                existing_resources = task_data.get("resources", [])

                # Fetch real YouTube video for this task
                yt_result = await search_youtube_video(f"{career_title} {task_title}")

                # Filter out any AI-hallucinated youtube links, keep only non-youtube resources
                clean_resources = [
                    r for r in existing_resources
                    if "youtube.com" not in r.get("url", "") and "youtu.be" not in r.get("url", "")
                ]

                # Add real YouTube result at front
                if yt_result:
                    clean_resources = [yt_result] + clean_resources

                task = RoadmapTask(
                    roadmap_id=saved_roadmap.id,
                    week_number=week_num,
                    day_number=task_data.get("day_number"),
                    title=task_title,
                    description=task_data.get("description", ""),
                    resources=clean_resources,
                    estimated_hours=task_data.get("estimated_hours", 1.0),
                    is_milestone=task_data.get("is_milestone", False),
                )
                await self.task_repo.create(task)

        return await self.repo.get_with_tasks(saved_roadmap.id)

    async def update_task_status(self, user_id: int, task_id: int, status: TaskStatus) -> RoadmapTask:
        task = await self.task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task")
        task.status = status
        updated = await self.task_repo.update(task)

        # Recalculate roadmap completion
        roadmap = await self.repo.get_with_tasks(task.roadmap_id)
        if roadmap and roadmap.user_id == user_id:
            total = len(roadmap.tasks)
            completed = sum(1 for t in roadmap.tasks if t.status == TaskStatus.COMPLETED)
            roadmap.completion_percentage = (completed / total * 100) if total > 0 else 0
            await self.repo.update(roadmap)

        return updated

    async def get_user_roadmaps(self, user_id: int):
        return await self.repo.get_by_user(user_id)
