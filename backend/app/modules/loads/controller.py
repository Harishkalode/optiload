from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.loads.repository import LoadRepository
from app.modules.loads.service import LoadService
from app.modules.loads.validator import LoadCreateRequest

router = APIRouter(prefix="/loads", tags=["loads"])


@router.get("")
def list_loads(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    loads = LoadService(LoadRepository(db)).list_loads(org_id)
    return success_response([{"id": l.id, "organization_id": l.organization_id, "type": l.type.value, "dimensions": l.dimensions, "weight": l.weight} for l in loads])


@router.post("")
def create_load(payload: LoadCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    load = LoadService(LoadRepository(db)).create_load(org_id, payload.model_dump())
    return success_response({"id": load.id})
