"""Product model — retailer inventory items."""

from datetime import date, datetime, timezone
from uuid import uuid4

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import StoreCategory
from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    store_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stores.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[StoreCategory] = mapped_column(
        Enum(StoreCategory, name="storecategory", create_constraint=True,
             create_type=False),
        index=True,
        nullable=False,
    )
    mrp: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    cost_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    batch_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    expiry_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)
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

    # ── Relationships ─────────────────────────────────────────
    store = relationship("Store", back_populates="products")
    deals = relationship("Deal", back_populates="product", lazy="selectin")
