"""Store routes — retailer store management & onboarding."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserRole
from app.core.dependencies import get_current_user, get_db, require_role
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.schemas.store import (
    OnboardingStatusOut,
    StoreCreateRequest,
    StoreOut,
    StorePolicyCreateRequest,
    StorePolicyOut,
    StoreUpdateRequest,
)
from app.services import store_service

router = APIRouter()

# All routes require retailer role
RetailerUser = Annotated[User, Depends(require_role(UserRole.retailer))]
DB = Annotated[AsyncSession, Depends(get_db)]


def _store_to_out(store) -> StoreOut:
    """Convert Store ORM to StoreOut, handling PostGIS and time fields."""
    return StoreOut(
        id=store.id,
        user_id=store.user_id,
        name=store.name,
        address=store.address,
        lat=float(store.lat),
        lng=float(store.lng),
        category=store.category,
        phone=store.phone,
        open_time=store.open_time.strftime("%H:%M") if store.open_time else None,
        close_time=store.close_time.strftime("%H:%M") if store.close_time else None,
        is_active=store.is_active,
        created_at=store.created_at,
        policy=store.policies if store.policies else None,
    )


@router.get("/me", response_model=StoreOut)
async def get_my_store(user: RetailerUser, db: DB):
    """Get the current retailer's store."""
    store = await store_service.get_my_store(db, user.id)
    if not store:
        raise NotFoundError(detail="Store not found. Complete onboarding first.")
    return _store_to_out(store)


@router.post("", status_code=201, response_model=StoreOut)
async def create_store(
    data: StoreCreateRequest,
    user: RetailerUser,
    db: DB,
):
    """Create a new store for the authenticated retailer."""
    store = await store_service.create_store(db, user.id, data)
    return _store_to_out(store)


@router.put("/me", response_model=StoreOut)
async def update_store(
    data: StoreUpdateRequest,
    user: RetailerUser,
    db: DB,
):
    """Update the current retailer's store."""
    store = await store_service.get_my_store(db, user.id)
    if not store:
        raise NotFoundError(detail="Store not found")
    updated = await store_service.update_store(db, store, data)
    return _store_to_out(updated)


@router.post("/me/policies", response_model=StorePolicyOut)
async def save_policy(
    data: StorePolicyCreateRequest,
    user: RetailerUser,
    db: DB,
):
    """Create or update listing policies for the retailer's store."""
    store = await store_service.get_my_store(db, user.id)
    if not store:
        raise NotFoundError(detail="Store not found. Create a store first.")
    policy = await store_service.create_or_update_policy(db, store.id, data)
    return policy


@router.get("/me/policies", response_model=StorePolicyOut)
async def get_policy(
    user: RetailerUser,
    db: DB,
):
    """Get listing policies for the retailer's store."""
    store = await store_service.get_my_store(db, user.id)
    if not store:
        raise NotFoundError(detail="Store not found")
    policy = await store_service.get_policy(db, store.id)
    if not policy:
        raise NotFoundError(detail="Policies not configured yet")
    return policy


@router.get("/me/onboarding", response_model=OnboardingStatusOut)
async def get_onboarding_status(
    user: RetailerUser,
    db: DB,
):
    """Check onboarding completion status."""
    return await store_service.get_onboarding_status(db, user.id)
