from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "SkillToIncome AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # Database - defaults to SQLite for local dev (no install needed)
    DATABASE_URL: str = "sqlite+aiosqlite:///./skilltoincome.db"
    DATABASE_URL_SYNC: str = "sqlite:///./skilltoincome.db"

    # Redis - set USE_FAKE_REDIS=true to skip Redis install
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_FAKE_REDIS: bool = True

    # JWT
    SECRET_KEY: str = "dev-secret-key-change-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # AI
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: Optional[str] = None
    AI_PROVIDER: str = "openai"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: str = "noreply@skilltoincome.ai"

    # Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:4200",
        "http://localhost:4201",
        "http://127.0.0.1:4200",
        "http://localhost:3000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
