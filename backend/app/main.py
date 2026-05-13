import logging
import os
import signal
import sys

from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.v1 import api_router
from app.core.config import _DEFAULT_JWT_SECRET, settings
from app.core.logging_config import setup_logging
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

# Initialize logging first so all subsequent output is structured
logger = setup_logging()


_workers: list[object] = []


def _init_sentry() -> None:
    if settings.sentry_dsn:
        try:
            import sentry_sdk
            sentry_sdk.init(
                dsn=settings.sentry_dsn,
                environment=settings.environment,
                traces_sample_rate=0.1,
                send_default_pii=False,
            )
            logger.info("Sentry initialized for environment=%s", settings.environment)
        except Exception:
            logger.warning("Failed to initialize Sentry; continuing without.")


def _handle_signal(signum: int, _frame: object) -> None:
    logger.warning("Received signal %d; starting graceful shutdown…", signum)
    sys.exit(0)


def create_app() -> FastAPI:
    # Initialize error tracking before anything else
    _init_sentry()

    application = FastAPI(
        title=settings.app_name,
        docs_url="/docs" if settings.enable_api_docs else None,
        redoc_url="/redoc" if settings.enable_api_docs else None,
        openapi_url="/openapi.json" if settings.enable_api_docs else None,
    )

    if "*" in settings.cors_allowed_origins and settings.is_production:
        raise ValueError("CORS misconfiguration: wildcard not allowed in production")

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID", "X-API-Key"],
    )
    application.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(MaxBodySizeMiddleware)
    application.add_middleware(RateLimitMiddleware)

    if settings.csrf_enabled:
        from app.core.middlewares.csrf import CSRFMiddleware, configure_csrf_exempt_paths

        configure_csrf_exempt_paths(api_prefix=settings.api_prefix)
        application.add_middleware(CSRFMiddleware)

    from app.core.middlewares.request_id import RequestIDMiddleware

    application.add_middleware(RequestIDMiddleware)

    if settings.enable_query_counter:
        from app.core.middlewares.query_counter import QueryCounterMiddleware

        application.add_middleware(QueryCounterMiddleware)

    if settings.access_log_enabled:
        application.add_middleware(AccessLogMiddleware)

    from app.core.middlewares.api_key_auth import APIKeyAuthMiddleware

    application.add_middleware(APIKeyAuthMiddleware)

    application.include_router(api_router, prefix=settings.api_prefix)

    @application.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException):
        detail = exc.detail
        if isinstance(detail, dict) and "code" in detail:
            payload = error_response(detail["code"], detail.get("message", "Request error"))
        elif settings.expose_detailed_errors:
            payload = error_response("HTTP_ERROR", str(detail))
        else:
            payload = error_response("HTTP_ERROR", "Request could not be processed")
        return JSONResponse(status_code=exc.status_code, content=payload)

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(_: Request, __: RequestValidationError):
        message = "Invalid request" if not settings.expose_detailed_errors else "Validation failed"
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

# Register OS signal handlers for graceful shutdown
signal.signal(signal.SIGTERM, _handle_signal)
signal.signal(signal.SIGINT, _handle_signal)


@app.on_event("startup")
def on_startup() -> None:
    if settings.is_production and settings.jwt_secret_key == _DEFAULT_JWT_SECRET:
        raise RuntimeError("OPTILOAD_JWT_SECRET_KEY must be set to a unique secret in production")

    if settings.is_production and settings.allow_public_registration:
        logger.warning("Public self-service registration is enabled in production; disable unless intended.")

    # Auto-run lightweight DB migrations if needed (non-fatal on failure)
    try:
        from app.core.database.migration_autorun import ensure_securements_json_exists
        ensure_securements_json_exists()
    except Exception:
        logger.exception("Auto-migration check failed during startup; continuing without DB migration.")

    from app.core.database.session import SessionLocal

    db = SessionLocal()
    try:
        if settings.bootstrap_super_admin_enabled:
            AuthService(
                AuthRepository(db),
                AuditLogService(AuditLogRepository(db)),
            ).bootstrap_super_admin()
    finally:
        db.close()

    if os.getenv("OPTILOAD_SEED_ON_STARTUP", "").lower() in ("true", "1"):
        from app.core.seed import SeedDataService

        result = SeedDataService().run_seed()
        logger.info("Database seeded successfully: %s", result)
