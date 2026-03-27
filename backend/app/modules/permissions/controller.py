from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.utils.responses import success_response
from app.modules.permissions.repository import PermissionRepository
from app.modules.permissions.service import PermissionService

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get("")
def list_permissions(db: Session = Depends(get_db), _=Depends(get_current_user)):
    permissions = PermissionService(PermissionRepository(db)).list_permissions()
    return success_response([{"id": p.id, "name": p.name, "category": p.category} for p in permissions])
