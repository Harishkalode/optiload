from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.v1 import api_router
from app.core.config import settings
from app.core.database.base import Base
from app.core.database.session import engine
from app.core.middlewares.rate_limit import RateLimitMiddleware
from app.core.middlewares.security_headers import SecurityHeadersMiddleware
from app.core.utils.responses import error_response

# Import models to register metadata
from app.modules.audit_logs import model as _audit_model
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.service import AuditLogService
from app.modules.auth import model as _auth_model
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService
from app.modules.loads import model as _loads_model
from app.modules.load_builder import model as _load_builder_model
from app.modules.optimization import model as _optimization_model
from app.modules.organizations import model as _org_model
from app.modules.permissions import model as _permission_model
from app.modules.roles import model as _role_model
from app.modules.system_monitoring import model as _monitoring_model
from app.modules.users import model as _users_model
from app.modules.vehicles import model as _vehicle_model

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.include_router(api_router, prefix=settings.api_prefix)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    from app.core.database.session import SessionLocal

    db = SessionLocal()
    try:
        AuthService(AuthRepository(db), AuditLogService(AuditLogRepository(db))).bootstrap_super_admin()
    finally:
        db.close()


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        payload = error_response(exc.detail["code"], exc.detail.get("message", "Request error"))
    else:
        payload = error_response("HTTP_ERROR", str(exc.detail))
    return JSONResponse(status_code=exc.status_code, content=payload)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, __: Exception):
    return JSONResponse(status_code=500, content=error_response("INTERNAL_ERROR", "Unexpected server error"))
