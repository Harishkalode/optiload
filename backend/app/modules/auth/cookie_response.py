"""Cookie management with environment-driven security flags."""

from app.core.config import settings
from app.core.middlewares.csrf import generate_csrf_token
from fastapi.responses import JSONResponse


def attach_auth_cookies(response: JSONResponse, access_token: str, refresh_token: str) -> JSONResponse:
    access_max = (settings.jwt_access_token_minutes or 15) * 60
    refresh_max = (settings.jwt_refresh_token_days or 7) * 86400
    samesite = settings.cookie_samesite or "lax"

    response.set_cookie(
        key=settings.access_token_cookie_name,
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=samesite,
        max_age=access_max,
        path="/",
    )
    response.set_cookie(
        key=settings.refresh_token_cookie_name,
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict" if settings.is_production else "lax",
        max_age=refresh_max,
        path="/api/v1/auth/refresh",
    )

    if settings.csrf_enabled:
        csrf_token = generate_csrf_token()
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            secure=settings.cookie_secure,
            samesite="strict" if settings.is_production else "lax",
            max_age=access_max,
            path="/",
        )

    return response


def clear_auth_cookies(response: JSONResponse) -> JSONResponse:
    response.delete_cookie(settings.access_token_cookie_name, path="/")
    response.delete_cookie(settings.refresh_token_cookie_name, path="/api/v1/auth/refresh")
    if settings.csrf_enabled:
        response.delete_cookie("csrf_token", path="/")
    return response


def redact_tokens_for_response(data: dict) -> dict:
    if settings.include_tokens_in_json_response:
        return data
    return {k: v for k, v in data.items() if k not in ("access_token", "refresh_token")}
