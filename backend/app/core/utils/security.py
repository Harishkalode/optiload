from datetime import datetime, timedelta, timezone
from uuid import uuid4

import bcrypt
import jwt
from app.core.config import settings
from jwt.exceptions import PyJWTError

BCRYPT_MAX_INPUT_LENGTH = 72


def _bcrypt_safe_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:BCRYPT_MAX_INPUT_LENGTH]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_bcrypt_safe_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_bcrypt_safe_bytes(plain_password), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _base_claims(minutes_from_now: float | None = None, days_from_now: float | None = None) -> dict:
    now = datetime.now(timezone.utc)
    if minutes_from_now is not None:
        exp = now + timedelta(minutes=minutes_from_now)
    elif days_from_now is not None:
        exp = now + timedelta(days=days_from_now)
    else:
        exp = now + timedelta(minutes=settings.jwt_access_token_minutes or 15)
    return {
        "exp": exp,
        "iat": now,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    }


def create_access_token(subject: str, role: str | None = None, organization_id: int | None = None) -> str:
    claims = _base_claims(minutes_from_now=float(settings.jwt_access_token_minutes or 15))
    payload = {
        **claims,
        "sub": subject,
        "token_use": "access",
        "role": role,
        "organization_id": organization_id,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str, jti: str) -> str:
    claims = _base_claims(days_from_now=settings.jwt_refresh_token_days)
    payload = {**claims, "sub": subject, "token_use": "refresh", "jti": jti}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def new_refresh_jti() -> str:
    return str(uuid4())


def decode_token(token: str, *, expected_use: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
            options={"require": ["exp", "sub", "token_use"]},
        )
    except PyJWTError as exc:
        raise ValueError("Invalid token") from exc
    if payload.get("token_use") != expected_use:
        raise ValueError("Invalid token type")
    return payload


def decode_access_token(token: str) -> dict:
    return decode_token(token, expected_use="access")


def decode_refresh_token(token: str) -> dict:
    payload = decode_token(token, expected_use="refresh")
    jti = payload.get("jti")
    if not jti or not isinstance(jti, str):
        raise ValueError("Invalid refresh token")
    return payload
