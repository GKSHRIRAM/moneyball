"""Consolidated model imports for Alembic and the application."""

from app.db.base import Base
from app.models.user import User
from app.models.store import Store
from app.models.product import Product
from app.models.deal import Deal
from app.models.reservation import Reservation
# from app.models.consumer import ConsumerProfile

__all__ = [
    "Base",
    "User",
    "Store",
    "StorePolicy",
    "Product",
    "Category",
    "Deal",
    "Reservation",
    "ConsumerProfile",
]
