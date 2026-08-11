import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple, Any
from sqlalchemy.orm import Session
from user_agents import parse as parse_ua
from app.models.user_session import UserSession
from app.core.config import settings
from app.core import security

class SessionService:
    @staticmethod
    def parse_ua_info(user_agent_str: Optional[str]) -> Tuple[str, str, str]:
        """Returns (device_name, browser, operating_system)."""
        if not user_agent_str:
            return ("Unknown Device", "Unknown Browser", "Unknown OS")
        try:
            ua = parse_ua(user_agent_str)
            device_type = "Mobile" if ua.is_mobile else ("Tablet" if ua.is_tablet else ("PC" if ua.is_pc else "Device"))
            device_name = f"{ua.device.family} ({device_type})" if ua.device.family and ua.device.family != "Other" else device_type
            browser = f"{ua.browser.family} {ua.browser.version_string}".strip()
            os = f"{ua.os.family} {ua.os.version_string}".strip()
            return (device_name, browser, os)
        except Exception:
            return ("Device", "Browser", "OS")

    @staticmethod
    def create_session(
        db: Session,
        user_id: Any,
        token: str,
        remember_me: bool = False,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
        family_id: Optional[uuid.UUID] = None
    ) -> UserSession:
        now = datetime.now(timezone.utc)
        token_hash = security.hash_token(token)
        
        # Calculate expiration
        refresh_days = settings.REMEMBER_ME_REFRESH_TOKEN_EXPIRE_DAYS if remember_me else settings.REFRESH_TOKEN_EXPIRE_DAYS
        expires_at = now + timedelta(days=refresh_days)

        idle_hours = (settings.REMEMBER_ME_IDLE_TIMEOUT_DAYS * 24) if remember_me else settings.REFRESH_TOKEN_IDLE_TIMEOUT_HOURS
        idle_expires_at = now + timedelta(hours=idle_hours)

        device_name, browser, os = SessionService.parse_ua_info(user_agent)

        session = UserSession(
            user_id=user_id,
            token_family_id=family_id or uuid.uuid4(),
            token_hash=token_hash,
            device_name=device_name,
            browser=browser,
            operating_system=os,
            user_agent=user_agent[:500] if user_agent else None,
            ip_address=ip_address,
            created_at=now,
            last_used_at=now,
            expires_at=expires_at,
            idle_expires_at=idle_expires_at,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_user_sessions(db: Session, user_id: Any, current_session_id: Optional[Any] = None) -> List[dict]:
        now = datetime.now(timezone.utc)
        sessions = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.revoked_at == None,
            UserSession.expires_at > now
        ).order_by(UserSession.last_used_at.desc()).all()

        results = []
        for s in sessions:
            # Skip if idle timeout reached. SQLite used in tests may return
            # naive timestamps even for timezone-aware columns.
            idle_expires_at = s.idle_expires_at
            if idle_expires_at and idle_expires_at.tzinfo is None:
                idle_expires_at = idle_expires_at.replace(tzinfo=timezone.utc)
            if idle_expires_at and idle_expires_at < now:
                continue
            is_current = str(s.id) == str(current_session_id) if current_session_id else False
            results.append({
                "id": s.id,
                "device_name": s.device_name or "Unknown Device",
                "browser": s.browser or "Unknown Browser",
                "operating_system": s.operating_system or "Unknown OS",
                "ip_address": s.ip_address,
                "user_agent": s.user_agent,
                "created_at": s.created_at,
                "last_used_at": s.last_used_at,
                "expires_at": s.expires_at,
                "is_current": is_current,
            })
        return results

    @staticmethod
    def revoke_session(db: Session, session_id: Any, user_id: Any, reason: str = "user_logout") -> bool:
        session = db.query(UserSession).filter(
            UserSession.id == session_id,
            UserSession.user_id == user_id,
            UserSession.revoked_at == None
        ).first()
        if not session:
            return False
        session.revoked_at = datetime.now(timezone.utc)
        session.revoke_reason = reason
        db.commit()
        return True

    @staticmethod
    def revoke_all_sessions(db: Session, user_id: Any, except_session_id: Optional[Any] = None, reason: str = "logout_all") -> int:
        now = datetime.now(timezone.utc)
        query = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.revoked_at == None
        )
        if except_session_id:
            query = query.filter(UserSession.id != except_session_id)
        
        count = 0
        for s in query.all():
            s.revoked_at = now
            s.revoke_reason = reason
            count += 1
        db.commit()
        return count

    @staticmethod
    def revoke_family_sessions(db: Session, token_family_id: Any, reason: str = "reuse_detected") -> int:
        now = datetime.now(timezone.utc)
        query = db.query(UserSession).filter(
            UserSession.token_family_id == token_family_id,
            UserSession.revoked_at == None
        )
        count = 0
        for s in query.all():
            s.revoked_at = now
            s.revoke_reason = reason
            count += 1
        db.commit()
        return count
