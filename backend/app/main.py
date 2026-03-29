import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.v1 import api_router
from app.core.config import DEFAULT_JWT_SECRET_PLACEHOLDER, settings
from app.core.middlewares.rate_limit import RateLimitMiddleware
from app.core.middlewares.request_size import MaxBodySizeMiddleware
from app.core.middlewares.safe_logging import AccessLogMiddleware
from app.core.middlewares.security_headers import SecurityHeadersMiddleware
from app.core.utils.responses import error_response
# Import models to register metadata
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.service import AuditLogService
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService

logger = logging.getLogger("optiload")


def create_app() -> FastAPI:
    application = FastAPI(title=settings.app_name)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Authorization", "Content-Type"],
    )
    application.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(MaxBodySizeMiddleware)
    application.add_middleware(RateLimitMiddleware)
    if settings.debug_logging:
        application.add_middleware(AccessLogMiddleware)
    application.include_router(api_router, prefix=settings.api_prefix)

    @application.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException):
        if isinstance(exc.detail, dict) and "code" in exc.detail:
            payload = error_response(exc.detail["code"], exc.detail.get("message", "Request error"))
        elif settings.expose_detailed_http_errors:
            payload = error_response("HTTP_ERROR", str(exc.detail))
        else:
            payload = error_response("HTTP_ERROR", "Request could not be processed")
        return JSONResponse(status_code=exc.status_code, content=payload)

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, __: RequestValidationError):
        message = "Invalid request" if not settings.expose_detailed_http_errors else "Validation failed"
        return JSONResponse(
            status_code=422,
            content=error_response("VALIDATION_ERROR", message),
        )

    @application.exception_handler(Exception)
    async def unhandled_exception_handler(_: Request, exc: Exception):
        logger.exception("Unhandled error: %s", exc.__class__.__name__)
        return JSONResponse(
            status_code=500,
            content=error_response("INTERNAL_ERROR", "Something went wrong"),
        )

    @application.on_event("shutdown")
    async def _close_rate_limit_redis() -> None:
        import app.core.rate_limit.backends as rl_backends

        client = rl_backends._redis_client
        if client is not None:
            try:
                await client.aclose()
            except Exception:
                pass
            rl_backends._redis_client = None

    return application


app = create_app()


@app.on_event("startup")
def on_startup() -> None:
    if settings.is_production and settings.jwt_secret_key == DEFAULT_JWT_SECRET_PLACEHOLDER:
        raise RuntimeError("OPTILOAD_JWT_SECRET_KEY must be set to a unique secret in production")

    if settings.is_production and settings.allow_public_registration:
        logger.warning("Public self-service registration is enabled in production; disable unless intended.")

    from app.core.database.session import SessionLocal

    db = SessionLocal()
    try:
        AuthService(AuthRepository(db), AuditLogService(AuditLogRepository(db))).bootstrap_super_admin()
    finally:
        db.close()
