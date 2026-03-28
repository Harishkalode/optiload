from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.load_builder.repository import LoadBuilderRepository
from app.modules.load_builder.service import LoadBuilderService
from app.modules.load_builder.validator import LoadBuilderAddItemRequest, LoadBuilderSessionCreateRequest
from app.modules.loads.repository import LoadRepository
from app.modules.vehicles.repository import VehicleRepository

router = APIRouter(prefix="/load-builder", tags=["load_builder"])


def _service(db: Session) -> LoadBuilderService:
    return LoadBuilderService(LoadBuilderRepository(db), VehicleRepository(db), LoadRepository(db))


@router.post("/session")
def create_session(payload: LoadBuilderSessionCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    session = _service(db).create_session(current_user.id, org_id, payload.vehicle_id)
    return success_response({"id": session.id, "status": session.status.value})


@router.post("/add-item")
def add_item(payload: LoadBuilderAddItemRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    item = _service(db).add_item(org_id, payload.session_id, payload.load_id, payload.quantity)
    return success_response({"id": item.id})


@router.delete("/remove-item")
def remove_item(item_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    _service(db).remove_item(org_id, item_id)
    return success_response({"deleted": True})


@router.get("/session/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    return success_response(_service(db).get_session(org_id, session_id))
