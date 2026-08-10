from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_verified_user, require_admin, require_visitor, get_current_user
from app.models.user import User
from app.schemas.tour_access import (
    AdminTourAccessApprove,
    AdminTourAccessReject,
    AdminTourAccessSet,
    TourAccessRequestCreate,
    TourAccessRequestResponse,
)
from app.services.tour_access_service import TourAccessService

router = APIRouter()

# ----------------- Visitor Endpoints -----------------

@router.post("/tour-access/request", response_model=TourAccessRequestResponse)
def request_access(
    create_in: TourAccessRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    # Only visitors request access; the admin already has it.
    if current_user.role != "visitor":
        # Admin doesn't need to request
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="المسؤول لا يحتاج إلى تقديم طلب دخول"
        )
        
    req = TourAccessService.create_request(db, str(current_user.id), create_in.tour_id)
    
    # Resolve status response structure
    resolved = TourAccessService.resolve_access_status(req)
    # Merge req details
    resolved_resp = {
        **resolved,
        "id": req.id,
        "user_id": req.user_id,
        "tour_id": req.tour_id,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
        "user": {"name": current_user.name, "email": current_user.email}
    }
    return resolved_resp

@router.get("/tour-access/me", response_model=TourAccessRequestResponse)
def get_my_access(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    # Admins get immediate direct access by default
    if current_user.role == "admin":
        return {
            "status": "approved",
            "effective_status": "approved",
            "can_access": True,
            "tour_id": "bastet-temple-tour",
            "user": {"name": current_user.name, "email": current_user.email}
        }

    req = TourAccessService.get_latest_request(db, str(current_user.id))
    resolved = TourAccessService.resolve_access_status(req)
    
    if req:
        resolved_resp = {
            **resolved,
            "id": req.id,
            "user_id": req.user_id,
            "tour_id": req.tour_id,
            "created_at": req.created_at,
            "updated_at": req.updated_at,
            "user": {"name": current_user.name, "email": current_user.email}
        }
    else:
        resolved_resp = {
            **resolved,
            "tour_id": "bastet-temple-tour"
        }
        
    return resolved_resp

# ----------------- Admin Endpoints -----------------

@router.get("/admin/tour-access/", response_model=List[TourAccessRequestResponse])
def admin_list_requests(
    status_filter: Optional[str] = None,
    tour_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    requests = TourAccessService.admin_list_requests(
        db,
        status_filter=status_filter,
        tour_id=tour_id,
        limit=limit,
        offset=offset
    )
    
    responses = []
    for r in requests:
        resolved = TourAccessService.resolve_access_status(r)
        resp = {
            **resolved,
            "id": r.id,
            "user_id": r.user_id,
            "tour_id": r.tour_id,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "user": {"name": r.user.name if r.user else None, "email": r.user.email if r.user else None}
        }
        responses.append(resp)
        
    return responses

@router.put("/admin/tour-access/user/{user_id}", response_model=TourAccessRequestResponse)
def admin_set_user_access(
    user_id: str,
    set_in: AdminTourAccessSet,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """Turn a user's tour access on or off, from whatever state it is in.

    The approve/reject/revoke endpoints act on a visitor's request and only
    accept one specific prior state. This one is a plain switch, so the admin
    can grant access, take it away, and grant it again without the visitor
    having to request anything.
    """
    req = TourAccessService.set_user_access(
        db,
        user_id=user_id,
        granted=set_in.granted,
        reviewer_id=str(current_admin.id),
        tour_id=set_in.tour_id,
        duration_days=set_in.duration_days,
    )
    resolved = TourAccessService.resolve_access_status(req)
    return {
        **resolved,
        "id": req.id,
        "user_id": req.user_id,
        "tour_id": req.tour_id,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
        "user": {"name": req.user.name if req.user else None, "email": req.user.email if req.user else None}
    }


@router.patch("/admin/tour-access/{request_id}/approve", response_model=TourAccessRequestResponse)
def admin_approve(
    request_id: str,
    approve_in: AdminTourAccessApprove,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    req = TourAccessService.approve_request(
        db,
        request_id=request_id,
        reviewer_id=str(current_admin.id),
        duration_days=approve_in.duration_days,
        expires_at=approve_in.expires_at
    )
    resolved = TourAccessService.resolve_access_status(req)
    resp = {
        **resolved,
        "id": req.id,
        "user_id": req.user_id,
        "tour_id": req.tour_id,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
        "user": {"name": req.user.name if req.user else None, "email": req.user.email if req.user else None}
    }
    return resp

@router.patch("/admin/tour-access/{request_id}/reject", response_model=TourAccessRequestResponse)
def admin_reject(
    request_id: str,
    reject_in: AdminTourAccessReject,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    req = TourAccessService.reject_request(
        db,
        request_id=request_id,
        reviewer_id=str(current_admin.id),
        rejection_reason=reject_in.rejection_reason
    )
    resolved = TourAccessService.resolve_access_status(req)
    resp = {
        **resolved,
        "id": req.id,
        "user_id": req.user_id,
        "tour_id": req.tour_id,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
        "user": {"name": req.user.name if req.user else None, "email": req.user.email if req.user else None}
    }
    return resp

@router.patch("/admin/tour-access/{request_id}/revoke", response_model=TourAccessRequestResponse)
def admin_revoke(
    request_id: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    req = TourAccessService.revoke_request(
        db,
        request_id=request_id,
        reviewer_id=str(current_admin.id)
    )
    resolved = TourAccessService.resolve_access_status(req)
    resp = {
        **resolved,
        "id": req.id,
        "user_id": req.user_id,
        "tour_id": req.tour_id,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
        "user": {"name": req.user.name if req.user else None, "email": req.user.email if req.user else None}
    }
    return resp
