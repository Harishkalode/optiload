from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.responses import success_response
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.service import AuditLogService
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService
from app.modules.users.validator import UserCreateRequest, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def list_users(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = UserService(UserRepository(db), AuditLogService(AuditLogRepository(db)))
    users = service.list_users(get_tenant_organization_id(current_user))
    return success_response([
        {
            "id": u.id,
            "organization_id": u.organization_id,
            "name": u.name,
            "email": u.email,
            "role_id": u.role_id,
            "status": u.status.value,
            "mfa_enabled": u.mfa_enabled,
            "last_login": u.last_login,
            "created_at": u.created_at,
        }
        for u in users
    ])


@router.post("")
def create_user(payload: UserCreateRequest, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = UserService(UserRepository(db), AuditLogService(AuditLogRepository(db)))
    created = service.create_user(
        payload.model_dump(),
        actor_id=current_user.id,
        actor_org_id=current_user.organization_id,
        ip_address=request.client.host if request.client else "unknown",
    )
    return success_response({"id": created.id})


@router.put("/{user_id}")
def update_user(user_id: int, payload: UserUpdateRequest, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = UserService(UserRepository(db), AuditLogService(AuditLogRepository(db)))
    updated = service.update_user(
        user_id,
        payload.model_dump(),
        actor_id=current_user.id,
        actor_org_id=current_user.organization_id,
        ip_address=request.client.host if request.client else "unknown",
    )
    return success_response({"id": updated.id})


@router.delete("/{user_id}")
def delete_user(user_id: int, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = UserService(UserRepository(db), AuditLogService(AuditLogRepository(db)))
    service.delete_user(
        user_id,
        actor_id=current_user.id,
        actor_org_id=current_user.organization_id,
        ip_address=request.client.host if request.client else "unknown",
    )
    return success_response({"deleted": True})
