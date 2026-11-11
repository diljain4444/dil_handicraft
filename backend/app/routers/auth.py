"""Auth router: token login, registration, and current user endpoint."""

from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
)
from app.config import settings
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_optional_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)


async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_optional_scheme),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Return the authenticated user if a valid Bearer token is provided, else None."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if not username:
            return None
        result = await db.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        if user and user.is_active:
            return user
    except Exception:
        return None
    return None


class Token(BaseModel):
    """JWT access token response."""
    access_token: str
    token_type: str


class UserCreateRequest(BaseModel):
    """Request body for user registration."""
    username: str
    password: str


class UserResponse(BaseModel):
    """Public user info response."""
    id: int
    username: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


@router.post("/token", response_model=Token, summary="Login and get access token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    """Authenticate with username/password and receive a JWT access token."""
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token, token_type="bearer")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED,
             summary="Register a new user")
async def register(
    body: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> UserResponse:
    """Register a new user.

    If no users exist in the database yet, the first registration is allowed freely.
    Otherwise an authenticated admin token is required (passed via Authorization header).
    """
    # Count existing users
    count_result = await db.execute(select(func.count(User.id)))
    user_count = count_result.scalar_one()

    if user_count > 0:
        # Require authentication for subsequent registrations
        # We re-use the oauth2 scheme manually here
        from fastapi import Request
        from app.auth.auth import oauth2_scheme, get_current_user
        # If no current_user was injected, raise
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin authentication required to add new users",
            )

    # Check username uniqueness
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    new_user = User(
        username=body.username,
        hashed_password=get_password_hash(body.password),
        is_active=True,
    )
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)
    return UserResponse.model_validate(new_user)


@router.post("/register-first", response_model=UserResponse, status_code=status.HTTP_201_CREATED,
             summary="Register first user (no auth required)", include_in_schema=False)
async def register_first_user(
    body: UserCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Internal convenience endpoint - same as /register but always open (used for initial setup)."""
    count_result = await db.execute(select(func.count(User.id)))
    user_count = count_result.scalar_one()
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="First user already registered. Use /register with admin token.",
        )
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")
    new_user = User(
        username=body.username,
        hashed_password=get_password_hash(body.password),
        is_active=True,
    )
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)
    return UserResponse.model_validate(new_user)


@router.get("/me", response_model=UserResponse, summary="Get current user info")
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Return information about the currently authenticated user."""
    return UserResponse.model_validate(current_user)
