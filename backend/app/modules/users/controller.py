from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.role import require_roles
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.service import AuditLogService
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService
from app.modules.users.validator import UserCreateRequest, UserRolePatchRequest, UserStatusPatchRequest, \
    UserUpdateRequest
from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import sqlalchemy as sa

router = APIRouter(prefix="/users", tags=["users"])


def _service(db: Session) -> UserService:
    return UserService(UserRepository(db), AuditLogService(AuditLogRepository(db)))


# ── Self-Service Account Endpoints (MUST be before /{user_id} routes) ─────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class ProfileUpdateRequest(BaseModel):
    name: str | None = None


class MfaToggleRequest(BaseModel):
    enabled: bool


class DemoModeToggleRequest(BaseModel):
    enabled: bool


@router.get("/me")
def get_my_profile(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return success_response({
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role_id": current_user.role_id,
        "status": current_user.status.value,
        "mfa_enabled": current_user.mfa_enabled,
        "demo_mode": current_user.demo_mode,
        "last_login": current_user.last_login,
        "created_at": current_user.created_at,
        "organization_id": current_user.organization_id,
    })


@router.post("/me/demo-mode")
def toggle_demo_mode(
        payload: DemoModeToggleRequest,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user),
):
    _service(db).update_user(current_user.id, {"demo_mode": payload.enabled},
                             actor_id=current_user.id, actor_org_id=current_user.organization_id,
                             ip_address="self-service")
    return success_response({"demo_mode": payload.enabled})


@router.post("/me/mfa")
def toggle_mfa(
        payload: MfaToggleRequest,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user),
):
    _service(db).update_user(current_user.id, {"mfa_enabled": payload.enabled},
                             actor_id=current_user.id, actor_org_id=current_user.organization_id,
                             ip_address="self-service")
    return success_response({"mfa_enabled": payload.enabled})


# ── User Preferences (Theme/UI) ──────────────────────────────────────────────

class UserPreferencesUpdate(BaseModel):
    color_mode: str | None = None
    palette: str | None = None
    sidebar_collapsed: bool | None = None
    selection_highlight: str | None = None
    table_row_highlight: str | None = None
    compact_mode: bool | None = None


@router.get("/me/preferences")
def get_my_preferences(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    row = db.execute(
        sa.text("SELECT color_mode, palette, sidebar_collapsed, selection_highlight, table_row_highlight, compact_mode FROM user_preferences WHERE user_id = :uid"),
        {"uid": current_user.id},
    ).first()
    if row:
        return success_response({
            "color_mode": row[0], "palette": row[1], "sidebar_collapsed": row[2],
            "selection_highlight": row[3], "table_row_highlight": row[4], "compact_mode": row[5],
        })
    return success_response({
        "color_mode": "auto", "palette": "industrial-blue", "sidebar_collapsed": False,
        "selection_highlight": "#3B82F6", "table_row_highlight": "#3B82F620", "compact_mode": False,
    })


@router.put("/me/preferences")
def update_my_preferences(
        payload: UserPreferencesUpdate,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user),
):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise AppError("NO_UPDATES", "No fields to update")
    set_clauses = ", ".join(f"{k} = :{k}" for k in updates)
    updates["uid"] = current_user.id
    db.execute(sa.text(f"""
        INSERT INTO user_preferences (user_id, color_mode, palette, sidebar_collapsed, selection_highlight, table_row_highlight, compact_mode)
        VALUES (:uid, 'auto', 'industrial-blue', false, '#3B82F6', '#3B82F620', false)
        ON CONFLICT (user_id) DO UPDATE SET {set_clauses}, updated_at = NOW()
    """), updates)
    db.commit()
    return success_response({"updated": True})


# ── Admin User Management Routes ──────────────────────────────────────────────

@router.get("")
def list_users(
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=20, ge=1, le=100),
        search: str | None = None,
        role_id: int | None = None,
        status: str | None = None,
        scope: str | None = Query(default=None, description="Use global for platform-wide listing (super_admin only)"),
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user),
):
    if scope == "global":
        require_roles(current_user, {"super_admin"})
        tenant_id = None
    else:
        tenant_id = get_tenant_organization_id(current_user)
        if tenant_id is None and not current_user.is_super_admin:
            raise AppError("ORG_REQUIRED", "organization context is required")
    users, total = _service(db).list_users_paginated(
        tenant_id, page=page, page_size=page_size,
        search=search, role_id=role_id, status=status,
    )
    return success_response({"items": [
        {"id": u.id, "organization_id": u.organization_id, "name": u.name, "email": u.email, "role_id": u.role_id,
         "status": u.status.value, "mfa_enabled": u.mfa_enabled, "last_login": u.last_login, "created_at": u.created_at}
        for u in users], "total": total, "page": page, "page_size": page_size})


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    user = UserRepository(db).get_by_id(user_id)
    if not user:
        raise AppError("NOT_FOUND", "User not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and user.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    return success_response(
        {"id": user.id, "organization_id": user.organization_id, "name": user.name, "email": user.email,
         "role_id": user.role_id, "status": user.status.value, "mfa_enabled": user.mfa_enabled,
         "last_login": user.last_login, "created_at": user.created_at})


@router.post("")
def create_user(payload: UserCreateRequest, request: Request, db: Session = Depends(get_db),
                current_user=Depends(get_current_user)):
    created = _service(db).create_user(payload.model_dump(), actor_id=current_user.id,
                                       actor_org_id=current_user.organization_id,
                                       ip_address=request.client.host if request.client else "unknown")
    return success_response({"id": created.id})


@router.put("/{user_id}")
def update_user(user_id: int, payload: UserUpdateRequest, request: Request, db: Session = Depends(get_db),
                current_user=Depends(get_current_user)):
    updated = _service(db).update_user(user_id, payload.model_dump(), actor_id=current_user.id,
                                       actor_org_id=current_user.organization_id,
                                       ip_address=request.client.host if request.client else "unknown")
    return success_response({"id": updated.id})


@router.patch("/{user_id}/status")
def patch_user_status(user_id: int, payload: UserStatusPatchRequest, request: Request, db: Session = Depends(get_db),
                      current_user=Depends(get_current_user)):
    updated = _service(db).update_user(user_id, {"status": payload.status}, actor_id=current_user.id,
                                       actor_org_id=current_user.organization_id,
                                       ip_address=request.client.host if request.client else "unknown")
    return success_response({"id": updated.id, "status": updated.status.value})


@router.patch("/{user_id}/role")
def patch_user_role(user_id: int, payload: UserRolePatchRequest, request: Request, db: Session = Depends(get_db),
                    current_user=Depends(get_current_user)):
    updated = _service(db).update_user(user_id, {"role_id": payload.role_id}, actor_id=current_user.id,
                                       actor_org_id=current_user.organization_id,
                                       ip_address=request.client.host if request.client else "unknown")
    return success_response({"id": updated.id, "role_id": updated.role_id})


@router.delete("/{user_id}")
def delete_user(user_id: int, request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _service(db).delete_user(user_id, actor_id=current_user.id, actor_org_id=current_user.organization_id,
                             ip_address=request.client.host if request.client else "unknown")
    return success_response({"deleted": True})
