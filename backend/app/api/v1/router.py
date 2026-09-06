from fastapi import APIRouter
from app.api.v1 import auth, skills, careers, roadmaps, income, portfolio, chat, progress, admin, build, jobs

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(skills.router)
api_router.include_router(careers.router)
api_router.include_router(roadmaps.router)
api_router.include_router(income.router)
api_router.include_router(portfolio.router)
api_router.include_router(chat.router)
api_router.include_router(progress.router)
api_router.include_router(admin.router)
api_router.include_router(build.router)
api_router.include_router(jobs.router)
