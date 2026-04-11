from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.vehicles.repository import VehicleRepository
from app.modules.vehicles.service import VehicleService
from app.modules.vehicles.validator import VehicleCreateRequest, VehicleUpdateRequest
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


def _service(db: Session) -> VehicleService:
    return VehicleService(VehicleRepository(db))


@router.get("")
def list_vehicles(page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=200),
                  type: str | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    vehicles = _service(db).list_vehicles(org_id)
    if type:
        vehicles = [v for v in vehicles if v.type.value == type]
    start = (page - 1) * page_size
    sliced = vehicles[start: start + page_size]
    return success_response({"items": [
        {"id": v.id, "organization_id": v.organization_id, "type": v.type.value, "dimensions": v.dimensions,
         "capacity": v.capacity, "tare_weight_kg": v.tare_weight_kg, "plate_type": v.plate_type,
         "truck_center_front": v.truck_center_front, "truck_center_rear": v.truck_center_rear,
         "empty_cg_height_in": v.empty_cg_height_in, "axle_positions": v.axle_positions}
        for v in sliced], "total": len(vehicles), "page": page, "page_size": page_size})


@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    v = _service(db).get_vehicle(org_id, vehicle_id)
    return success_response(
        {"id": v.id, "organization_id": v.organization_id, "type": v.type.value, "dimensions": v.dimensions,
         "capacity": v.capacity, "tare_weight_kg": v.tare_weight_kg, "plate_type": v.plate_type,
         "truck_center_front": v.truck_center_front, "truck_center_rear": v.truck_center_rear,
         "empty_cg_height_in": v.empty_cg_height_in, "axle_positions": v.axle_positions})


@router.post("")
def create_vehicle(payload: VehicleCreateRequest, db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    vehicle = _service(db).create_vehicle(org_id, payload.model_dump())
    return success_response({"id": vehicle.id})


@router.put("/{vehicle_id}")
def update_vehicle(vehicle_id: int, payload: VehicleUpdateRequest, db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    vehicle = _service(db).update_vehicle(org_id, vehicle_id, payload.model_dump())
    return success_response({"id": vehicle.id})


@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    _service(db).delete_vehicle(org_id, vehicle_id)
    return success_response({"deleted": True})
