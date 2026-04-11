from app.core.config import settings
from app.core.utils.responses import error_response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH"):
            raw = request.headers.get("content-length")
            if raw:
                try:
                    length = int(raw)
                except ValueError:
                    return JSONResponse(
                        status_code=400,
                        content=error_response("BAD_REQUEST", "Invalid Content-Length"),
                    )
                if settings.max_request_body_bytes and length > settings.max_request_body_bytes:
                    return JSONResponse(
                        status_code=413,
                        content=error_response("PAYLOAD_TOO_LARGE", "Request body is too large"),
                    )
        return await call_next(request)
