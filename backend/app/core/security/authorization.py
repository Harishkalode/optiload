"""Central permission names and RBAC helpers (server is authoritative; never trust client role)."""

from sqlalchemy import select

from app.core.utils.errors import AppError
from app.modules.permissions.model import Permission
from app.modules.roles.model import UserPermissionOverride
from app.modules.users.model import User
from sqlalchemy.orm import Session


class AppPermission:
    ROLES_MANAGE = "roles.manage"
    USERS_MANAGE = "users.manage"
    LOADS_MANAGE = "loads.manage"
    VEHICLES_MANAGE = "vehicles.manage"
    OPTIMIZATION_RUN = "optimization.run"
    AUDIT_READ = "audit.read"


def _base_role_permission_names(user: User) -> set[str]:
    if not user.role or not user.role.permissions:
        return set()
    return {p.name for p in user.role.permissions}


def user_effective_permission_names(db: Session, user: User) -> set[str]:
    if user.is_super_admin:
        return set(db.scalars(select(Permission.name)).all())
    names = _base_role_permission_names(user)
    overrides = db.scalars(select(UserPermissionOverride).where(UserPermissionOverride.user_id == user.id)).all()
    for ov in overrides:
        perm = db.get(Permission, ov.permission_id)
        if not perm:
            continue
        if ov.allowed:
            names.add(perm.name)
        else:
            names.discard(perm.name)
    return names


def user_has_permission(db: Session, user: User, permission_name: str) -> bool:
    if user.is_super_admin:
        return True
    return permission_name in user_effective_permission_names(db, user)


def require_permission(db: Session, user: User, permission_name: str) -> None:
    if user_has_permission(db, user, permission_name):
        return
    raise AppError("FORBIDDEN", "You do not have permission for this action", status_code=403)
