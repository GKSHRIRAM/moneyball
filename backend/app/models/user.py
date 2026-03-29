"""User model."""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import UserRole
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="userrole", create_constraint=True), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    # ── Relationships (lazy, populated in later phases) ───────
    stores = relationship("Store", back_populates="owner", lazy="selectin")
    consumer_profile = relationship(
        "ConsumerProfile", back_populates="user", uselist=False, lazy="selectin"
    )
    reservations = relationship("Reservation", back_populates="consumer", lazy="selectin")
