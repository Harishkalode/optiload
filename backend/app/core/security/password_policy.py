import re

from app.core.utils.errors import AppError

_MIN_LENGTH = 12
_MAX_LENGTH = 128


def validate_password_strength(password: str) -> None:
    if len(password) < _MIN_LENGTH:
        raise AppError(
            "WEAK_PASSWORD",
            f"Password must be at least {_MIN_LENGTH} characters",
            status_code=400,
        )
    if len(password) > _MAX_LENGTH:
        raise AppError("WEAK_PASSWORD", "Password is too long", status_code=400)
    if not re.search(r"[A-Z]", password):
        raise AppError("WEAK_PASSWORD", "Password must include an uppercase letter", status_code=400)
    if not re.search(r"[a-z]", password):
        raise AppError("WEAK_PASSWORD", "Password must include a lowercase letter", status_code=400)
    if not re.search(r"\d", password):
        raise AppError("WEAK_PASSWORD", "Password must include a digit", status_code=400)
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-=[\]\\;/`~]', password):
        raise AppError(
            "WEAK_PASSWORD",
            "Password must include a special character",
            status_code=400,
        )
