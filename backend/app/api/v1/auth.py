from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.deps import get_db, get_current_user
from app.schemas.user import (
    UserCreate, UserLogin, TokenResponse, RefreshTokenRequest,
    ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest, UserResponse, UserUpdate
)
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    user = await service.register(data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    result = await service.login(data.email, data.password)
    return result


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    return await service.refresh_tokens(data.refresh_token)


@router.get("/verify-email", response_model=MessageResponse)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.verify_email(token)
    return MessageResponse(message="Email verified successfully")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.request_password_reset(data.email)
    return MessageResponse(message="If the email exists, a reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.reset_password(data.token, data.new_password)
    return MessageResponse(message="Password reset successfully")


@router.post("/change-password", response_model=MessageResponse)
async def change_password(data: ChangePasswordRequest, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    service = AuthService(db)
    await service.change_password(current_user.id, data.current_password, data.new_password)
    return MessageResponse(message="Password changed successfully")


@router.patch("/me", response_model=UserResponse)
async def update_profile(data: UserUpdate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.repositories.user_repository import UserRepository
    repo = UserRepository(db)
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.bio is not None:
        current_user.bio = data.bio
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    await repo.update(current_user)
    return current_user


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return current_user
