from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import security
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, UnauthorizedError
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest


async def register(db: AsyncSession, data: RegisterRequest) -> User:
    # Check if email exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise ConflictError(detail="Email already registered")

    # Hash password
    hashed = security.hash_password(data.password)

    # Create user
    user = User(
        email=data.email,
        password_hash=hashed,
        role=data.role,
        name=data.name,
        phone=data.phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


async def login(db: AsyncSession, data: LoginRequest) -> tuple[User, str, str]:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedError(detail="Invalid email or password")
    
    if not security.verify_password(data.password, user.password_hash):
        raise UnauthorizedError(detail="Invalid email or password")
    
    if not user.is_active:
        raise ForbiddenError(detail="Account is disabled")

    access_token = security.create_access_token(str(user.id), user.role.value)
    refresh_token = security.create_refresh_token(str(user.id))

    return user, access_token, refresh_token


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> tuple[str, str]:
    payload = security.decode_token(refresh_token)
    
    if payload.get("type") != "refresh":
        raise UnauthorizedError(detail="Invalid token type")
    
    try:
        user_id = UUID(payload["sub"])
    except ValueError:
        raise UnauthorizedError(detail="Invalid sub format")

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise UnauthorizedError(detail="User not found or inactive")

    access_token = security.create_access_token(str(user.id), user.role.value)
    new_refresh = security.create_refresh_token(str(user.id))

    return access_token, new_refresh


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User:
    user = await db.get(User, user_id)
    if not user:
        raise NotFoundError(detail="User not found")
    return user
