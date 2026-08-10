from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core import security
from app.core.password_policy import validate_password_policy, normalize_password
from app.core.rate_limiter import enforce_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.models.verification import EmailVerification, PasswordReset
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    ResendVerificationRequest,
    TokenResponse,
    ValidateResetTokenRequest,
    VerifyEmailRequest,
)
from app.schemas.user import UserCreate, UserResponse
from app.services.email_service import EmailService
from app.services.session_service import SessionService
from app.services.audit_service import AuditService, AuditEventType
from app.api.deps import get_client_ip, compute_effective_status, get_current_user

router = APIRouter()

COOKIE_KEY = "refresh_token"
COOKIE_PATH = "/api/v1/auth"


def set_refresh_cookie(response: Response, refresh_token: str):
    response.set_cookie(
        key=COOKIE_KEY,
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path=COOKIE_PATH,
        domain=settings.COOKIE_DOMAIN
    )


def clear_refresh_cookie(response: Response):
    response.delete_cookie(
        key=COOKIE_KEY,
        path=COOKIE_PATH,
        domain=settings.COOKIE_DOMAIN,
        samesite=settings.COOKIE_SAMESITE
    )


@router.post("/signup", response_model=TokenResponse)
def signup(
    user_in: UserCreate,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    # Rate limiting on signup IP
    enforce_rate_limit(f"signup:{ip}", max_requests=10, window_seconds=3600)

    # 1. Terms acceptance validation
    if not user_in.terms_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TERMS_REQUIRED", "message": "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة."}
        )

    # 2. Check password confirmation match
    if user_in.password != user_in.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "PASSWORD_MISMATCH", "message": "كلمة المرور وتأكيدها غير متطابقين."}
        )

    # 3. Password policy validation (NFC normalized, 15 char min, blocklist check)
    is_valid_pw, pw_errors = validate_password_policy(
        password=user_in.password,
        email=user_in.email,
        name=user_in.name
    )
    if not is_valid_pw:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "PASSWORD_TOO_WEAK", "message": pw_errors[0], "field_errors": {"password": pw_errors[0]}}
        )

    # 4. Check duplicate normalized email
    normalized_email = user_in.email.strip().lower()
    existing_user = db.query(User).filter(User.normalized_email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_ALREADY_EXISTS", "message": "البريد الإلكتروني مُسجّل بالفعل."}
        )

    # 5. Create the account already active. Email verification was removed from
    # the product, so a new visitor is usable immediately.
    now = datetime.now(timezone.utc)
    hashed_pw = security.hash_password(normalize_password(user_in.password))

    new_user = User(
        name=user_in.name.strip() if user_in.name else None,
        email=user_in.email.strip(),
        normalized_email=normalized_email,
        password_hash=hashed_pw,
        role="visitor",
        status="active",
        is_active=True,
        is_verified=True,
        email_verified_at=now,
        terms_accepted_at=now,
        terms_version=settings.CURRENT_TERMS_VERSION,
        privacy_version=settings.CURRENT_PRIVACY_VERSION,
        created_at=now,
        updated_at=now
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    AuditService.log_event(
        db,
        event_type=AuditEventType.SIGNUP_COMPLETED,
        user_id=new_user.id,
        ip_address=ip,
        user_agent=ua
    )

    # 6. Sign the new visitor straight in, exactly as a successful login would.
    refresh_token = security.generate_secure_token()
    sess = SessionService.create_session(
        db, user_id=new_user.id, token=refresh_token,
        remember_me=False, user_agent=ua, ip_address=ip
    )
    access_token = security.create_access_token(
        subject=str(new_user.id),
        role=new_user.role,
        session_id=str(sess.id)
    )

    new_user.last_login_at = now
    db.commit()

    set_refresh_cookie(response, refresh_token)

    AuditService.log_event(
        db, event_type=AuditEventType.LOGIN_SUCCESS, user_id=new_user.id,
        ip_address=ip, user_agent=ua, event_data={"session_id": str(sess.id), "via": "signup"}
    )

    return TokenResponse(access_token=access_token, token_type="bearer")


@router.post("/login", response_model=TokenResponse)
def login(
    login_in: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")
    normalized_email = login_in.email.strip().lower()

    # Rate limiting by IP and Email
    enforce_rate_limit(f"login_ip:{ip}", max_requests=30, window_seconds=600)
    enforce_rate_limit(f"login_email:{normalized_email}", max_requests=settings.MAX_LOGIN_ATTEMPTS, window_seconds=600)

    # 1. Retrieve user
    user = db.query(User).filter(User.normalized_email == normalized_email).first()

    # 2. Timing attack protection: if user doesn't exist, run dummy password verification
    if not user or user.status == "deleted":
        security.dummy_verify_password(login_in.password)
        AuditService.log_event(
            db, event_type=AuditEventType.LOGIN_FAILED,
            ip_address=ip, user_agent=ua, event_data={"email": normalized_email, "reason": "user_not_found"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "البريد الإلكتروني أو كلمة المرور غير صحيحة."}
        )

    # 3. Check lock status
    now = datetime.now(timezone.utc)
    if user.locked_until and user.locked_until > now:
        AuditService.log_event(
            db, event_type=AuditEventType.LOGIN_FAILED, user_id=user.id,
            ip_address=ip, user_agent=ua, event_data={"reason": "account_locked"}
        )
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail={"code": "ACCOUNT_LOCKED", "message": "الحساب مقفل مؤقتاً بسبب كثرة المحاولات الخاطئة. يرجى المحاولة بعد 30 دقيقة."}
        )

    # 4. Verify password
    is_valid_pw = security.verify_password(normalize_password(login_in.password), user.password_hash)
    if not is_valid_pw:
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=settings.ACCOUNT_LOCK_DURATION_MINUTES)
            AuditService.log_event(
                db, event_type=AuditEventType.ACCOUNT_LOCKED, user_id=user.id,
                ip_address=ip, user_agent=ua, event_data={"attempts": user.failed_login_attempts}
            )
        db.commit()

        AuditService.log_event(
            db, event_type=AuditEventType.LOGIN_FAILED, user_id=user.id,
            ip_address=ip, user_agent=ua, event_data={"reason": "invalid_password"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "البريد الإلكتروني أو كلمة المرور غير صحيحة."}
        )

    # Password is VALID! Reset failed attempts
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    # 5. Check persistent status & verification
    eff_status = compute_effective_status(user)
    if eff_status == "suspended":
        AuditService.log_event(
            db, event_type=AuditEventType.LOGIN_FAILED, user_id=user.id,
            ip_address=ip, user_agent=ua, event_data={"reason": "suspended"}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_SUSPENDED", "message": "تم تعليق حسابك بواسطة إدارة الموقع."}
        )

    # Email verification was removed from the product. Accounts created before
    # that change may still be flagged unverified, so clear the flag on login
    # instead of turning them away.
    if user.status == "pending_verification" or not user.is_verified:
        user.status = "active"
        user.is_verified = True
        user.email_verified_at = user.email_verified_at or now
        db.commit()

    # 7. Complete Login without 2FA
    refresh_token = security.generate_secure_token()
    sess = SessionService.create_session(
        db, user_id=user.id, token=refresh_token,
        remember_me=login_in.remember_me, user_agent=ua, ip_address=ip
    )

    access_token = security.create_access_token(
        subject=str(user.id),
        role=user.role,
        session_id=str(sess.id)
    )

    user.last_login_at = now
    db.commit()

    set_refresh_cookie(response, refresh_token)

    AuditService.log_event(
        db, event_type=AuditEventType.LOGIN_SUCCESS, user_id=user.id,
        ip_address=ip, user_agent=ua, event_data={"session_id": str(sess.id)}
    )

    return TokenResponse(access_token=access_token, token_type="bearer")


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    cookie_token = request.cookies.get(COOKIE_KEY)
    if not cookie_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "REFRESH_TOKEN_REQUIRED", "message": "مطلوب رمز تحديث الصلاحية."}
        )

    token_hash = security.hash_token(cookie_token)
    now = datetime.now(timezone.utc)

    # Query session
    sess = db.query(UserSession).filter(UserSession.token_hash == token_hash).first()

    # Reuse detection check: if session exists but is revoked OR replaced_by is set
    if sess and (sess.revoked_at is not None or sess.replaced_by is not None):
        # Reuse detected! Revoke whole family!
        SessionService.revoke_family_sessions(db, sess.token_family_id, reason="reuse_detected")
        clear_refresh_cookie(response)

        AuditService.log_event(
            db, event_type=AuditEventType.REFRESH_TOKEN_REUSE_DETECTED, user_id=sess.user_id,
            ip_address=ip, user_agent=ua, event_data={"family_id": str(sess.token_family_id)}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_REUSE_DETECTED", "message": "تم كشف استخدام غير مصرح به، يرجى إعادة تسجيل الدخول."}
        )

    if not sess or sess.expires_at <= now or (sess.idle_expires_at and sess.idle_expires_at <= now):
        clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "SESSION_EXPIRED", "message": "انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول."}
        )

    # Check user account status
    user = db.query(User).filter(User.id == sess.user_id).first()
    if not user or user.status != "active" or not user.is_active:
        clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ACCOUNT_NOT_ACTIVE", "message": "الحساب غير نشط."}
        )

    # Rotate refresh token: create new session in same family
    new_refresh_token = security.generate_secure_token()
    new_sess = SessionService.create_session(
        db,
        user_id=user.id,
        token=new_refresh_token,
        remember_me=False,
        user_agent=ua,
        ip_address=ip,
        family_id=sess.token_family_id
    )

    # Mark old session as replaced
    sess.revoked_at = now
    sess.replaced_by = new_sess.id
    sess.revoke_reason = "rotated"
    db.commit()

    # Generate new access token with new sid claim
    new_access_token = security.create_access_token(
        subject=str(user.id),
        role=user.role,
        session_id=str(new_sess.id)
    )

    set_refresh_cookie(response, new_refresh_token)

    return TokenResponse(access_token=new_access_token, token_type="bearer")


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")
    cookie_token = request.cookies.get(COOKIE_KEY)

    if cookie_token:
        token_hash = security.hash_token(cookie_token)
        sess = db.query(UserSession).filter(UserSession.token_hash == token_hash).first()
        if sess and not sess.revoked_at:
            sess.revoked_at = datetime.now(timezone.utc)
            sess.revoke_reason = "user_logout"
            db.commit()

            AuditService.log_event(
                db, event_type=AuditEventType.LOGOUT, user_id=sess.user_id,
                ip_address=ip, user_agent=ua
            )

    clear_refresh_cookie(response)
    return {"status": "success", "detail": "تم تسجيل الخروج بنجاح."}


@router.post("/verify-email")
def verify_email(
    verify_in: VerifyEmailRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    token_hash = security.hash_token(verify_in.token)
    now = datetime.now(timezone.utc)

    # Atomic lookup
    rec = db.query(EmailVerification).filter(
        EmailVerification.token_hash == token_hash,
        EmailVerification.purpose == "initial_email_verification"
    ).first()

    if not rec:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_INVALID", "message": "رمز التفعيل غير صالح."}
        )

    if rec.used_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_ALREADY_USED", "message": "رمز التفعيل تم استخدامه بالفعل."}
        )

    if rec.expires_at <= now or rec.invalidated_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_EXPIRED", "message": "انتهت صلاحية رمز التفعيل، يرجى طلب رمز جديد."}
        )

    # Consume token & activate user
    rec.used_at = now
    user = db.query(User).filter(User.id == rec.user_id).first()
    if user:
        user.is_verified = True
        user.status = "active"
        user.email_verified_at = now
        db.commit()

        AuditService.log_event(
            db, event_type=AuditEventType.EMAIL_VERIFIED, user_id=user.id,
            ip_address=ip, user_agent=ua
        )

    return {"status": "success", "detail": "تم تفعيل الحساب بنجاح، يمكنك الآن تسجيل الدخول."}


@router.post("/resend-verification")
def resend_verification(
    resend_in: ResendVerificationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")
    normalized_email = resend_in.email.strip().lower()

    # Rate limiting: 3 per hour per email & IP
    enforce_rate_limit(f"resend_verif:{normalized_email}", max_requests=3, window_seconds=3600)
    enforce_rate_limit(f"resend_verif_ip:{ip}", max_requests=5, window_seconds=3600)

    user = db.query(User).filter(User.normalized_email == normalized_email).first()

    # Always return neutral response regardless of whether account exists or is verified
    neutral_msg = "إذا كان الحساب مؤهلاً، فقد تم إرسال رابط التفعيل إلى البريد الإلكتروني."

    if user and user.status == "pending_verification" and not user.is_verified:
        now = datetime.now(timezone.utc)
        # Invalidate old verification tokens
        db.query(EmailVerification).filter(
            EmailVerification.user_id == user.id,
            EmailVerification.purpose == "initial_email_verification",
            EmailVerification.used_at == None
        ).update({EmailVerification.invalidated_at: now})

        raw_token = security.generate_secure_token()
        token_hash = security.hash_token(raw_token)
        expires_at = now + timedelta(minutes=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES)

        verif = EmailVerification(
            user_id=user.id,
            token_hash=token_hash,
            purpose="initial_email_verification",
            target_email=user.email,
            created_at=now,
            expires_at=expires_at
        )
        db.add(verif)
        db.commit()

        EmailService.send_verification_email(user.email, raw_token, lang=user.preferred_language)

        AuditService.log_event(
            db, event_type=AuditEventType.EMAIL_VERIFICATION_SENT, user_id=user.id,
            ip_address=ip, user_agent=ua
        )

    return {"status": "success", "detail": neutral_msg}


@router.post("/forgot-password")
def forgot_password(
    forgot_in: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")
    normalized_email = forgot_in.email.strip().lower()

    # Rate limit: 3 requests per hour
    enforce_rate_limit(f"forgot_pw:{normalized_email}", max_requests=3, window_seconds=3600)
    enforce_rate_limit(f"forgot_pw_ip:{ip}", max_requests=5, window_seconds=3600)

    user = db.query(User).filter(User.normalized_email == normalized_email).first()

    neutral_msg = "إذا كان البريد الإلكتروني مسجلاً، فقد تم إرسال رابط إعادة تعيين كلمة المرور."

    if user and user.status in ("active", "pending_verification"):
        now = datetime.now(timezone.utc)
        # Invalidate previous unused reset tokens
        db.query(PasswordReset).filter(
            PasswordReset.user_id == user.id,
            PasswordReset.purpose == "password_reset",
            PasswordReset.used_at == None
        ).update({PasswordReset.invalidated_at: now})

        raw_token = security.generate_secure_token()
        token_hash = security.hash_token(raw_token)
        expires_at = now + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)

        reset_rec = PasswordReset(
            user_id=user.id,
            token_hash=token_hash,
            purpose="password_reset",
            created_at=now,
            expires_at=expires_at
        )
        db.add(reset_rec)
        db.commit()

        EmailService.send_password_reset_email(user.email, raw_token, lang=user.preferred_language)

        AuditService.log_event(
            db, event_type=AuditEventType.PASSWORD_RESET_REQUESTED, user_id=user.id,
            ip_address=ip, user_agent=ua
        )

    return {"status": "success", "detail": neutral_msg}


@router.post("/validate-reset-token")
def validate_reset_token(
    val_in: ValidateResetTokenRequest,
    db: Session = Depends(get_db)
):
    token_hash = security.hash_token(val_in.token)
    now = datetime.now(timezone.utc)

    rec = db.query(PasswordReset).filter(
        PasswordReset.token_hash == token_hash,
        PasswordReset.purpose == "password_reset"
    ).first()

    if not rec:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_INVALID", "message": "رابط إعادة التعيين غير صالح."}
        )

    if rec.used_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_ALREADY_USED", "message": "رابط إعادة التعيين تم استخدامه بالفعل."}
        )

    if rec.expires_at <= now or rec.invalidated_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_EXPIRED", "message": "انتهت صلاحية رابط إعادة تعيين كلمة المرور."}
        )

    return {"valid": True, "detail": "الرابط صالح للمتابعة."}


@router.post("/reset-password")
def reset_password(
    reset_in: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    # 1. Match new password and confirm
    if reset_in.new_password != reset_in.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "PASSWORD_MISMATCH", "message": "كلمة المرور وتأكيدها غير متطابقين."}
        )

    # 2. Token lookup
    token_hash = security.hash_token(reset_in.token)
    now = datetime.now(timezone.utc)

    rec = db.query(PasswordReset).filter(
        PasswordReset.token_hash == token_hash,
        PasswordReset.purpose == "password_reset"
    ).first()

    if not rec or rec.used_at or rec.expires_at <= now or rec.invalidated_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_INVALID", "message": "رابط إعادة التعيين غير صالح أو منتهي الصلاحية."}
        )

    user = db.query(User).filter(User.id == rec.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "USER_NOT_FOUND", "message": "المستخدم غير موجود."}
        )

    # 3. Validate password against authoritative policy
    is_valid_pw, pw_errors = validate_password_policy(
        password=reset_in.new_password,
        email=user.email,
        name=user.name
    )
    if not is_valid_pw:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "PASSWORD_TOO_WEAK", "message": pw_errors[0], "field_errors": {"new_password": pw_errors[0]}}
        )

    # 4. Atomic token consumption & Password update
    rec.used_at = now
    user.password_hash = security.hash_password(normalize_password(reset_in.new_password))
    user.password_changed_at = now
    db.commit()

    # 5. Revoke ALL active sessions
    SessionService.revoke_all_sessions(db, user.id, reason="password_reset")

    # 6. Audit log & Security email
    AuditService.log_event(
        db, event_type=AuditEventType.PASSWORD_RESET_COMPLETED, user_id=user.id,
        ip_address=ip, user_agent=ua
    )
    EmailService.send_password_changed_email(user.email, lang=user.preferred_language)

    return {"status": "success", "detail": "تم إعادة تعيين كلمة المرور بنجاح، تم إلغاء جميع الجلسات القديمة لمزيد من الأمان."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    res = UserResponse.model_validate(current_user)
    res.effective_status = compute_effective_status(current_user)
    return res
