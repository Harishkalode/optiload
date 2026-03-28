import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class AccessLogMiddleware(BaseHTTPMiddleware):
    """Logs requests with Authorization values redacted (when access logs capture headers)."""

    def __init__(self, app):
        super().__init__(app)
        self._log = logging.getLogger("optiload.access")

    async def dispatch(self, request: Request, call_next):
        if self._log.isEnabledFor(logging.INFO):
            auth = request.headers.get("authorization")
            safe_auth = "Bearer *****" if auth else None
            self._log.info(
                "%s %s client=%s auth=%s",
                request.method,
                request.url.path,
                request.client.host if request.client else "-",
                safe_auth,
            )
        response = await call_next(request)
        return response
