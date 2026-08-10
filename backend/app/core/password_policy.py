import unicodedata
from typing import List, Optional, Tuple
from app.core.config import settings

# Maintained list of commonly used / weak passwords
COMMON_PASSWORDS = {
    "123456", "password", "12345678", "qwerty", "123456789", "12345", "1234", "111111",
    "1234567", "dragon", "welcome", "monkey", "000000", "password123", "abc123456",
    "iloveyou", "admin", "admin123", "pass1234", "123123", "football", "letmein",
    "master", "sunshine", "cheerleader", "shadow", "superman", "starwars", "secret",
}

PROJECT_KEYWORD_PATTERNS = [
    "bastet", "temple", "tellbasta", "bubastis", "bastettemple", "bastet2026", "temple2026"
]


def normalize_password(password: str) -> str:
    """Apply Unicode NFC normalization to password."""
    if not password:
        return ""
    return unicodedata.normalize("NFC", password)


def validate_password_policy(
    password: str,
    email: Optional[str] = None,
    name: Optional[str] = None
) -> Tuple[bool, List[str]]:
    """
    Validates a new or changed password against authoritative policy.
    Returns (is_valid, list_of_error_messages).
    """
    normalized = normalize_password(password)
    errors = []

    # 1. Length checks
    if len(normalized) < settings.PASSWORD_MIN_LENGTH:
        errors.append(f"يجب أن تتكون كلمة المرور من {settings.PASSWORD_MIN_LENGTH} حرفاً على الأقل (Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long).")

    if len(normalized) > settings.PASSWORD_MAX_LENGTH:
        errors.append(f"يجب ألا تتجاوز كلمة المرور {settings.PASSWORD_MAX_LENGTH} حرفاً.")

    lowercased = normalized.lower()

    # 2. Blocklist / common passwords check
    if lowercased in COMMON_PASSWORDS:
        errors.append("كلمة المرور هذه شائعة جداً وسهلة التخمين، يرجى اختيار كلمة مرور أكثر أماناً.")

    # 3. Project specific obvious passwords check
    for kw in PROJECT_KEYWORD_PATTERNS:
        if lowercased == kw or lowercased == f"{kw}123" or lowercased == f"{kw}2026":
            errors.append("لا يمكن استخدام كلمات مرور مرتبطة باسم المشروع بشكل مباشر.")
            break

    # 4. Check against email
    if email:
        norm_email = email.strip().lower()
        email_username = norm_email.split("@")[0] if "@" in norm_email else norm_email
        if lowercased == norm_email or lowercased == email_username:
            errors.append("لا يمكن أن تكون كلمة المرور مماثلة للبريد الإلكتروني.")

    # 5. Check against name
    if name and len(name.strip()) >= 3:
        norm_name = name.strip().lower()
        if norm_name in lowercased or lowercased == norm_name:
            errors.append("لا يمكن أن تحتوي كلمة المرور على اسمك شخصياً بشكل متطابق.")

    is_valid = len(errors) == 0
    return is_valid, errors
