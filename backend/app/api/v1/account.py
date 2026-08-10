from datetime import datetime, timezone
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core import security
from app.core.password_policy import validate_password_policy, normalize_password
from app.db.session import get_db
from app.models.user import User
from app.models.verification import EmailVerification
from app.models.notification_preference import UserNotificationPreference
from app.models.audit_log import SecurityAuditLog
from app.schemas.user import UserResponse
from app.schemas.auth import VerifyEmailRequest
from app.schemas.account import (
    ProfileUpdate,
    ChangeEmailRequest,
    ChangePasswordRequest,
    DeleteAccountRequest,
    NotificationPreferencesUpdate,
    NotificationPreferencesResponse,
)
from app.services.email_service import EmailService
from app.services.session_service import SessionService
from app.services.audit_service import AuditService, AuditEventType
from app.api.deps import get_current_user, require_verified_user, get_client_ip, compute_effective_status

router = APIRouter()


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(require_verified_user)):
    res = UserResponse.model_validate(current_user)
    res.effective_status = compute_effective_status(current_user)
    return res


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    if profile_in.name is not None:
        current_user.name = profile_in.name.strip() if profile_in.name else None

    if profile_in.preferred_language is not None:
        current_user.preferred_language = profile_in.preferred_language

    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)

    res = UserResponse.model_validate(current_user)
    res.effective_status = compute_effective_status(current_user)
    return res


@router.post("/change-password")
def change_password(
    change_in: ChangePasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    # 1. Verify current password
    if not security.verify_password(normalize_password(change_in.current_password), current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CURRENT_PASSWORD", "message": "كلمة المرور الحالية غير صحيحة."}
        )

    # 2. Check password confirmation match
    if change_in.new_password != change_in.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "PASSWORD_MISMATCH", "message": "كلمة المرور الجديدة وتأكيدها غير متطابقين."}
        )

    # 3. Validate new password policy
    is_valid_pw, pw_errors = validate_password_policy(
        password=change_in.new_password,
        email=current_user.email,
        name=current_user.name
    )
    if not is_valid_pw:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "PASSWORD_TOO_WEAK", "message": pw_errors[0], "field_errors": {"new_password": pw_errors[0]}}
        )

    # 4. Update password
    now = datetime.now(timezone.utc)
    current_user.password_hash = security.hash_password(normalize_password(change_in.new_password))
    current_user.password_changed_at = now
    db.commit()

    # 5. Revoke OTHER sessions
    # Retrieve current session id if available
    token = request.headers.get("authorization", "").replace("Bearer ", "")
    payload = security.decode_access_token(token) if token else None
    current_sid = payload.get("sid") if payload else None

    SessionService.revoke_all_sessions(db, current_user.id, except_session_id=current_sid, reason="password_changed")

    # 6. Audit log & Email
    AuditService.log_event(
        db, event_type=AuditEventType.PASSWORD_CHANGED, user_id=current_user.id,
        ip_address=ip, user_agent=ua
    )
    EmailService.send_password_changed_email(current_user.email, lang=current_user.preferred_language)

    return {"status": "success", "detail": "تم تغيير كلمة المرور بنجاح، وتم إلغاء الأجهزة الأخرى المرتبطة بحسابك."}


@router.post("/change-email")
def initiate_change_email(
    email_in: ChangeEmailRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    # 1. Verify current password
    if not security.verify_password(normalize_password(email_in.current_password), current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CURRENT_PASSWORD", "message": "كلمة المرور الحالية غير صحيحة."}
        )

    new_normalized = email_in.new_email.strip().lower()

    if new_normalized == current_user.normalized_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SAME_EMAIL", "message": "البريد الإلكتروني الجديد مماثل للبريد الحالي."}
        )

    # 2. Check uniqueness on existing users and pending emails
    existing_user = db.query(User).filter(User.normalized_email == new_normalized).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_ALREADY_EXISTS", "message": "البريد الإلكتروني الجديد مُسجّل بالفعل لـ حساب آخر."}
        )

    existing_pending = db.query(User).filter(User.pending_normalized_email == new_normalized, User.id != current_user.id).first()
    if existing_pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_RESERVED", "message": "البريد الإلكتروني الجديد قيد التغير بواسطة حساب آخر."}
        )

    # 3. Store pending email & create token
    now = datetime.now(timezone.utc)
    current_user.pending_email = email_in.new_email.strip()
    current_user.pending_normalized_email = new_normalized
    current_user.pending_email_requested_at = now

    # Invalidate previous email_change tokens
    db.query(EmailVerification).filter(
        EmailVerification.user_id == current_user.id,
        EmailVerification.purpose == "email_change",
        EmailVerification.used_at == None
    ).update({EmailVerification.invalidated_at: now})

    raw_token = security.generate_secure_token()
    token_hash = security.hash_token(raw_token)
    expires_at = now + timedelta(minutes=settings.EMAIL_CHANGE_TOKEN_EXPIRE_MINUTES)

    verif = EmailVerification(
        user_id=current_user.id,
        token_hash=token_hash,
        purpose="email_change",
        target_email=current_user.pending_email,
        created_at=now,
        expires_at=expires_at
    )
    db.add(verif)
    db.commit()

    # 4. Audit log & Email delivery
    AuditService.log_event(
        db, event_type=AuditEventType.EMAIL_CHANGE_REQUESTED, user_id=current_user.id,
        ip_address=ip, user_agent=ua, event_data={"new_email": new_normalized}
    )
    EmailService.send_email_change_email(current_user.pending_email, raw_token, lang=current_user.preferred_language)

    return {"status": "success", "detail": f"تم إرسال رابط تأكيد التغيير إلى البريد الإلكتروني الجديد ({current_user.pending_email})."}


@router.post("/confirm-email-change")
def confirm_email_change(
    verify_in: VerifyEmailRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    token_hash = security.hash_token(verify_in.token)
    now = datetime.now(timezone.utc)

    rec = db.query(EmailVerification).filter(
        EmailVerification.token_hash == token_hash,
        EmailVerification.purpose == "email_change"
    ).first()

    if not rec or rec.used_at or rec.expires_at <= now or rec.invalidated_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_INVALID", "message": "رابط تأكيد البريد الإلكتروني غير صالح أو منتهي الصلاحية."}
        )

    user = db.query(User).filter(User.id == rec.user_id).first()
    if not user or not user.pending_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_STATE", "message": "لا يوجد طلب تغيير بريد إلكتروني نشط."}
        )

    # Uniqueness check inside transaction
    new_normalized = user.pending_normalized_email
    conflict = db.query(User).filter(User.normalized_email == new_normalized, User.id != user.id).first()
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_ALREADY_EXISTS", "message": "البريد الإلكتروني الجديد تم تسجيله بواسطة حساب آخر."}
        )

    old_email = user.email

    # Atomically update
    user.email = user.pending_email
    user.normalized_email = user.pending_normalized_email
    user.pending_email = None
    user.pending_normalized_email = None
    user.pending_email_requested_at = None
    rec.used_at = now
    db.commit()

    AuditService.log_event(
        db, event_type=AuditEventType.EMAIL_CHANGED, user_id=user.id,
        ip_address=ip, user_agent=ua, event_data={"old_email": old_email, "new_email": user.email}
    )

    # Security email to OLD address
    EmailService.send_email(
        old_email,
        "تنبيه أمني: تم تغيير البريد الإلكتروني لحسابك",
        f"<p>مرحباً،</p><p>نعلمك أنه تم تغيير البريد الإلكتروني الخاص بحسابك بنجاح إلى: <strong>{user.email}</strong>.</p>",
        f"تم تغيير بريدك إلى {user.email}"
    )

    return {"status": "success", "detail": "تم تغيير البريد الإلكتروني بنجاح."}


@router.get("/notification-preferences", response_model=NotificationPreferencesResponse)
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    pref = db.query(UserNotificationPreference).filter(UserNotificationPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserNotificationPreference(user_id=current_user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.patch("/notification-preferences", response_model=NotificationPreferencesResponse)
def update_notification_preferences(
    pref_in: NotificationPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    pref = db.query(UserNotificationPreference).filter(UserNotificationPreference.user_id == current_user.id).first()
    if not pref:
        pref = UserNotificationPreference(user_id=current_user.id)
        db.add(pref)

    pref.new_login_alerts = pref_in.new_login_alerts
    pref.new_device_alerts = pref_in.new_device_alerts
    pref.optional_product_emails = pref_in.optional_product_emails
    pref.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(pref)
    return pref


@router.get("/security-activity")
def get_security_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    logs = db.query(SecurityAuditLog).filter(
        SecurityAuditLog.user_id == current_user.id
    ).order_by(SecurityAuditLog.created_at.desc()).limit(20).all()

    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "event_type": l.event_type,
            "ip_address": l.ip_address,
            "created_at": l.created_at,
            "event_data": l.event_data
        })
    return {"activity": results}


@router.delete("")
def delete_account(
    del_in: DeleteAccountRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_verified_user)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    # 1. Require password
    if not security.verify_password(normalize_password(del_in.current_password), current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CURRENT_PASSWORD", "message": "كلمة المرور الحالية غير صحيحة."}
        )

    # 2. Confirmation phrase check ("DELETE" or "حذف")
    phrase = del_in.confirmation_phrase.strip().upper()
    if phrase not in ("DELETE", "حذف"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_CONFIRMATION_PHRASE", "message": "عبارة التأكيد غير صحيحة، يرجى كتابة DELETE أو حذف."}
        )

    now = datetime.now(timezone.utc)
    user_id = current_user.id
    old_email = current_user.email

    # 3. Soft delete and anonymization inside single transaction
    SessionService.revoke_all_sessions(db, user_id, reason="account_deleted")

    # Anonymize email so original email can register again
    anon_id = str(uuid.uuid4())[:8]
    current_user.email = f"deleted_{anon_id}@anon.local"
    current_user.normalized_email = f"deleted_{anon_id}@anon.local"
    current_user.pending_email = None
    current_user.pending_normalized_email = None
    current_user.status = "deleted"
    current_user.is_active = False
    current_user.deleted_at = now

    db.commit()

    AuditService.log_event(
        db, event_type=AuditEventType.ACCOUNT_DELETED, user_id=user_id,
        ip_address=ip, user_agent=ua, event_data={"old_email": old_email}
    )

    from app.api.v1.auth import clear_refresh_cookie
    clear_refresh_cookie(response)

    return {"status": "success", "detail": "تم حذف الحساب وإلغاء تنشيطه بنجاح."}
