"""Consolidated model imports for Alembic and the application."""

from app.db.base import Base
from app.models.user import User
from app.models.store import Store
from app.models.store_policy import StorePolicy
from app.models.product import Product
from app.models.category import Category
from app.models.deal import Deal
from app.models.reservation import Reservation
from app.models.consumer_profile import ConsumerProfile

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
