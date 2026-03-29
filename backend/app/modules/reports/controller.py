from typing import Literal

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.loads.repository import LoadRepository
from app.modules.optimization.repository import OptimizationRepository
from app.modules.reports.service import ReportsService
from app.modules.vehicles.repository import VehicleRepository
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/reports", tags=["reports"])


def _service(db: Session) -> ReportsService:
    return ReportsService(
        OptimizationRepository(db),
        VehicleRepository(db),
        LoadRepository(db),
    )


@router.get("/summary")
def report_summary(
        period: Literal["1M", "3M", "6M", "1Y"] = "1M",
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user),
):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    return success_response(_service(db).summary(org_id, period))


@router.get("/utilization")
def report_utilization(
        period: Literal["1M", "3M", "6M", "1Y"] = "1M",
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user),
):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    return success_response(_service(db).utilization(org_id, period))


@router.get("/performance")
def report_performance(
        period: Literal["1M", "3M", "6M", "1Y"] = "1M",
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user),
):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    return success_response(_service(db).performance(org_id, period))
