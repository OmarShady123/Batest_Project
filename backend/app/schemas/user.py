from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    name: Optional[str] = None
    email: EmailStr

class UserCreate(UserBase):
    password: str
    confirm_password: str
    terms_accepted: bool = True

class UserResponse(UserBase):
    id: UUID
    role: str
    status: str
    effective_status: Optional[str] = "pending_verification"
    is_active: bool
    is_verified: bool

    email_verified_at: Optional[datetime] = None
    preferred_language: str = "ar"
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
