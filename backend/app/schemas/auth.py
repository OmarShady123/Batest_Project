from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

class TokenResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: str = "bearer"


class VerifyEmailRequest(BaseModel):
    token: str

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str

class ValidateResetTokenRequest(BaseModel):
    token: str

class APIErrorDetail(BaseModel):
    code: str
    message: str
    field_errors: Optional[Dict[str, str]] = None
    request_id: Optional[str] = None
