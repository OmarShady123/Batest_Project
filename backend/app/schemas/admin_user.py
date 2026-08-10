from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class AdminUserListItem(BaseModel):
    id: UUID
    name: Optional[str] = None
    email: str
    role: str
    status: str
    effective_status: Optional[str] = "active"
    is_verified: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime

    # Tour access, resolved for the admin panel's per-user toggle.
    tour_access_status: Optional[str] = "not_requested"
    tour_can_access: bool = False
    tour_expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminUserListResponse(BaseModel):
    users: List[AdminUserListItem]
    total: int
    page: int
    page_size: int

class RoleChangeRequest(BaseModel):
    new_role: str

class SuspendUserRequest(BaseModel):
    reason: Optional[str] = None

class AdminAuditLogItem(BaseModel):
    id: UUID
    event_type: str
    user_id: Optional[UUID] = None
    actor_user_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    event_data: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AdminAuditLogResponse(BaseModel):
    logs: List[AdminAuditLogItem]
    total: int
