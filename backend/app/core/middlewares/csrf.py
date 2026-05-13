"""CSRF protection middleware.

Uses double-submit cookie pattern:
- Server sets csrf_token cookie on auth responses
- Client sends X-CSRF-Token header matching the cookie
- Middleware validates they match
"""

import secrets

from app.core.config import settings
from app.core.utils.responses import error_response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

# Paths exempt from CSRF validation (credential-based auth is inherently CSRF-safe)
EXEMPT_PATHS: set[str] = set()


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in SAFE_METHODS:
            return await call_next(request)

        if not settings.csrf_enabled:
            return await call_next(request)

        if request.url.path in EXEMPT_PATHS:
            return await call_next(request)

        csrf_header = request.headers.get("X-CSRF-Token")
        csrf_cookie = request.cookies.get("csrf_token")

        if not csrf_header or not csrf_cookie:
            return JSONResponse(
                status_code=403,
                content=error_response("CSRF_INVALID", "CSRF token missing"),
            )

        if not secrets.compare_digest(csrf_header, csrf_cookie):
            return JSONResponse(
                status_code=403,
                content=error_response("CSRF_INVALID", "CSRF token mismatch"),
            )

        return await call_next(request)


def generate_csrf_token() -> str:
    return secrets.token_hex(32)


def configure_csrf_exempt_paths(*, api_prefix: str) -> None:
    """Register paths that should bypass CSRF protection."""
    EXEMPT_PATHS.add(f"{api_prefix}/auth/login")
