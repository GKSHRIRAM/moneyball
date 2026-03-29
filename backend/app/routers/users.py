from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdateRequest

router = APIRouter()


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Return the currently authenticated user."""
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UserUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update profile details for the current user."""
    if data.name is not None:
        current_user.name = data.name
    if data.phone is not None:
        current_user.phone = data.phone

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return current_user
