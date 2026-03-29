"""DealDrop API — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import add_exception_handlers
from app.db.session import check_db_connection

logger = logging.getLogger("dealdrop")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # ── Startup ───────────────────────────────────────────────
    db_ok = await check_db_connection()
    if db_ok:
        logger.info("✅  Database connection verified")
        try:
            from app.db.session import async_session_factory
            from app.services import deal_service
            async with async_session_factory() as db:
                res = await deal_service.auto_expire_stale_deals(db)
                logger.info(f"🔄 Expired {res['expired']} stale deals on startup")
        except Exception as e:
            logger.error(f"Failed to auto-expire deals: {e}")
    else:
        logger.warning("⚠️  Database connection FAILED — app will start but DB calls will error")
    yield
    # ── Shutdown ──────────────────────────────────────────────
    logger.info("🛑  Shutting down DealDrop API")


def create_app() -> FastAPI:
    """Application factory."""

    docs_url = "/docs" if settings.ENVIRONMENT != "production" else None
    redoc_url = "/redoc" if settings.ENVIRONMENT != "production" else None

    app = FastAPI(
        title="DealDrop API",
        version="0.1.0",
        description="Hyperlocal flash-sale marketplace",
        lifespan=lifespan,
        docs_url=docs_url,
        redoc_url=redoc_url,
    )

    # ── CORS ──────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ────────────────────────────────────
    add_exception_handlers(app)

    # ── Health check ──────────────────────────────────────────
    @app.get("/ping", tags=["health"])
    async def ping():
        return {"status": "ok"}

    # ── Routers ────────────────────────────────────────────────
    from app.routers import auth, users, stores, products, deals
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(users.router, prefix="/users", tags=["users"])
    app.include_router(stores.router, prefix="/stores", tags=["stores"])
    app.include_router(products.router, prefix="/products", tags=["products"])
    app.include_router(deals.router, prefix="/deals", tags=["deals"])

    return app


app = create_app()
