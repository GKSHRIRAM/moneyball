from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RefreshRequest, RegisterRequest
from app.services import auth_service

router = APIRouter()


@router.post("/register", status_code=201, response_model=AuthResponse)
async def register(
    data: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new consumer or retailer."""
    user = await auth_service.register(db, data)
    
    # Auto-login to issue tokens
    login_data = LoginRequest(email=data.email, password=data.password)
    _, access_token, refresh_token = await auth_service.login(db, login_data)

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    data: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Authenticate and return JWT tokens."""
    user, access_token, refresh_token = await auth_service.login(db, data)
    
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user,
    )


@router.post("/refresh", response_model=AuthResponse)
async def refresh(
    data: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Exchange a valid refresh token for a new access & refresh token pair."""
    access_token, new_refresh_token = await auth_service.refresh_tokens(
        db, data.refresh_token
    )
    
    from app.core.security import decode_token
    payload = decode_token(access_token)
    from uuid import UUID
    user = await auth_service.get_user_by_id(db, UUID(payload["sub"]))

    return AuthResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=user,
    )


@router.post("/logout")
async def logout(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Backend logout. Tokens are stateless in MVP, so this just confirms 
    the request was authorized. Frontend clears tokens.
    """
    return {"message": "Successfully logged out"}
