import json
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token,
    decode_token, create_email_verification_token,
    create_password_reset_token
)
from app.core.exceptions import ConflictException, UnauthorizedException, NotFoundException, ValidationException
from loguru import logger


class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def register(self, data: UserCreate) -> User:
        if await self.repo.get_by_email(data.email):
            raise ConflictException("Email already registered")
        if await self.repo.get_by_username(data.username):
            raise ConflictException("Username already taken")

        user = User(
            email=data.email,
            username=data.username,
            full_name=data.full_name,
            hashed_password=get_password_hash(data.password),
        )
        return await self.repo.create(user)

    async def login(self, email: str, password: str) -> dict:
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        return {
            "access_token": create_access_token(user.id),
            "refresh_token": create_refresh_token(user.id),
            "token_type": "bearer",
            "user": user,
        }

    async def refresh_tokens(self, refresh_token: str) -> dict:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid refresh token")

        user = await self.repo.get_by_id(int(payload["sub"]))
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        return {
            "access_token": create_access_token(user.id),
            "refresh_token": create_refresh_token(user.id),
            "token_type": "bearer",
            "user": user,
        }

    async def verify_email(self, token: str) -> bool:
        payload = decode_token(token)
        if not payload or payload.get("type") != "email_verify":
            raise ValidationException("Invalid or expired verification token")

        user = await self.repo.get_by_email(payload["sub"])
        if not user:
            raise NotFoundException("User")

        user.is_verified = True
        await self.repo.update(user)
        return True

    async def request_password_reset(self, email: str) -> str:
        user = await self.repo.get_by_email(email)
        if not user:
            # Don't reveal whether email exists
            return create_password_reset_token(email)
        return create_password_reset_token(email)

    async def reset_password(self, token: str, new_password: str) -> bool:
        payload = decode_token(token)
        if not payload or payload.get("type") != "password_reset":
            raise ValidationException("Invalid or expired reset token")

        user = await self.repo.get_by_email(payload["sub"])
        if not user:
            raise NotFoundException("User")

        user.hashed_password = get_password_hash(new_password)
        await self.repo.update(user)
        return True

    async def change_password(self, user_id: int, current_password: str, new_password: str) -> bool:
        user = await self.repo.get_by_id(user_id)
        if not verify_password(current_password, user.hashed_password):
            raise UnauthorizedException("Current password is incorrect")
        user.hashed_password = get_password_hash(new_password)
        await self.repo.update(user)
        return True
