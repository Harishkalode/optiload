from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.security.authorization import AppPermission, require_permission
from app.core.utils.responses import success_response
from app.modules.permissions.repository import PermissionRepository
from app.modules.permissions.service import PermissionService
from app.modules.users.model import User

router = APIRouter(prefix="/permissions", tags=["permissions"])


def _perm_user(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> User:
    require_permission(db, user, AppPermission.ROLES_MANAGE)
    return user


@router.get("")
def list_permissions(db: Session = Depends(get_db), _user: User = Depends(_perm_user)):
    permissions = PermissionService(PermissionRepository(db)).list_permissions()
    return success_response([{"id": p.id, "name": p.name, "category": p.category} for p in permissions])
