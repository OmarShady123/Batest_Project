from typing import Any, Dict

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from app.core.config import settings


class GoogleIdentityError(Exception):
    """Raised when a Google credential cannot be trusted."""


class GoogleIdentityService:
    """Server-side verifier for Google Identity Services ID tokens."""

    @staticmethod
    def verify_credential(credential: str) -> Dict[str, Any]:
        if not settings.GOOGLE_CLIENT_ID:
            raise GoogleIdentityError("Google authentication is not configured")

        if not credential or not isinstance(credential, str):
            raise GoogleIdentityError("Missing Google credential")

        try:
            claims = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except Exception as exc:
            raise GoogleIdentityError("Invalid Google credential") from exc

        issuer = claims.get("iss")
        if issuer not in {"accounts.google.com", "https://accounts.google.com"}:
            raise GoogleIdentityError("Unexpected Google token issuer")

        subject = claims.get("sub")
        email = claims.get("email")
        email_verified = claims.get("email_verified") is True

        if not subject or not email or not email_verified:
            raise GoogleIdentityError("Google account email is not verified")

        normalized_email = str(email).strip().lower()
        if not normalized_email:
            raise GoogleIdentityError("Google account email is missing")

        return {
            "sub": str(subject),
            "email": str(email).strip(),
            "normalized_email": normalized_email,
            "name": claims.get("name"),
            "email_verified": True,
            "hd": claims.get("hd"),
        }
