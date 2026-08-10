from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class TourAccessRequestCreate(BaseModel):
    tour_id: str = "bastet-temple-tour"

class UserSafeInfo(BaseModel):
    name: Optional[str] = None
    email: str

class TourAccessRequestResponse(BaseModel):
    id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    tour_id: str
    status: str
    effective_status: str
    can_access: bool
    requested_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user: Optional[UserSafeInfo] = None

    class Config:
        from_attributes = True

class AdminTourAccessApprove(BaseModel):
    duration_days: Optional[int] = None
    expires_at: Optional[datetime] = None

class AdminTourAccessReject(BaseModel):
    rejection_reason: str = Field(..., min_length=1)

class AdminTourAccessSet(BaseModel):
    """Direct grant/revoke of a user's tour access, usable from any state."""
    granted: bool
    duration_days: Optional[int] = Field(default=None, ge=1)
    tour_id: str = "bastet-temple-tour"
