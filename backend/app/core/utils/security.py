from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


BCRYPT_MAX_INPUT_LENGTH = 72


def _bcrypt_safe(password: str) -> str:
    # bcrypt ignores bytes after 72, so we enforce deterministic truncation before hashing.
    return password[:BCRYPT_MAX_INPUT_LENGTH]


def hash_password(password: str) -> str:
    return pwd_context.hash(_bcrypt_safe(password))


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(_bcrypt_safe(plain_password), password_hash)


def create_access_token(subject: str, role: str | None = None, organization_id: int | None = None) -> str:
    expires = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_token_minutes)
    payload = {"sub": subject, "exp": expires, "role": role, "organization_id": organization_id}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
