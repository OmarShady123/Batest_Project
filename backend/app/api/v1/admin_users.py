from datetime import datetime, timezone
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core import security
from app.db.session import get_db
from app.models.user import User
from app.models.verification import EmailVerification, PasswordReset
from app.models.audit_log import SecurityAuditLog
from app.schemas.admin_user import (
    AdminUserListResponse,
    AdminUserListItem,
    RoleChangeRequest,
    SuspendUserRequest,
    AdminAuditLogResponse,
    AdminAuditLogItem,
)
from app.services.email_service import EmailService
from app.services.session_service import SessionService
from app.services.tour_access_service import TourAccessService
from app.services.audit_service import AuditService, AuditEventType
from app.api.deps import require_admin, get_client_ip, compute_effective_status
from app.core.config import settings

router = APIRouter()


def _attach_tour_access(db: Session, user: User, item: AdminUserListItem) -> AdminUserListItem:
    """Fill in the tour-access fields the admin panel's toggle reads."""
    if user.role == "admin":
        # Admins always have access; there is nothing to toggle.
        item.tour_access_status = "approved"
        item.tour_can_access = True
        item.tour_expires_at = None
        return item

    req = TourAccessService.get_latest_request(db, str(user.id))
    resolved = TourAccessService.resolve_access_status(req)
    item.tour_access_status = resolved["effective_status"]
    item.tour_can_access = resolved["can_access"]
    item.tour_expires_at = resolved["expires_at"]
    return item


def check_active_admin_count_transactional(db: Session, target_admin_id: uuid.UUID) -> int:
    """Returns number of OTHER active admin accounts remaining."""
    return db.query(User).filter(
        User.role == "admin",
        User.status == "active",
        User.id != target_admin_id
    ).count()


@router.get("", response_model=AdminUserListResponse)
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    user_status: Optional[str] = None,
    is_verified: Optional[bool] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(User)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter((User.name.ilike(s)) | (User.normalized_email.ilike(s)))

    if role:
        query = query.filter(User.role == role)

    if user_status:
        query = query.filter(User.status == user_status)

    if is_verified is not None:
        query = query.filter(User.is_verified == is_verified)

    total = query.count()
    offset = (page - 1) * page_size
    users = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()

    items = []
    for u in users:
        item = AdminUserListItem.model_validate(u)
        item.effective_status = compute_effective_status(u)
        item = _attach_tour_access(db, u, item)
        items.append(item)

    return AdminUserListResponse(users=items, total=total, page=page, page_size=page_size)


@router.get("/{user_id}", response_model=AdminUserListItem)
def get_user_detail(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "المستخدم غير موجود."}
        )
    res = AdminUserListItem.model_validate(target)
    res.effective_status = compute_effective_status(target)
    return res


@router.patch("/{user_id}/role")
def change_user_role(
    user_id: uuid.UUID,
    role_in: RoleChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    if role_in.new_role not in ("visitor", "admin"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_ROLE", "message": "الدور المسمى غير صالح."}
        )

    # 1. Prevent self role demotion
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CANNOT_DEMOTE_SELF", "message": "لا يمكنك تغيير دور حسابك الشخصي."}
        )

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "المستخدم غير موجود."}
        )

    # 2. Transactional last admin check
    if target.role == "admin" and role_in.new_role != "admin":
        other_admins = check_active_admin_count_transactional(db, target.id)
        if other_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "LAST_ADMIN_PROTECTION", "message": "لا يمكن تغيير دور المسؤول الأخير في النظام."}
            )

    old_role = target.role
    target.role = role_in.new_role
    target.updated_at = datetime.now(timezone.utc)
    db.commit()

    # 3. Immediately revoke target user's sessions so old token loses privileges
    SessionService.revoke_all_sessions(db, target.id, reason="role_changed")

    AuditService.log_event(
        db, event_type=AuditEventType.ROLE_CHANGED, user_id=target.id, actor_user_id=admin.id,
        ip_address=ip, user_agent=ua, event_data={"old_role": old_role, "new_role": role_in.new_role}
    )

    return {"status": "success", "detail": f"تم تغيير دور المستخدم إلى {role_in.new_role} وتمت إلغاء جلساته النشطة."}


@router.post("/{user_id}/suspend")
def suspend_user(
    user_id: uuid.UUID,
    sus_in: SuspendUserRequest,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CANNOT_SUSPEND_SELF", "message": "لا يمكنك تعليق حسابك الشخصي."}
        )

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "المستخدم غير موجود."}
        )

    if target.role == "admin":
        other_admins = check_active_admin_count_transactional(db, target.id)
        if other_admins == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "LAST_ADMIN_PROTECTION", "message": "لا يمكن تعليق حساب المسؤول الأخير في النظام."}
            )

    now = datetime.now(timezone.utc)
    target.status = "suspended"
    target.suspended_at = now
    target.suspended_by_id = admin.id
    target.suspension_reason = sus_in.reason
    db.commit()

    # Revoke all target sessions immediately
    SessionService.revoke_all_sessions(db, target.id, reason="account_suspended")

    AuditService.log_event(
        db, event_type=AuditEventType.ACCOUNT_SUSPENDED, user_id=target.id, actor_user_id=admin.id,
        ip_address=ip, user_agent=ua, event_data={"reason": sus_in.reason}
    )

    EmailService.send_account_suspended_email(target.email, reason=sus_in.reason, lang=target.preferred_language)

    return {"status": "success", "detail": "تم تعليق الحساب وإلغاء كافة جلساته بنجاح."}


@router.post("/{user_id}/reactivate")
def reactivate_user(
    user_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "المستخدم غير موجود."}
        )

    target.status = "active" if target.is_verified else "pending_verification"
    target.suspended_at = None
    target.suspended_by_id = None
    target.suspension_reason = None
    db.commit()

    AuditService.log_event(
        db, event_type=AuditEventType.ACCOUNT_REACTIVATED, user_id=target.id, actor_user_id=admin.id,
        ip_address=ip, user_agent=ua
    )

    EmailService.send_account_reactivated_email(target.email, lang=target.preferred_language)

    return {"status": "success", "detail": "تم إعادة تفعيل الحساب بنجاح."}


@router.post("/{user_id}/unlock")
def unlock_user(
    user_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "المستخدم غير موجود."}
        )

    target.failed_login_attempts = 0
    target.locked_until = None
    db.commit()

    AuditService.log_event(
        db, event_type=AuditEventType.ACCOUNT_UNLOCKED, user_id=target.id, actor_user_id=admin.id,
        ip_address=ip, user_agent=ua
    )

    return {"status": "success", "detail": "تم فك قفل الحساب بنجاح."}


@router.post("/{user_id}/resend-verification")
def admin_resend_verification(
    user_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "المستخدم غير موجود."}
        )

    now = datetime.now(timezone.utc)
    db.query(EmailVerification).filter(
        EmailVerification.user_id == target.id,
        EmailVerification.purpose == "initial_email_verification",
        EmailVerification.used_at == None
    ).update({EmailVerification.invalidated_at: now})

    raw_token = security.generate_secure_token()
    token_hash = security.hash_token(raw_token)
    expires_at = now + timedelta(minutes=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES)

    verif = EmailVerification(
        user_id=target.id,
        token_hash=token_hash,
        purpose="initial_email_verification",
        target_email=target.email,
        created_at=now,
        expires_at=expires_at
    )
    db.add(verif)
    db.commit()

    EmailService.send_verification_email(target.email, raw_token, lang=target.preferred_language)

    AuditService.log_event(
        db, event_type=AuditEventType.EMAIL_VERIFICATION_SENT, user_id=target.id, actor_user_id=admin.id,
        ip_address=ip, user_agent=ua
    )

    return {"status": "success", "detail": "تم إعادة إرسال رابط التفعيل بنجاح."}


@router.post("/{user_id}/reset-password")
def admin_reset_password(
    user_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "المستخدم غير موجود."}
        )

    now = datetime.now(timezone.utc)
    db.query(PasswordReset).filter(
        PasswordReset.user_id == target.id,
        PasswordReset.purpose == "password_reset",
        PasswordReset.used_at == None
    ).update({PasswordReset.invalidated_at: now})

    raw_token = security.generate_secure_token()
    token_hash = security.hash_token(raw_token)
    expires_at = now + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)

    reset_rec = PasswordReset(
        user_id=target.id,
        token_hash=token_hash,
        purpose="password_reset",
        created_at=now,
        expires_at=expires_at
    )
    db.add(reset_rec)
    db.commit()

    EmailService.send_password_reset_email(target.email, raw_token, lang=target.preferred_language)

    AuditService.log_event(
        db, event_type=AuditEventType.PASSWORD_RESET_REQUESTED, user_id=target.id, actor_user_id=admin.id,
        ip_address=ip, user_agent=ua
    )

    return {"status": "success", "detail": "تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني للمستخدم."}


@router.delete("/{user_id}/sessions")
def admin_revoke_user_sessions(
    user_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    count = SessionService.revoke_all_sessions(db, user_id, reason="admin_revoked")

    AuditService.log_event(
        db, event_type=AuditEventType.SESSION_REVOKED, user_id=user_id, actor_user_id=admin.id,
        ip_address=ip, user_agent=ua, event_data={"revoked_count": count}
    )

    return {"status": "success", "detail": f"تم إلغاء {count} جلسة للمستخدم بنجاح."}


@router.get("/audit-logs", response_model=AdminAuditLogResponse)
def list_audit_logs(
    user_id: Optional[uuid.UUID] = None,
    event_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    query = db.query(SecurityAuditLog)
    if user_id:
        query = query.filter(SecurityAuditLog.user_id == user_id)
    if event_type:
        query = query.filter(SecurityAuditLog.event_type == event_type)

    total = query.count()
    offset = (page - 1) * page_size
    logs = query.order_by(SecurityAuditLog.created_at.desc()).offset(offset).limit(page_size).all()

    items = [AdminAuditLogItem.model_validate(l) for l in logs]
    return AdminAuditLogResponse(logs=items, total=total)
