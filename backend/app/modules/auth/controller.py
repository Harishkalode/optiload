from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.utils.responses import success_response
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.service import AuditLogService
from app.modules.auth.repository import AuthRepository
from app.modules.auth.service import AuthService
from app.modules.auth.validator import LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    audit_service = AuditLogService(AuditLogRepository(db))
    service = AuthService(AuthRepository(db), audit_service)
    result = service.login(payload.email, payload.password, request.client.host if request.client else "unknown")
    return success_response(result)
