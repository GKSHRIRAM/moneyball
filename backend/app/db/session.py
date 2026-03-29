"""Async SQLAlchemy engine, session factory, and health check."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.ENVIRONMENT == "development"),
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)



async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    """Yield an AsyncSession with auto-close."""
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


async def check_db_connection() -> bool:
    """Run SELECT 1 to verify the database is reachable."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
