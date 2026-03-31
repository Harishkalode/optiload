from app.core.rate_limit.backends import create_rate_limit_checker
from app.core.utils.responses import error_response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._checker = create_rate_limit_checker()

    async def dispatch(self, request: Request, call_next):
        from app.core.config import settings

        ip = request.client.host if request.client else "unknown"
        login_path = f"{settings.api_prefix.rstrip('/')}/auth/login"
        is_login = request.url.path.rstrip("/") == login_path.rstrip("/") and request.method == "POST"
        try:
            decision = await self._checker.check(ip=ip, is_login=is_login)
            if not decision.allowed:
                message = "Too many login attempts" if is_login else "Too many requests"
                return JSONResponse(status_code=429, content=error_response("RATE_LIMITED", message))
        except Exception:
            return JSONResponse(
                status_code=503,
                content={"error": "Rate limiting unavailable"}
            )
        return await call_next(request)
