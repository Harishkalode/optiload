from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.loads.repository import LoadRepository
from app.modules.loads.service import LoadService
from app.modules.loads.validator import LoadCreateRequest, LoadUpdateRequest

router = APIRouter(prefix="/loads", tags=["loads"])


def _service(db: Session) -> LoadService:
    return LoadService(LoadRepository(db))


@router.get("")
def list_loads(page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    loads = _service(db).list_loads(org_id)
    start = (page - 1) * page_size
    sliced = loads[start : start + page_size]
    return success_response({"items": [{"id": l.id, "organization_id": l.organization_id, "type": l.type.value, "dimensions": l.dimensions, "weight": l.weight, "quantity": l.quantity} for l in sliced], "total": len(loads), "page": page, "page_size": page_size})


@router.get("/{load_id}")
def get_load(load_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    l = _service(db).get_load(org_id, load_id)
    return success_response({"id": l.id, "organization_id": l.organization_id, "type": l.type.value, "dimensions": l.dimensions, "weight": l.weight, "quantity": l.quantity})


@router.post("")
def create_load(payload: LoadCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    load = _service(db).create_load(org_id, payload.model_dump())
    return success_response({"id": load.id})


@router.put("/{load_id}")
def update_load(load_id: int, payload: LoadUpdateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    load = _service(db).update_load(org_id, load_id, payload.model_dump())
    return success_response({"id": load.id})


@router.delete("/{load_id}")
def delete_load(load_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    _service(db).delete_load(org_id, load_id)
    return success_response({"deleted": True})
