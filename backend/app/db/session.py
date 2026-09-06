from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import create_engine
from app.core.config import settings

# Async engine
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}
elif "postgresql" in settings.DATABASE_URL:
    connect_args = {"ssl": "disable"}

async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Sync engine (for Alembic / create_tables)
sync_connect_args = {}
if "sqlite" in settings.DATABASE_URL_SYNC:
    sync_connect_args = {"check_same_thread": False}
elif "postgresql" in settings.DATABASE_URL_SYNC:
    sync_connect_args = {"sslmode": "disable"}

sync_engine = create_engine(
    settings.DATABASE_URL_SYNC,
    echo=settings.DEBUG,
    connect_args=sync_connect_args,
)
