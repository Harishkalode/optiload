from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.utils.responses import success_response
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.service import AuditLogService
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService
from app.modules.auth.validator import LoginRequest, RefreshRequest, RegisterRequest
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["auth"])


def _service(db: Session):
    return AuthService(AuthRepository(db), AuditLogService(AuditLogRepository(db)))


@router.post("/register")
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    result = _service(db).register_admin(payload.model_dump(), request.client.host if request.client else "unknown")
    return success_response(result)


@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    result = _service(db).login(payload.email, payload.password, request.client.host if request.client else "unknown")
    return success_response(result)


@router.post("/logout")
def logout(_=Depends(get_current_user)):
    return success_response({"logged_out": True})


@router.get("/me")
def me(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return success_response(_service(db).me(current_user))


@router.post("/refresh")
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    return success_response(_service(db).refresh(payload.refresh_token))
