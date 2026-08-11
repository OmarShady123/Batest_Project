import json
from functools import lru_cache
from pathlib import Path
from typing import Any, List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    # ─────────────── Database ───────────────
    DATABASE_URL: str
    TEST_DATABASE_URL: Optional[str] = None

    # ─────────────── JWT / Security ───────────────
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REMEMBER_ME_REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    REFRESH_TOKEN_IDLE_TIMEOUT_HOURS: int = 24
    REMEMBER_ME_IDLE_TIMEOUT_DAYS: int = 7

    # ─────────────── Token Expiry ───────────────
    EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES: int = 1440   # 24h
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    EMAIL_CHANGE_TOKEN_EXPIRE_MINUTES: int = 1440         # 24h

    # ─────────────── Password Policy ───────────────
    PASSWORD_MIN_LENGTH: int = 15
    PASSWORD_MAX_LENGTH: int = 128

    # ─────────────── Account Locking ───────────────
    MAX_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCK_DURATION_MINUTES: int = 30

    # ─────────────── CORS / Frontend ───────────────
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:4173",
    ]
    # Legacy alias kept for existing code
    CORS_ORIGINS: Union[List[str], str] = []

    # ─────────────── CSRF ───────────────
    CSRF_TRUSTED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:4173",
    ]
    CSRF_COOKIE_NAME: str = "csrf_token"
    CSRF_HEADER_NAME: str = "X-CSRF-Token"

    # ─────────────── Cookies ───────────────
    COOKIE_SECURE: bool = False        # True in production (HTTPS)
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: Optional[str] = None

    # ─────────────── Environment ───────────────
    ENVIRONMENT: str = "development"
    DEV_EMAIL_MODE: bool = True

    # ─────────────── Redis / Rate Limiting ───────────────
    REDIS_URL: Optional[str] = None
    RATE_LIMIT_BACKEND: str = "memory"   # "memory" | "redis"
    RATE_LIMIT_PREFIX: str = "bastet_rl"

    # ─────────────── SMTP ───────────────
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@bastet-temple.org"
    SMTP_FROM_NAME: str = "معبد باستت"
    SMTP_USE_TLS: bool = True

    # Legacy aliases (backward compat)
    EMAIL_HOST: str = ""
    EMAIL_PORT: int = 587
    EMAIL_USERNAME: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@bastet-temple.org"

    # ─────────────── Admin Seed ───────────────
    ADMIN_EMAIL: str = "admin@bastet-temple.org"
    ADMIN_PASSWORD: str = ""
    ADMIN_FULL_NAME: str = "System Admin"


    # ─────────────── Terms ───────────────
    TERMS_URL: str = "http://localhost:5173/#/terms"
    PRIVACY_URL: str = "http://localhost:5173/#/privacy"
    CURRENT_TERMS_VERSION: str = "1.0"
    CURRENT_PRIVACY_VERSION: str = "1.0"

    # ─────────────── Trusted Proxies ───────────────
    TRUSTED_PROXIES: Union[List[str], str] = []

    @field_validator("CORS_ALLOWED_ORIGINS", "CORS_ORIGINS", "CSRF_TRUSTED_ORIGINS",
                     "TRUSTED_PROXIES", mode="before")
    @classmethod
    def parse_list_or_json(cls, v: Any) -> Union[List[str], str]:
        if isinstance(v, str):
            if v.startswith("["):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            if v:
                return [i.strip() for i in v.split(",") if i.strip()]
            return []
        return v or []

    def get_smtp_host(self) -> str:
        return self.SMTP_HOST or self.EMAIL_HOST

    def get_smtp_port(self) -> int:
        return self.SMTP_PORT if self.SMTP_HOST else self.EMAIL_PORT

    def get_smtp_username(self) -> str:
        return self.SMTP_USERNAME or self.EMAIL_USERNAME

    def get_smtp_password(self) -> str:
        return self.SMTP_PASSWORD or self.EMAIL_PASSWORD

    def get_smtp_from(self) -> str:
        return self.SMTP_FROM_EMAIL or self.EMAIL_FROM

    @staticmethod
    def _vercel_origins() -> List[str]:
        import os
        origins: List[str] = []
        for key in ("VERCEL_URL", "VERCEL_PROJECT_PRODUCTION_URL"):
            host = os.environ.get(key, "").strip()
            if host:
                origin = host if host.startswith(("http://", "https://")) else f"https://{host}"
                origin = origin.rstrip("/")
                if origin not in origins:
                    origins.append(origin)
        return origins

    def get_all_cors_origins(self) -> List[str]:
        origins = list(self.CORS_ALLOWED_ORIGINS)
        for o in list(self.CORS_ORIGINS) + self._vercel_origins():
            if o not in origins:
                origins.append(o)
        return origins

    def get_csrf_trusted_origins(self) -> List[str]:
        origins = list(self.CSRF_TRUSTED_ORIGINS)
        for o in self._vercel_origins():
            if o not in origins:
                origins.append(o)
        return origins

    model_config = {
        "env_file": str(DEFAULT_ENV_FILE),
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    import os
    env_file = os.environ.get("BACKEND_ENV_FILE", str(DEFAULT_ENV_FILE))
    return Settings(_env_file=env_file)

settings = get_settings()
