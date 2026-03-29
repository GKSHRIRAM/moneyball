from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

from app.core.constants import UserRole


class UserOut(BaseModel):
    id: UUID
    email: str
    name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2)
    phone: str | None = Field(default=None)
