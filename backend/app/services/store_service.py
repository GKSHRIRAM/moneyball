"""Store service — CRUD and onboarding logic."""

from datetime import time
from uuid import UUID

from geoalchemy2 import WKTElement
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.models.store import Store
from app.models.store_policy import StorePolicy
from app.schemas.store import (
    OnboardingStatusOut,
    StoreCreateRequest,
    StorePolicyCreateRequest,
    StoreUpdateRequest,
)


def _parse_time(t: str | None) -> time | None:
    """Parse 'HH:MM' string into a time object."""
    if not t:
        return None
    parts = t.split(":")
    return time(int(parts[0]), int(parts[1]))


async def get_my_store(db: AsyncSession, user_id: UUID) -> Store | None:
    """Return the store owned by this user, or None."""
    result = await db.execute(
        select(Store).where(Store.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_store(
    db: AsyncSession, user_id: UUID, data: StoreCreateRequest
) -> Store:
    """Create a new store for a retailer. One store per retailer."""
    existing = await get_my_store(db, user_id)
    if existing:
        raise ConflictError(detail="Store already exists for this retailer")

    point_wkt = f"POINT({data.lng} {data.lat})"

    store = Store(
        user_id=user_id,
        name=data.name,
        address=data.address,
        lat=data.lat,
        lng=data.lng,
        location=WKTElement(point_wkt, srid=4326),
        category=data.category,
        phone=data.phone,
        open_time=_parse_time(data.open_time),
        close_time=_parse_time(data.close_time),
    )
    db.add(store)
    await db.commit()
    await db.refresh(store)
    return store


async def update_store(
    db: AsyncSession, store: Store, data: StoreUpdateRequest
) -> Store:
    """Update provided fields on an existing store."""
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field in ("open_time", "close_time"):
            setattr(store, field, _parse_time(value))
        else:
            setattr(store, field, value)

    # Recompute location if lat/lng changed
    if "lat" in update_data or "lng" in update_data:
        lat = update_data.get("lat", float(store.lat))
        lng = update_data.get("lng", float(store.lng))
        store.location = WKTElement(f"POINT({lng} {lat})", srid=4326)

    db.add(store)
    await db.commit()
    await db.refresh(store)
    return store


async def create_or_update_policy(
    db: AsyncSession, store_id: UUID, data: StorePolicyCreateRequest
) -> StorePolicy:
    """Upsert store policy — create or update."""
    result = await db.execute(
        select(StorePolicy).where(StorePolicy.store_id == store_id)
    )
    policy = result.scalar_one_or_none()

    if policy:
        # Update existing
        for field, value in data.model_dump().items():
            setattr(policy, field, value)
    else:
        # Create new
        policy = StorePolicy(store_id=store_id, **data.model_dump())

    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return policy


async def get_policy(db: AsyncSession, store_id: UUID) -> StorePolicy | None:
    """Return the policy for a store, or None."""
    result = await db.execute(
        select(StorePolicy).where(StorePolicy.store_id == store_id)
    )
    return result.scalar_one_or_none()


async def get_onboarding_status(
    db: AsyncSession, user_id: UUID
) -> OnboardingStatusOut:
    """Check whether retailer has completed store setup."""
    store = await get_my_store(db, user_id)
    has_store = store is not None
    has_policy = False

    if has_store:
        policy = await db.scalar(
            select(StorePolicy).where(StorePolicy.store_id == store.id)
        )
        has_policy = policy is not None

    return OnboardingStatusOut(
        has_store=has_store,
        has_policy=has_policy,
        is_complete=has_store and has_policy,
    )
