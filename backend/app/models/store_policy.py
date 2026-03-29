"""Store policy model — per-store configuration."""

from __future__ import annotations

from datetime import datetime, time, timezone
from typing import Any, Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Time
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import FulfillmentMode
from app.db.base import Base


class StorePolicy(Base):
    __tablename__ = "store_policies"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    store_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    min_discount_pct: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    auto_approve: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    fulfillment_mode: Mapped[FulfillmentMode] = mapped_column(
        Enum(FulfillmentMode, name="fulfillmentmode", create_constraint=True),
        default=FulfillmentMode.pickup,
        nullable=False,
    )
    hide_outside_hours: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    enabled_categories = mapped_column(
        JSON, default=["bakery", "grocery", "fmcg"], nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ── Retailer onboarding & strategy (see migration 0002) ───
    retail_domain: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    target_product_types: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    pickup_window_start: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    pickup_window_end: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    pickup_all_business_hours: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    min_base_discount_pct: Mapped[int] = mapped_column(Integer, default=20, nullable=False)
    max_markdown_limit_pct: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    markdown_trigger: Mapped[str] = mapped_column(
        String(32), default="24h_before", nullable=False
    )
    packaging_policy: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    allergen_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notification_preference: Mapped[str] = mapped_column(
        String(32), default="in_app", nullable=False
    )

    # ── Relationships ─────────────────────────────────────────
    store = relationship("Store", back_populates="policies")
