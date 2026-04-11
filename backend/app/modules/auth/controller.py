from app.core.config import settings
from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.utils.responses import success_response
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.service import AuditLogService
from app.modules.auth.cookie_response import attach_auth_cookies, clear_auth_cookies, redact_tokens_for_response
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService
from app.modules.auth.validator import LoginRequest, MFAVerifyRequest, RefreshRequest, RegisterRequest
from fastapi import APIRouter, Body, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["auth"])


def _service(db: Session):
    return AuthService(AuthRepository(db), AuditLogService(AuditLogRepository(db)))


def _auth_json_response(data: dict) -> JSONResponse:
    access = data.get("access_token")
    refresh = data.get("refresh_token")
    public = redact_tokens_for_response(data)
    response = JSONResponse(content=success_response(public))
    if isinstance(access, str) and isinstance(refresh, str):
        attach_auth_cookies(response, access, refresh)
    return response


@router.post("/register")
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    result = _service(db).register_admin(payload.model_dump(), request.client.host if request.client else "unknown")
    return _auth_json_response(result)


@router.post("/login")
async def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    result = await _service(db).login(payload.email, payload.password, request.client.host if request.client else "unknown")
    return _auth_json_response(result)


@router.post("/logout")
def logout(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    _service(db).logout(current_user)
    response = JSONResponse(content=success_response({"logged_out": True}))
    return clear_auth_cookies(response)


@router.get("/me")
def me(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return success_response(_service(db).me(current_user))


@router.post("/refresh")
def refresh(
        request: Request,
        db: Session = Depends(get_db),
        body: RefreshRequest = Body(default_factory=RefreshRequest),
):
    token = body.refresh_token or request.cookies.get(settings.refresh_token_cookie_name)
    result = _service(db).refresh(token or "")
    return _auth_json_response(result)


@router.post("/mfa/verify")
def mfa_verify(payload: MFAVerifyRequest, request: Request, db: Session = Depends(get_db)):
    if payload.user_id is None:
        from app.core.utils.errors import AppError
        raise AppError("BAD_REQUEST", "user_id is required", status_code=400)
    result = _service(db).verify_mfa_and_issue_tokens(payload.user_id, payload.code)
    return _auth_json_response(result)


@router.post("/mfa/setup")
def mfa_setup(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    secret = _service(db).generate_mfa_secret(current_user)
    try:
        import pyotp
        provisioning_uri = pyotp.TOTP(secret).provisioning_uri(
            name=current_user.email,
            issuer_name=settings.app_name,
        )
    except ImportError:
        provisioning_uri = ""
    return success_response({"secret": secret, "provisioning_uri": provisioning_uri})


@router.post("/mfa/enable")
def mfa_enable(payload: MFAVerifyRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    result = _service(db).enable_mfa(current_user, payload.secret or "", payload.code)
    return success_response(result)


@router.post("/mfa/disable")
def mfa_disable(payload: MFAVerifyRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    result = _service(db).disable_mfa(current_user, payload.code)
    return success_response(result)
