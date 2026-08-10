from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.models.user_session import UserSession
from app.models.verification import EmailVerification, PasswordReset
from app.schemas.user import UserCreate
from app.services.email_service import EmailService

class AuthService:
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        normalized = email.strip().lower()
        return db.query(User).filter(User.normalized_email == normalized).first()

    @classmethod
    def create_user(cls, db: Session, user_in: UserCreate) -> Tuple[User, str]:
        if user_in.password != user_in.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="كلمتا المرور غير متطابقتين"
            )
        
        normalized = user_in.email.strip().lower()
        if cls.get_user_by_email(db, user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="البريد الإلكتروني مسجل بالفعل"
            )
        
        hashed = security.hash_password(user_in.password)
        db_user = User(
            name=user_in.name,
            email=user_in.email,
            normalized_email=normalized,
            password_hash=hashed,
            role="visitor",
            is_active=True,
            is_verified=False
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Create verification token
        token = security.generate_secure_token()
        token_hash = security.hash_token(token)
        now = datetime.now(timezone.utc)
        db_verification = EmailVerification(
            user_id=db_user.id,
            token_hash=token_hash,
            created_at=now,
            expires_at=now + timedelta(hours=24)
        )
        db.add(db_verification)
        db.commit()

        EmailService.send_verification_email(db_user.email, token)
        return db_user, token

    @classmethod
    def authenticate_user(cls, db: Session, email: str, password: str) -> Optional[User]:
        user = cls.get_user_by_email(db, email)
        if not user:
            return None
        if not security.verify_password(password, user.password_hash):
            return None
        return user

    @staticmethod
    def create_refresh_session(db: Session, user_id: str, user_agent: Optional[str] = None, ip_address: Optional[str] = None) -> str:
        token = security.generate_secure_token()
        token_hash = security.hash_token(token)
        now = datetime.now(timezone.utc)
        expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        session = UserSession(
            user_id=user_id,
            token_hash=token_hash,
            created_at=now,
            expires_at=expires,
            user_agent=user_agent,
            ip_address=ip_address
        )
        db.add(session)
        db.commit()
        return token

    @classmethod
    def rotate_refresh_session(cls, db: Session, token: str, user_agent: Optional[str] = None, ip_address: Optional[str] = None) -> Tuple[str, str]:
        token_hash = security.hash_token(token)
        session = db.query(UserSession).filter(UserSession.token_hash == token_hash).first()
        now = datetime.now(timezone.utc)

        if not session or session.revoked_at or session.expires_at < now:
            # Security measure: if refresh token reuse is detected, revoke all user sessions
            if session:
                db.query(UserSession).filter(UserSession.user_id == session.user_id).update({UserSession.revoked_at: now})
                db.commit()
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="جلسة غير صالحة")

        new_token = security.generate_secure_token()
        new_token_hash = security.hash_token(new_token)
        new_expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        new_session = UserSession(
            user_id=session.user_id,
            token_hash=new_token_hash,
            created_at=now,
            expires_at=new_expires,
            user_agent=user_agent,
            ip_address=ip_address
        )
        db.add(new_session)
        db.flush()

        session.revoked_at = now
        session.replaced_by = new_session.id
        db.commit()

        user = db.query(User).filter(User.id == session.user_id).first()
        access_token = security.create_access_token(str(user.id), user.role)
        return access_token, new_token

    @staticmethod
    def revoke_refresh_session(db: Session, token: str):
        token_hash = security.hash_token(token)
        session = db.query(UserSession).filter(UserSession.token_hash == token_hash).first()
        if session:
            session.revoked_at = datetime.now(timezone.utc)
            db.commit()

    @staticmethod
    def verify_email_token(db: Session, token: str) -> bool:
        token_hash = security.hash_token(token)
        verification = db.query(EmailVerification).filter(EmailVerification.token_hash == token_hash).first()
        now = datetime.now(timezone.utc)

        if not verification or verification.used_at or verification.expires_at < now:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="رمز التفعيل غير صالح أو منتهي الصلاحية")

        user = db.query(User).filter(User.id == verification.user_id).first()
        user.is_verified = True
        verification.used_at = now
        db.commit()
        return True

    @classmethod
    def create_password_reset(cls, db: Session, email: str) -> Optional[str]:
        user = cls.get_user_by_email(db, email)
        if not user:
            return None

        # Invalidate existing pending resets
        db.query(PasswordReset).filter(PasswordReset.user_id == user.id, PasswordReset.used_at == None).update(
            {PasswordReset.expires_at: datetime.now(timezone.utc)}
        )

        token = security.generate_secure_token()
        token_hash = security.hash_token(token)
        now = datetime.now(timezone.utc)

        reset = PasswordReset(
            user_id=user.id,
            token_hash=token_hash,
            created_at=now,
            expires_at=now + timedelta(hours=1)
        )
        db.add(reset)
        db.commit()

        EmailService.send_password_reset_email(user.email, token)
        return token

    @staticmethod
    def reset_password(db: Session, token: str, password_in: str, confirm_password_in: str):
        if password_in != confirm_password_in:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="كلمتا المرور غير متطابقتين")

        token_hash = security.hash_token(token)
        reset = db.query(PasswordReset).filter(PasswordReset.token_hash == token_hash).first()
        now = datetime.now(timezone.utc)

        if not reset or reset.used_at or reset.expires_at < now:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="رمز إعادة التعيين غير صالح أو منتهي الصلاحية")

        user = db.query(User).filter(User.id == reset.user_id).first()
        user.password_hash = security.hash_password(password_in)
        reset.used_at = now
        db.commit()
