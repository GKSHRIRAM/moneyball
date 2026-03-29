from pydantic import BaseModel, EmailStr, Field

from app.core.constants import UserRole
from app.schemas.user import UserOut


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2)
    phone: str | None = None
    role: UserRole

    # Need a validator if we want to strictly disallow 'admin' here if it existed,
    # but currently UserRole only has consumer/retailer anyway


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut
