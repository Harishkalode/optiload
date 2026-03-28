from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.roles.repository import RoleRepository
from app.modules.roles.service import RoleService
from app.modules.roles.validator import RoleCreateRequest, RoleUpdateRequest
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/roles", tags=["roles"])


def _service(db: Session) -> RoleService:
    return RoleService(RoleRepository(db))


@router.get("")
def list_roles(db: Session = Depends(get_db), _=Depends(get_current_user)):
    roles = _service(db).list_roles()
    return success_response([{"id": r.id, "name": r.name, "scope": r.scope.value, "description": r.description,
                              "permission_ids": [p.id for p in r.permissions]} for r in roles])


@router.post("")
def create_role(payload: RoleCreateRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    role = _service(db).create_role(payload.model_dump())
    return success_response({"id": role.id})


@router.put("/{role_id}")
def update_role(role_id: int, payload: RoleUpdateRequest, db: Session = Depends(get_db), _=Depends(get_current_user)):
    role = _service(db).update_role(role_id, payload.model_dump())
    if not role:
        raise AppError("NOT_FOUND", "Role not found", status_code=404)
    return success_response({"id": role.id})


@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    _service(db).delete_role(role_id)
    return success_response({"deleted": True})


@router.get("/{role_id}/permissions")
def get_role_permissions(role_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    permission_ids = _service(db).role_permissions(role_id)
    return success_response({"role_id": role_id, "permission_ids": permission_ids})


@router.put("/{role_id}/permissions")
def put_role_permissions(role_id: int, payload: RoleUpdateRequest, db: Session = Depends(get_db),
                         _=Depends(get_current_user)):
    role = _service(db).update_role(role_id, {"permission_ids": payload.permission_ids or []})
    if not role:
        raise AppError("NOT_FOUND", "Role not found", status_code=404)
    return success_response({"role_id": role.id, "permission_ids": [p.id for p in role.permissions]})
