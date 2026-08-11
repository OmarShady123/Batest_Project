from datetime import datetime, timezone
import uuid
from typing import Callable, List, Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core import security
from app.db.session import get_db
from app.models.user import User
from app.models.user_session import UserSession

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)


def get_client_ip(request: Request) -> str:
    """Extracts client IP, respecting trusted proxies if configured."""
    from app.core.config import settings
    if settings.TRUSTED_PROXIES and request.headers.get("x-forwarded-for"):
        forwarded = request.headers.get("x-forwarded-for")
        ips = [ip.strip() for ip in forwarded.split(",")]
        if ips:
            return ips[0]
    return request.client.host if request.client else "unknown"


def compute_effective_status(user: User) -> str:
    """Authoritative computation of effective account status."""
    now = datetime.now(timezone.utc)
    locked_until = user.locked_until
    if locked_until and locked_until.tzinfo is None:
        locked_until = locked_until.replace(tzinfo=timezone.utc)
    if locked_until and locked_until > now:
        return "locked"
    return user.status


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTHENTICATION_REQUIRED", "message": "تسجيل الدخول مطلوب"}
        )
    
    payload = security.decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_INVALID", "message": "جلسة غير صالحة أو منتهية الصلاحية"}
        )

    user_id = payload.get("sub")
    session_id = payload.get("sid")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_INVALID", "message": "رمز وصول غير صالح"}
        )

    # PostgreSQL UUID columns expect UUID objects when psycopg3 is used. JWT
    # claims are strings, so normalize them before building SQL expressions.
    try:
        user_uuid = uuid.UUID(str(user_id))
        session_uuid = uuid.UUID(str(session_id)) if session_id else None
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_INVALID", "message": "رمز وصول غير صالح"}
        )

    # Validate active session if session_id is present
    if session_uuid:
        sess = db.query(UserSession).filter(
            UserSession.id == session_uuid,
            UserSession.revoked_at == None
        ).first()
        if not sess:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "SESSION_REVOKED", "message": "تم إلغاء الجلسة الخاصة بك"}
            )

    user = db.query(User).filter(User.id == user_uuid).first()
    if not user or user.status == "deleted":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_NOT_FOUND", "message": "المستخدم غير موجود"}
        )

    return user


def require_active_user(user: User = Depends(get_current_user)) -> User:
    eff_status = compute_effective_status(user)
    if eff_status == "locked":
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail={"code": "ACCOUNT_LOCKED", "message": "الحساب مقفل مؤقتاً بسبب كثرة محاولات الدخول الخاطئة"}
        )
    if eff_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_SUSPENDED", "message": "تم تعليق حسابك بواسطة إدارة الموقع"}
        )
    if eff_status == "deleted":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "ACCOUNT_DELETED", "message": "الحساب محذوف"}
        )
    return user


def require_verified_user(user: User = Depends(require_active_user)) -> User:
    if user.status == "pending_verification" or not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "EMAIL_NOT_VERIFIED", "message": "البريد الإلكتروني غير مفعل، يرجى تفعيل حسابك أولاً"}
        )
    return user


def require_roles(*roles: str) -> Callable:
    def dependency(user: User = Depends(require_verified_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": "ليس لديك الصلاحية الكافية لهذا الإجراء"}
            )
        return user
    return dependency


def require_admin(user: User = Depends(require_verified_user)) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "هذا الإجراء يتطلب صلاحيات مسؤول"}
        )
    return user


def require_visitor(user: User = Depends(require_verified_user)) -> User:
    if user.role != "visitor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "هذا الإجراء متاح فقط للزوار"}
        )
    return user

