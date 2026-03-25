from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_org_user, require_role
from app.models import Load, User
from app.schemas import LoadCreate, LoadRead

router = APIRouter(prefix="/loads", tags=["loads"])


@router.get("", response_model=list[LoadRead])
def list_loads(
    customer_name: str | None = Query(default=None),
    priority_min: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_user),
) -> list[Load]:
    query = db.query(Load).filter(Load.organization_id == current_user.organization_id)
    if customer_name:
        query = query.filter(Load.customer_name == customer_name)
    if priority_min is not None:
        query = query.filter(Load.priority_score >= priority_min)
    return query.all()


@router.post("", response_model=LoadRead)
def create_load(
    payload: LoadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "sub-admin")),
) -> Load:
    load = Load(organization_id=current_user.organization_id, **payload.model_dump())
    db.add(load)
    db.commit()
    db.refresh(load)
    return load
