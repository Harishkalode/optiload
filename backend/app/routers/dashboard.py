from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_org_user
from app.models import Load, OptimizationJob, User, Vehicle, Warehouse
from app.schemas import DashboardKpis, DashboardResponse, OptimizationJobRead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_org_user),
) -> DashboardResponse:
    org_id = current_user.organization_id
    jobs = db.query(OptimizationJob).filter(OptimizationJob.organization_id == org_id)
    active_optimizations = jobs.filter(OptimizationJob.status.in_(["queued", "running"])).count()
    recent_jobs = jobs.order_by(OptimizationJob.created_at.desc()).limit(10).all()

    fleet_count = db.query(Vehicle).filter(Vehicle.organization_id == org_id).count()
    active_fleet = db.query(Vehicle).filter(Vehicle.organization_id == org_id, Vehicle.status == "active").count()
    fleet_util = round((active_fleet / fleet_count * 100), 2) if fleet_count else 0

    avg_efficiency = db.query(func.avg(OptimizationJob.efficiency_pct)).filter(OptimizationJob.organization_id == org_id).scalar()
    avg_savings = db.query(func.avg(OptimizationJob.cost_savings_pct)).filter(OptimizationJob.organization_id == org_id).scalar()
    violations = db.query(func.sum(OptimizationJob.violations_count)).filter(OptimizationJob.organization_id == org_id).scalar() or 0

    active_warehouses = db.query(Warehouse).filter(Warehouse.organization_id == org_id, Warehouse.is_active.is_(True)).count()

    _ = db.query(Load).filter(Load.organization_id == org_id).count()

    return DashboardResponse(
        kpis=DashboardKpis(
            active_optimizations=active_optimizations,
            fleet_utilization_pct=fleet_util,
            load_efficiency_pct=round(float(avg_efficiency or 0), 2),
            cost_savings_pct=round(float(avg_savings or 0), 2),
            constraint_violations=int(violations),
            active_warehouses=active_warehouses,
        ),
        recent_jobs=[OptimizationJobRead.model_validate(job) for job in recent_jobs],
    )
