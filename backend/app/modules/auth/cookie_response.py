from app.core.config import settings
from fastapi.responses import JSONResponse


def attach_auth_cookies(response: JSONResponse, access_token: str, refresh_token: str) -> JSONResponse:
    response.set_cookie(
        key=settings.access_token_cookie_name,
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.jwt_access_token_minutes * 60,
        path="/",
    )
    response.set_cookie(
        key=settings.refresh_token_cookie_name,
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.jwt_refresh_token_days * 86400,
        path="/",
    )
    return response


def clear_auth_cookies(response: JSONResponse) -> JSONResponse:
    response.delete_cookie(settings.access_token_cookie_name, path="/")
    response.delete_cookie(settings.refresh_token_cookie_name, path="/")
    return response


def redact_tokens_for_response(data: dict) -> dict:
    if settings.include_tokens_in_json_response:
        return data
    out = {k: v for k, v in data.items() if k not in ("access_token", "refresh_token")}
    return out
