"""Store & StorePolicy Pydantic v2 schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.constants import FulfillmentMode, StoreCategory


# ── Store Schemas ─────────────────────────────────────────────


class StoreCreateRequest(BaseModel):
    name: str = Field(min_length=2)
    address: str
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    category: StoreCategory
    phone: str | None = None
    open_time: str | None = None  # "HH:MM"
    close_time: str | None = None  # "HH:MM"


class StoreUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2)
    address: str | None = None
    lat: float | None = Field(default=None, ge=-90, le=90)
    lng: float | None = Field(default=None, ge=-180, le=180)
    category: StoreCategory | None = None
    phone: str | None = None
    open_time: str | None = None
    close_time: str | None = None


class StorePolicyOut(BaseModel):
    id: UUID
    store_id: UUID
    min_discount_pct: int
    auto_approve: bool
    fulfillment_mode: FulfillmentMode
    hide_outside_hours: bool
    enabled_categories: list[str] | None

    model_config = ConfigDict(from_attributes=True)


class StoreOut(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    address: str
    lat: float
    lng: float
    category: StoreCategory
    phone: str | None
    open_time: str | None
    close_time: str | None
    is_active: bool
    created_at: datetime
    policy: StorePolicyOut | None = None

    model_config = ConfigDict(from_attributes=True)


# ── Store Policy Schemas ──────────────────────────────────────


class StorePolicyCreateRequest(BaseModel):
    min_discount_pct: int = Field(default=15, ge=5, le=80)
    auto_approve: bool = False
    fulfillment_mode: FulfillmentMode = FulfillmentMode.pickup
    hide_outside_hours: bool = False
    enabled_categories: list[str] = ["bakery", "grocery", "fmcg"]


# ── Onboarding ────────────────────────────────────────────────


class OnboardingStatusOut(BaseModel):
    has_store: bool
    has_policy: bool
    is_complete: bool
