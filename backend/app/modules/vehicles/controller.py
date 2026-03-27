from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.vehicles.repository import VehicleRepository
from app.modules.vehicles.service import VehicleService
from app.modules.vehicles.validator import VehicleCreateRequest

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("")
def list_vehicles(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    vehicles = VehicleService(VehicleRepository(db)).list_vehicles(org_id)
    return success_response([{"id": v.id, "organization_id": v.organization_id, "type": v.type.value, "dimensions": v.dimensions, "capacity": v.capacity} for v in vehicles])


@router.post("")
def create_vehicle(payload: VehicleCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    vehicle = VehicleService(VehicleRepository(db)).create_vehicle(org_id, payload.model_dump())
    return success_response({"id": vehicle.id})
