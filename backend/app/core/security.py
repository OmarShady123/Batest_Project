import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from argon2 import PasswordHasher
from jose import jwt, JWTError
from app.core.config import settings

ph = PasswordHasher()

# Pre-computed dummy hash to ensure consistent timing when verifying invalid email address
DUMMY_ARGON2_HASH = ph.hash("dummy_password_for_timing_protection_12345")


def hash_password(password: str) -> str:
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except Exception:
        return False


def dummy_verify_password(plain_password: str) -> bool:
    """Verifies dummy password to prevent timing attacks when account does not exist."""
    try:
        ph.verify(DUMMY_ARGON2_HASH, plain_password)
    except Exception:
        pass
    return False


def generate_secure_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(
    subject: str,
    role: str,
    session_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "iat": now,
        "sub": str(subject),
        "role": role,
        "jti": str(uuid.uuid4()),
        "type": "access_token"
    }
    if session_id:
        to_encode["sid"] = str(session_id)

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access_token":
            return None
        return payload
    except JWTError:
        return None
