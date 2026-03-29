from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.dashboard.service import DashboardService
from app.modules.loads.repository import LoadRepository
from app.modules.optimization.repository import OptimizationRepository
from app.modules.users.repository import UserRepository
from app.modules.vehicles.repository import VehicleRepository
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _service(db: Session):
    return DashboardService(
        LoadRepository(db),
        OptimizationRepository(db),
        AuditLogRepository(db),
        VehicleRepository(db),
        UserRepository(db),
    )


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    return success_response(_service(db).summary(org_id))


@router.get("/recent-loads")
def get_recent_loads(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    return success_response(_service(db).recent_loads(org_id))


@router.get("/activity")
def get_activity(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    return success_response(_service(db).activity(org_id))


@router.get("/recent-activities")
def get_recent_activities(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    return success_response(_service(db).activity(org_id))


@router.get("/recent-optimizations")
def get_recent_optimizations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    return success_response(_service(db).recent_optimizations(org_id))
