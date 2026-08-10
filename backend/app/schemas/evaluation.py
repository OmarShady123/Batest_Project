from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class EvaluationCreate(BaseModel):
    name: Optional[str] = None
    userType: str = Field(..., alias="user_type")
    usability: int = Field(..., ge=1, le=5)
    clarity: int = Field(..., ge=1, le=5)
    tourRating: int = Field(..., ge=1, le=5, alias="tour_rating")
    understanding: str
    notes: Optional[str] = None
    tour_id: str = "bastet-temple-tour"

    class Config:
        populate_by_name = True

class EvaluationResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    tour_id: str
    name: Optional[str] = None
    user_type: str
    usability: int
    clarity: int
    tour_rating: int
    understanding: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class AdminEvaluationItem(EvaluationResponse):
    """An evaluation with its submitter attached, for the admin panel.

    `user_id` is nullable (the FK is ON DELETE SET NULL), so an evaluation left
    by a since-deleted account keeps its answers but has no email to show.
    """
    user_email: Optional[str] = None
    user_name: Optional[str] = None


class AdminEvaluationListResponse(BaseModel):
    evaluations: list[AdminEvaluationItem]
    total: int
