"""Run this once to create all database tables."""
import asyncio
from app.db.session import async_engine
from app.db.base import Base
from app.models import *  # noqa - import all models


async def create_tables():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created successfully!")
    await async_engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_tables())
