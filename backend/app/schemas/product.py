"""Product Pydantic v2 schemas."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

from app.core.constants import StoreCategory


# ── Risk helpers ──────────────────────────────────────────────

def _risk_label(score: int) -> str:
    if score <= 30:
        return "safe"
    if score <= 60:
        return "watch"
    if score <= 85:
        return "urgent"
    return "critical"


# ── Request schemas ───────────────────────────────────────────


class ProductCreateRequest(BaseModel):
    name: str = Field(min_length=2)
    category: StoreCategory
    mrp: Decimal = Field(gt=0)
    cost_price: Decimal = Field(gt=0)
    batch_number: str | None = None
    expiry_date: date
    quantity: int = Field(gt=0)
    image_url: str | None = None

    @field_validator("expiry_date")
    @classmethod
    def expiry_not_in_past(cls, v: date) -> date:
        if v < date.today():
            raise ValueError("Expiry date cannot be in the past")
        return v


class ProductUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2)
    category: StoreCategory | None = None
    mrp: Decimal | None = Field(default=None, gt=0)
    cost_price: Decimal | None = Field(default=None, gt=0)
    batch_number: str | None = None
    expiry_date: date | None = None
    quantity: int | None = Field(default=None, gt=0)
    image_url: str | None = None

    @field_validator("expiry_date")
    @classmethod
    def expiry_not_in_past(cls, v: date | None) -> date | None:
        if v is not None and v < date.today():
            raise ValueError("Expiry date cannot be in the past")
        return v


# ── Response schemas ──────────────────────────────────────────


class ProductOut(BaseModel):
    id: UUID
    store_id: UUID
    name: str
    category: StoreCategory
    mrp: float
    cost_price: float
    batch_number: str | None
    expiry_date: date
    quantity: int
    risk_score: int
    image_url: str | None
    created_at: datetime
    updated_at: datetime

    @computed_field  # type: ignore[misc]
    @property
    def days_to_expiry(self) -> int:
        return (self.expiry_date - date.today()).days

    @computed_field  # type: ignore[misc]
    @property
    def risk_label(self) -> str:
        return _risk_label(self.risk_score)

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int


class CSVUploadResponse(BaseModel):
    created: int
    skipped: int
    errors: list[str]
