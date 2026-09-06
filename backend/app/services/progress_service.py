from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.repositories.progress_repository import ProgressRepository, NotificationRepository
from app.models.progress import ProgressLog, Notification
from loguru import logger


class ProgressService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ProgressRepository(db)
        self.notif_repo = NotificationRepository(db)

    async def log_progress(self, user_id: int, learning_hours: float, tasks_completed: int, notes: str = None) -> ProgressLog:
        today = date.today()
        existing = await self.repo.get_by_date(user_id, today)

        streak = await self._calculate_streak(user_id)

        if existing:
            existing.learning_hours += learning_hours
            existing.tasks_completed += tasks_completed
            if notes:
                existing.notes = notes
            existing.streak_day = streak
            return await self.repo.update(existing)

        log = ProgressLog(
            user_id=user_id,
            log_date=today,
            learning_hours=learning_hours,
            tasks_completed=tasks_completed,
            notes=notes,
            streak_day=streak,
        )
        saved = await self.repo.create(log)

        # Check achievements
        await self._check_achievements(user_id, streak, saved)
        return saved

    async def _calculate_streak(self, user_id: int) -> int:
        logs = await self.repo.get_by_user(user_id, limit=60)
        if not logs:
            return 1

        streak = 0
        check_date = date.today() - timedelta(days=1)
        log_dates = {log.log_date for log in logs}

        while check_date in log_dates:
            streak += 1
            check_date -= timedelta(days=1)

        return streak + 1

    async def _check_achievements(self, user_id: int, streak: int, log: ProgressLog):
        achievements = []
        if streak == 7:
            achievements.append("7-Day Streak!")
            await self._create_notification(user_id, "7-Day Streak!", "You have been learning for 7 days straight!")
        elif streak == 30:
            achievements.append("30-Day Streak!")
            await self._create_notification(user_id, "30-Day Streak!", "Incredible! 30 days of consistent learning!")

        if log.tasks_completed >= 5:
            achievements.append("Productive Day!")

        if achievements:
            log.achievements = achievements
            await self.repo.update(log)

    async def _create_notification(self, user_id: int, title: str, message: str):
        notif = Notification(user_id=user_id, title=title, message=message, notification_type="achievement")
        await self.notif_repo.create(notif)

    async def get_weekly_stats(self, user_id: int) -> dict:
        logs = await self.repo.get_by_user(user_id, limit=7)
        total_hours = sum(l.learning_hours for l in logs)
        total_tasks = sum(l.tasks_completed for l in logs)
        current_streak = logs[0].streak_day if logs else 0
        return {
            "total_learning_hours": total_hours,
            "total_tasks_completed": total_tasks,
            "current_streak": current_streak,
            "days_logged": len(logs),
            "daily_logs": [
                {
                    "date": str(l.log_date),
                    "hours": l.learning_hours,
                    "tasks": l.tasks_completed,
                    "achievements": l.achievements or [],
                }
                for l in reversed(logs)
            ],
        }

    async def get_monthly_stats(self, user_id: int) -> dict:
        logs = await self.repo.get_by_user(user_id, limit=30)
        total_hours = sum(l.learning_hours for l in logs)
        total_tasks = sum(l.tasks_completed for l in logs)
        return {
            "total_learning_hours": total_hours,
            "total_tasks_completed": total_tasks,
            "days_logged": len(logs),
            "average_daily_hours": round(total_hours / max(len(logs), 1), 2),
        }
