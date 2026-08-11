from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit_log import SecurityAuditLog

# Event Types Constants
class AuditEventType:
    SIGNUP_COMPLETED = "SIGNUP_COMPLETED"
    EMAIL_VERIFICATION_SENT = "EMAIL_VERIFICATION_SENT"
    EMAIL_VERIFIED = "EMAIL_VERIFIED"
    LOGIN_SUCCESS = "LOGIN_SUCCESS"
    LOGIN_FAILED = "LOGIN_FAILED"
    GOOGLE_ACCOUNT_LINKED = "GOOGLE_ACCOUNT_LINKED"
    GOOGLE_SIGNUP_COMPLETED = "GOOGLE_SIGNUP_COMPLETED"
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
    ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED"
    LOGOUT = "LOGOUT"
    LOGOUT_ALL = "LOGOUT_ALL"
    PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED"
    PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED"
    PASSWORD_CHANGED = "PASSWORD_CHANGED"
    EMAIL_CHANGE_REQUESTED = "EMAIL_CHANGE_REQUESTED"
    EMAIL_CHANGED = "EMAIL_CHANGED"
    SESSION_CREATED = "SESSION_CREATED"
    SESSION_REVOKED = "SESSION_REVOKED"
    REFRESH_TOKEN_REUSE_DETECTED = "REFRESH_TOKEN_REUSE_DETECTED"
    ROLE_CHANGED = "ROLE_CHANGED"
    ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED"
    ACCOUNT_REACTIVATED = "ACCOUNT_REACTIVATED"
    ACCOUNT_DELETED = "ACCOUNT_DELETED"
    BACKUP_CODE_USED = "BACKUP_CODE_USED"


# Sensitive keys to NEVER store in audit metadata
SENSITIVE_KEYS = {
    "password", "password_hash", "confirm_password", "new_password",
    "token", "raw_token", "access_token", "refresh_token",
    "secret", "cookie"
}


def sanitize_event_data(data: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not data:
        return None
    sanitized = {}
    for key, value in data.items():
        if key.lower() in SENSITIVE_KEYS:
            continue
        if isinstance(value, dict):
            sanitized[key] = sanitize_event_data(value)
        elif isinstance(value, (str, int, float, bool, type(None))):
            sanitized[key] = value
        else:
            sanitized[key] = str(value)
    return sanitized


class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        event_type: str,
        user_id: Optional[Any] = None,
        actor_user_id: Optional[Any] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        event_data: Optional[Dict[str, Any]] = None
    ) -> SecurityAuditLog:
        clean_data = sanitize_event_data(event_data)
        log_entry = SecurityAuditLog(
            user_id=user_id,
            actor_user_id=actor_user_id or user_id,
            event_type=event_type,
            ip_address=ip_address,
            user_agent=user_agent[:500] if user_agent else None,
            event_data=clean_data
        )
        db.add(log_entry)
        try:
            db.commit()
            db.refresh(log_entry)
        except Exception:
            db.rollback()
        return log_entry
