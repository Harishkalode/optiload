from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.security.authorization import AppPermission, require_permission, user_has_permission
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.roles.repository import RoleRepository
from app.modules.roles.service import RoleService
from app.modules.roles.validator import RoleCreateRequest, RoleUpdateRequest
from app.modules.users.model import User

router = APIRouter(prefix="/roles", tags=["roles"])


def _service(db: Session) -> RoleService:
    return RoleService(RoleRepository(db))


def _roles_manage_user(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> User:
    require_permission(db, user, AppPermission.ROLES_MANAGE)
    return user


def _roles_list_user(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> User:
    if user.is_super_admin:
        return user
    if user_has_permission(db, user, AppPermission.USERS_MANAGE) or user_has_permission(db, user, AppPermission.ROLES_MANAGE):
        return user
    raise AppError("FORBIDDEN", "You do not have permission to list roles", status_code=403)


@router.get("")
def list_roles(db: Session = Depends(get_db), user: User = Depends(_roles_list_user)):
    roles = _service(db).list_roles_for_actor(user)
    return success_response(
        [
            {
                "id": r.id,
                "name": r.name,
                "scope": r.scope.value,
                "description": r.description,
                "permission_ids": [p.id for p in r.permissions],
            }
            for r in roles
        ]
    )


@router.post("")
def create_role(
    payload: RoleCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(_roles_manage_user),
):
    role = _service(db).create_role(payload.model_dump(), actor=user)
    return success_response({"id": role.id})


@router.put("/{role_id}")
def update_role(
    role_id: int,
    payload: RoleUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(_roles_manage_user),
):
    role = _service(db).update_role(role_id, payload.model_dump(), actor=user)
    if not role:
        raise AppError("NOT_FOUND", "Role not found", status_code=404)
    return success_response({"id": role.id})


@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db), user: User = Depends(_roles_manage_user)):
    _service(db).delete_role(role_id, actor=user)
    return success_response({"deleted": True})


@router.get("/{role_id}/permissions")
def get_role_permissions(role_id: int, db: Session = Depends(get_db), user: User = Depends(_roles_manage_user)):
    permission_ids = _service(db).role_permissions(role_id, actor=user)
    return success_response({"role_id": role_id, "permission_ids": permission_ids})


@router.put("/{role_id}/permissions")
def put_role_permissions(
    role_id: int,
    payload: RoleUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(_roles_manage_user),
):
    role = _service(db).update_role(role_id, {"permission_ids": payload.permission_ids or []}, actor=user)
    if not role:
        raise AppError("NOT_FOUND", "Role not found", status_code=404)
    return success_response({"role_id": role.id, "permission_ids": [p.id for p in role.permissions]})
