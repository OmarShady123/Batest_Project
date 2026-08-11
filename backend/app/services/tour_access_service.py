from datetime import datetime, timezone, timedelta
import uuid
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.tour_access import TourAccessRequest
from app.models.user import User

class TourAccessService:
    @staticmethod
    def resolve_access_status(req: Optional[TourAccessRequest]) -> dict:
        if not req:
            return {
                "status": "not_requested",
                "effective_status": "not_requested",
                "can_access": False,
                "requested_at": None,
                "approved_at": None,
                "reviewed_at": None,
                "expires_at": None,
                "rejection_reason": None,
            }
        
        now = datetime.now(timezone.utc)
        effective_status = req.status
        can_access = False

        if req.status == "approved":
            expires_at = req.expires_at
            if expires_at and expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at and expires_at < now:
                effective_status = "expired"
            else:
                can_access = True
        elif req.status == "pending":
            # Just double check if it was somehow auto expired
            pass

        return {
            "status": req.status,
            "effective_status": effective_status,
            "can_access": can_access,
            "requested_at": req.requested_at,
            "approved_at": req.approved_at,
            "reviewed_at": req.reviewed_at,
            "expires_at": req.expires_at,
            "rejection_reason": req.rejection_reason,
        }

    @classmethod
    def get_latest_request(cls, db: Session, user_id: uuid.UUID, tour_id: str = "bastet-temple-tour") -> Optional[TourAccessRequest]:
        return db.query(TourAccessRequest).filter(
            TourAccessRequest.user_id == user_id,
            TourAccessRequest.tour_id == tour_id
        ).order_by(desc(TourAccessRequest.requested_at)).first()

    @classmethod
    def create_request(cls, db: Session, user_id: uuid.UUID, tour_id: str = "bastet-temple-tour") -> TourAccessRequest:
        now = datetime.now(timezone.utc)
        
        # Check active requests
        latest = cls.get_latest_request(db, user_id, tour_id)

        if latest:

            resolved = cls.resolve_access_status(latest)
            if latest.status == "pending":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="لديك طلب تصريح دخول معلق بالفعل"
                )
            if resolved["can_access"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="لديك تصريح دخول سارٍ بالفعل"
                )


        # Create new request
        req = TourAccessRequest(
            user_id=user_id,
            tour_id=tour_id,
            status="pending",
            requested_at=now
        )
        
        try:
            # Use nested transaction for safe concurrency
            db.begin_nested()
            db.add(req)
            db.commit()
        except IntegrityError:
            db.rollback()
            # If a race condition occurred and a pending request now exists, return it
            latest_pending = db.query(TourAccessRequest).filter(
                TourAccessRequest.user_id == user_id,
                TourAccessRequest.tour_id == tour_id,
                TourAccessRequest.status == "pending"
            ).first()
            if latest_pending:
                return latest_pending
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="فشل إنشاء طلب الدخول، يرجى المحاولة لاحقاً"
            )
            
        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def admin_list_requests(
        db: Session,
        status_filter: Optional[str] = None,
        tour_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[TourAccessRequest]:
        query = db.query(TourAccessRequest)
        if status_filter:
            query = query.filter(TourAccessRequest.status == status_filter)
        if tour_id:
            query = query.filter(TourAccessRequest.tour_id == tour_id)
        
        return query.order_by(desc(TourAccessRequest.requested_at)).limit(limit).offset(offset).all()

    @staticmethod
    def approve_request(
        db: Session,
        request_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        duration_days: Optional[int] = None,
        expires_at: Optional[datetime] = None
    ) -> TourAccessRequest:
        req = db.query(TourAccessRequest).filter(TourAccessRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الطلب غير موجود")
        
        if req.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="يمكن فقط اعتماد الطلبات المعلقة")
            
        now = datetime.now(timezone.utc)
        
        if duration_days:
            expires = now + timedelta(days=duration_days)
        elif expires_at:
            # Ensure future expiration
            if expires_at <= now:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="تاريخ الانتهاء يجب أن يكون في المستقبل")
            expires = expires_at
        else:
            # Default to 30 days
            expires = now + timedelta(days=30)

        req.status = "approved"
        req.approved_at = now
        req.reviewed_at = now
        req.reviewed_by = reviewer_id
        req.expires_at = expires
        req.rejection_reason = None

        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def reject_request(
        db: Session,
        request_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        rejection_reason: str
    ) -> TourAccessRequest:
        req = db.query(TourAccessRequest).filter(TourAccessRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الطلب غير موجود")
        
        if req.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="يمكن فقط رفض الطلبات المعلقة")

        now = datetime.now(timezone.utc)
        req.status = "rejected"
        req.reviewed_at = now
        req.reviewed_by = reviewer_id
        req.rejection_reason = rejection_reason

        db.commit()
        db.refresh(req)
        return req

    @classmethod
    def set_user_access(
        cls,
        db: Session,
        user_id: uuid.UUID,
        granted: bool,
        reviewer_id: uuid.UUID,
        tour_id: str = "bastet-temple-tour",
        duration_days: Optional[int] = None,
    ) -> TourAccessRequest:
        """Grant or revoke a user's tour access directly.

        Unlike approve/reject/revoke this does not require a prior visitor
        request and does not care about the current state, so an admin can flip
        a user's access on and off as many times as they like. A record is
        created on first use so there is always something to carry the state.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المستخدم غير موجود")
        if user.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="المسؤول لديه صلاحية دخول الجولة بشكل دائم"
            )

        now = datetime.now(timezone.utc)
        req = cls.get_latest_request(db, user_id, tour_id)
        if not req:
            # Built with its final status so no transient 'pending' row is ever
            # inserted — that would collide with the unique pending index.
            req = TourAccessRequest(
                user_id=user_id,
                tour_id=tour_id,
                status="approved" if granted else "revoked",
                requested_at=now,
            )
            db.add(req)

        req.reviewed_at = now
        req.reviewed_by = reviewer_id

        if granted:
            req.status = "approved"
            req.approved_at = now
            # No duration means the grant stands until the admin revokes it.
            req.expires_at = now + timedelta(days=duration_days) if duration_days else None
            req.rejection_reason = None
        else:
            req.status = "revoked"
            req.expires_at = now

        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def revoke_request(
        db: Session,
        request_id: uuid.UUID,
        reviewer_id: uuid.UUID
    ) -> TourAccessRequest:
        req = db.query(TourAccessRequest).filter(TourAccessRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الطلب غير موجود")
        
        if req.status != "approved":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="يمكن فقط إلغاء الصلاحيات المعتمدة")

        now = datetime.now(timezone.utc)
        req.status = "revoked"
        req.reviewed_at = now
        req.reviewed_by = reviewer_id
        req.expires_at = now  # Expired immediately

        db.commit()
        db.refresh(req)
        return req
