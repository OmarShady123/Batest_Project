from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_verified_user, require_admin
from app.models.evaluation import Evaluation
from app.models.user import User
from app.schemas.evaluation import (
    AdminEvaluationItem,
    AdminEvaluationListResponse,
    EvaluationCreate,
    EvaluationResponse,
)
from app.services.tour_access_service import TourAccessService

router = APIRouter()

@router.post("/evaluations/", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
def submit_evaluation(
    eval_in: EvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    if current_user.role != "admin":
        latest_req = TourAccessService.get_latest_request(db, current_user.id, eval_in.tour_id)
        resolved = TourAccessService.resolve_access_status(latest_req)
        
        has_authorized_past = latest_req and latest_req.status in ["approved", "expired", "revoked"]
        if not (resolved["can_access"] or has_authorized_past):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="يجب الحصول على موافقة دخول الجولة أولاً للمشاركة في التقييم"
            )

    db_eval = Evaluation(
        user_id=current_user.id,
        tour_id=eval_in.tour_id,
        name=eval_in.name,
        user_type=eval_in.userType,
        usability=eval_in.usability,
        clarity=eval_in.clarity,
        tour_rating=eval_in.tourRating,
        understanding=eval_in.understanding,
        notes=eval_in.notes
    )
    db.add(db_eval)
    db.commit()
    db.refresh(db_eval)
    return db_eval

@router.get("/admin/evaluations/", response_model=AdminEvaluationListResponse)
def get_evaluations_list(
    limit: int = 200,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """Every submitted evaluation, newest first, with the submitter's email.

    Left-joined so an evaluation whose author was deleted still shows up — its
    answers are part of the research data even when the account is gone.
    """
    base = db.query(Evaluation).outerjoin(User, Evaluation.user_id == User.id)
    total = base.count()
    rows = (
        base.add_columns(User.email, User.name)
        .order_by(Evaluation.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    items = []
    for evaluation, email, name in rows:
        item = AdminEvaluationItem.model_validate(evaluation)
        item.user_email = email
        item.user_name = name
        items.append(item)

    return AdminEvaluationListResponse(evaluations=items, total=total)
