"""API key authentication middleware.

Validates X-API-Key header against stored API keys.
Sets request.state.api_key if valid, allowing API-key-based auth.
"""

from app.core.database.session import SessionLocal
from app.core.utils.responses import error_response
from app.modules.api_keys.repository import ApiKeyRepository
from app.modules.api_keys.service import ApiKeyService
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    EXEMPT_PATHS = {"/docs", "/redoc", "/openapi.json", "/api/v1/meta/health", "/api/v1/meta/ready"}

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return await call_next(request)

        db = SessionLocal()
        try:
            service = ApiKeyService(ApiKeyRepository(db))
            key_record = service.validate_key(api_key)
            if key_record:
                request.state.api_key = key_record
                request.state.api_key_org_id = key_record.organization_id
        except Exception:
            pass
        finally:
            db.close()

        if not hasattr(request.state, "api_key"):
            return JSONResponse(
                status_code=401,
                content=error_response("INVALID_API_KEY", "Invalid or inactive API key"),
            )

        return await call_next(request)
