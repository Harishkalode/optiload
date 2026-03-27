from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.optimization.repository import OptimizationRepository
from app.modules.optimization.service import OptimizationService
from app.modules.optimization.validator import OptimizationRunRequest
from app.modules.vehicles.repository import VehicleRepository

router = APIRouter(prefix="/optimization", tags=["optimization"])


@router.post("/run")
def run_optimization(payload: OptimizationRunRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    service = OptimizationService(OptimizationRepository(db), VehicleRepository(db))
    optimization = service.run(org_id, payload.model_dump())
    return success_response({"id": optimization.id, "status": optimization.status.value})


@router.get("/{optimization_id}")
def get_optimization(optimization_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service = OptimizationService(OptimizationRepository(db), VehicleRepository(db))
    optimization = service.get(optimization_id)
    if not optimization:
        raise AppError("NOT_FOUND", "Optimization not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and optimization.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    return success_response({
        "id": optimization.id,
        "organization_id": optimization.organization_id,
        "vehicle_id": optimization.vehicle_id,
        "status": optimization.status.value,
        "result_json": optimization.result_json,
        "created_at": optimization.created_at,
    })
