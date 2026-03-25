from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_org_user, require_role
from app.models import User, Vehicle
from app.schemas import VehicleCreate, VehicleRead

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("", response_model=list[VehicleRead])
def list_vehicles(
    vehicle_type: str | None = Query(default=None),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_user),
) -> list[Vehicle]:
    query = db.query(Vehicle).filter(Vehicle.organization_id == current_user.organization_id)
    if vehicle_type:
        query = query.filter(Vehicle.vehicle_type == vehicle_type)
    if status:
        query = query.filter(Vehicle.status == status)
    return query.all()


@router.post("", response_model=VehicleRead)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> Vehicle:
    if current_user.organization_id is None:
        raise HTTPException(status_code=400, detail="Organization missing")

    vehicle = Vehicle(organization_id=current_user.organization_id, **payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle
