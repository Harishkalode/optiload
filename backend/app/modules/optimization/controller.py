from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.loads.repository import LoadRepository
from app.modules.optimization.repository import OptimizationRepository
from app.modules.optimization.service import OptimizationService
from app.modules.optimization.validator import OptimizationRunRequest
from app.modules.vehicles.repository import VehicleRepository

router = APIRouter(prefix="/optimization", tags=["optimization"])


def _service(db: Session) -> OptimizationService:
    return OptimizationService(OptimizationRepository(db), VehicleRepository(db), LoadRepository(db))


@router.post("/run")
def run_optimization(payload: OptimizationRunRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    optimization = _service(db).run(org_id, payload.model_dump())
    return success_response({"id": optimization.id, "status": optimization.status.value})


@router.get("/history")
def optimization_history(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    history = _service(db).history(org_id)
    return success_response([{"id": o.id, "status": o.status.value, "efficiency_score": o.efficiency_score, "created_at": o.created_at} for o in history])


@router.get("/{optimization_id}")
def get_optimization(optimization_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    optimization = _service(db).get(optimization_id)
    if not optimization:
        raise AppError("NOT_FOUND", "Optimization not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and optimization.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    return success_response({"id": optimization.id, "organization_id": optimization.organization_id, "vehicle_id": optimization.vehicle_id, "status": optimization.status.value, "result_json": optimization.result_json, "efficiency_score": optimization.efficiency_score, "created_at": optimization.created_at})


@router.get("/{optimization_id}/status")
def get_optimization_status(optimization_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    optimization = _service(db).get(optimization_id)
    if not optimization:
        raise AppError("NOT_FOUND", "Optimization not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and optimization.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    return success_response({"id": optimization.id, "status": optimization.status.value})


@router.get("/{optimization_id}/result")
def get_optimization_result(optimization_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    optimization = _service(db).get(optimization_id)
    if not optimization:
        raise AppError("NOT_FOUND", "Optimization not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and optimization.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    return success_response({"id": optimization.id, "result": optimization.result_json, "efficiency_score": optimization.efficiency_score})
