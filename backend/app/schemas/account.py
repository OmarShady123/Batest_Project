from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    preferred_language: Optional[str] = Field(None, pattern="^(ar|en)$")

class ChangeEmailRequest(BaseModel):
    new_email: EmailStr
    current_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str





class DeleteAccountRequest(BaseModel):
    current_password: str
    confirmation_phrase: str  # Must be "DELETE" or "حذف"

class NotificationPreferencesUpdate(BaseModel):
    new_login_alerts: bool = True
    new_device_alerts: bool = True
    optional_product_emails: bool = False

class NotificationPreferencesResponse(BaseModel):
    new_login_alerts: bool
    new_device_alerts: bool
    optional_product_emails: bool
