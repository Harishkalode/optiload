from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_org_user
from app.models import User, Warehouse
from app.schemas import WarehouseCreate, WarehouseRead

router = APIRouter(prefix="/warehouses", tags=["warehouses"])


@router.get("", response_model=list[WarehouseRead])
def list_warehouses(db: Session = Depends(get_db), current_user: User = Depends(require_org_user)) -> list[Warehouse]:
    return db.query(Warehouse).filter(Warehouse.organization_id == current_user.organization_id).all()


@router.post("", response_model=WarehouseRead)
def create_warehouse(
    payload: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_user),
) -> Warehouse:
    warehouse = Warehouse(organization_id=current_user.organization_id, **payload.model_dump())
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse
