from datetime import datetime

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.role import require_roles
from app.core.utils.responses import success_response
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.system_monitoring.repository import SystemMetricRepository
from app.modules.system_monitoring.service import SystemMonitoringService
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/system", tags=["system_monitoring"])


@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    metrics = SystemMonitoringService(SystemMetricRepository(db)).metrics()
    return success_response(
        [{"id": m.id, "metric_type": m.metric_type.value, "value": m.value, "timestamp": m.timestamp} for m in metrics])


@router.get("/errors")
def get_errors(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    errors = SystemMonitoringService(SystemMetricRepository(db)).errors()
    return success_response(errors)


@router.get("/activities")
def get_activities(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    logs = AuditLogRepository(db).list_by_org(None, limit=100)
    return success_response(
        [
            {
                "id": l.id,
                "user_id": l.user_id,
                "organization_id": l.organization_id,
                "action": l.action,
                "resource": l.resource,
                "resource_id": l.resource_id,
                "timestamp": l.timestamp,
            }
            for l in logs
        ],
    )


@router.get("/health")
def get_health(_: Session = Depends(get_db), __=Depends(get_current_user)):
    return success_response({"status": "healthy", "timestamp": datetime.utcnow()})
