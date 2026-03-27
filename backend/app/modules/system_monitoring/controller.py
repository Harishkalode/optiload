from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.role import require_roles
from app.core.utils.responses import success_response
from app.modules.system_monitoring.repository import SystemMetricRepository
from app.modules.system_monitoring.service import SystemMonitoringService

router = APIRouter(prefix="/system", tags=["system_monitoring"])


@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    metrics = SystemMonitoringService(SystemMetricRepository(db)).metrics()
    return success_response([{"id": m.id, "metric_type": m.metric_type.value, "value": m.value, "timestamp": m.timestamp} for m in metrics])


@router.get("/jobs")
def get_jobs(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    jobs = SystemMonitoringService(SystemMetricRepository(db)).jobs()
    return success_response(jobs)


@router.get("/errors")
def get_errors(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    errors = SystemMonitoringService(SystemMetricRepository(db)).errors()
    return success_response(errors)
