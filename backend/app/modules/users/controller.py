from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.service import AuditLogService
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService
from app.modules.users.validator import UserCreateRequest, UserRolePatchRequest, UserStatusPatchRequest, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])


def _service(db: Session) -> UserService:
    return UserService(UserRepository(db), AuditLogService(AuditLogRepository(db)))


@router.get("")
def list_users(page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=100), search: str | None = None, role_id: int | None = None, status: str | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    users = _service(db).list_users(get_tenant_organization_id(current_user))
    if search:
        term = search.lower()
        users = [u for u in users if term in u.name.lower() or term in u.email.lower()]
    if role_id:
        users = [u for u in users if u.role_id == role_id]
    if status:
        users = [u for u in users if u.status.value == status]
    start = (page - 1) * page_size
    sliced = users[start : start + page_size]
    return success_response({"items": [{"id": u.id, "organization_id": u.organization_id, "name": u.name, "email": u.email, "role_id": u.role_id, "status": u.status.value, "mfa_enabled": u.mfa_enabled, "last_login": u.last_login, "created_at": u.created_at} for u in sliced], "total": len(users), "page": page, "page_size": page_size})


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user = UserRepository(db).get_by_id(user_id)
    if not user:
        raise AppError("NOT_FOUND", "User not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and user.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    return success_response({"id": user.id, "organization_id": user.organization_id, "name": user.name, "email": user.email, "role_id": user.role_id, "status": user.status.value, "mfa_enabled": user.mfa_enabled, "last_login": user.last_login, "created_at": user.created_at})


@router.post("")
def create_user(payload: UserCreateRequest, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    created = _service(db).create_user(payload.model_dump(), actor_id=current_user.id, actor_org_id=current_user.organization_id, ip_address=request.client.host if request.client else "unknown")
    return success_response({"id": created.id})


@router.put("/{user_id}")
def update_user(user_id: int, payload: UserUpdateRequest, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    updated = _service(db).update_user(user_id, payload.model_dump(), actor_id=current_user.id, actor_org_id=current_user.organization_id, ip_address=request.client.host if request.client else "unknown")
    return success_response({"id": updated.id})


@router.patch("/{user_id}/status")
def patch_user_status(user_id: int, payload: UserStatusPatchRequest, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    updated = _service(db).update_user(user_id, {"status": payload.status}, actor_id=current_user.id, actor_org_id=current_user.organization_id, ip_address=request.client.host if request.client else "unknown")
    return success_response({"id": updated.id, "status": updated.status.value})


@router.patch("/{user_id}/role")
def patch_user_role(user_id: int, payload: UserRolePatchRequest, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    updated = _service(db).update_user(user_id, {"role_id": payload.role_id}, actor_id=current_user.id, actor_org_id=current_user.organization_id, ip_address=request.client.host if request.client else "unknown")
    return success_response({"id": updated.id, "role_id": updated.role_id})


@router.delete("/{user_id}")
def delete_user(user_id: int, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _service(db).delete_user(user_id, actor_id=current_user.id, actor_org_id=current_user.organization_id, ip_address=request.client.host if request.client else "unknown")
    return success_response({"deleted": True})
