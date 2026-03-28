from datetime import datetime, timedelta, timezone

import bcrypt
from app.core.config import settings
from jose import JWTError, jwt

BCRYPT_MAX_INPUT_LENGTH = 72


def _bcrypt_safe_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:BCRYPT_MAX_INPUT_LENGTH]


BCRYPT_MAX_INPUT_LENGTH = 72


def _bcrypt_safe(password: str) -> str:
    # bcrypt ignores bytes after 72, so we enforce deterministic truncation before hashing.
    return password[:BCRYPT_MAX_INPUT_LENGTH]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_bcrypt_safe_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_bcrypt_safe_bytes(plain_password), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str, role: str | None = None, organization_id: int | None = None) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_minutes)
    payload = {"sub": subject, "exp": expires, "role": role, "organization_id": organization_id}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
