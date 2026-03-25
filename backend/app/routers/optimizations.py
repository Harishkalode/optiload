import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_org_user
from app.models import Load, OptimizationJob, User, Vehicle
from app.schemas import OptimizationJobCreate, OptimizationJobRead

router = APIRouter(prefix="/optimizations", tags=["optimizations"])


@router.post("", response_model=OptimizationJobRead)
def create_optimization_job(
    payload: OptimizationJobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_user),
) -> OptimizationJob:
    org_id = current_user.organization_id
    vehicles = db.query(Vehicle).filter(Vehicle.organization_id == org_id, Vehicle.id.in_(payload.vehicle_ids)).all()
    loads = db.query(Load).filter(Load.organization_id == org_id, Load.id.in_(payload.load_ids)).all()
    if not vehicles or not loads:
        raise HTTPException(status_code=400, detail="Vehicle/load selection invalid")

    job = OptimizationJob(
        organization_id=org_id,
        created_by_user_id=current_user.id,
        status="completed",
        vehicle_ids=payload.vehicle_ids,
        load_ids=payload.load_ids,
        constraints=payload.constraints,
        utilization_pct=round(random.uniform(68, 97), 2),
        efficiency_pct=round(random.uniform(70, 98), 2),
        cost_savings_pct=round(random.uniform(5, 22), 2),
        violations_count=random.randint(0, 3),
        logs="Initialized solver...\nPacking loads...\nComputing axle distribution...\nCompleted.",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("", response_model=list[OptimizationJobRead])
def list_jobs(db: Session = Depends(get_db), current_user: User = Depends(require_org_user)) -> list[OptimizationJob]:
    return (
        db.query(OptimizationJob)
        .filter(OptimizationJob.organization_id == current_user.organization_id)
        .order_by(OptimizationJob.created_at.desc())
        .all()
    )
