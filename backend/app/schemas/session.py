from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class SessionResponse(BaseModel):
    id: UUID
    device_name: str
    browser: str
    operating_system: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    last_used_at: datetime
    expires_at: datetime
    is_current: bool = False

class SessionListResponse(BaseModel):
    sessions: List[SessionResponse]
    total_count: int
