from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.security.authorization import AppPermission, require_permission
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.loads.repository import LoadRepository
from app.modules.optimization.repository import OptimizationRepository
from app.modules.optimization.service import OptimizationService
from app.modules.optimization.validator import OptimizationRunRequest
from app.modules.vehicles.repository import VehicleRepository
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import traceback

router = APIRouter(prefix="/optimization", tags=["optimization"])


def _service(db: Session) -> OptimizationService:
    return OptimizationService(OptimizationRepository(db), VehicleRepository(db), LoadRepository(db))


@router.post("/run")
def run_optimization(payload: OptimizationRunRequest, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    require_permission(db, current_user, AppPermission.OPTIMIZATION_RUN)
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    try:
        optimization = _service(db).run(org_id, payload.model_dump(), actor_user_id=current_user.id)
    except AppError:
        raise
    except Exception as e:
        print(f"[OPTIMIZATION ERROR] {e}")
        traceback.print_exc()
        raise AppError("OPTIMIZATION_FAILED", str(e), status_code=500)
    return success_response({"id": optimization.id, "status": optimization.status.value})


@router.get("/history")
def optimization_history(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    history = _service(db).history(org_id)
    return success_response(
        [{"id": o.id, "status": o.status.value, "efficiency_score": o.efficiency_score, "created_at": o.created_at} for
         o in history])


@router.get("/{optimization_id}")
def get_optimization(optimization_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    optimization = _service(db).get(optimization_id)
    if not optimization:
        raise AppError("NOT_FOUND", "Optimization not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and optimization.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    return success_response(
        {"id": optimization.id, "organization_id": optimization.organization_id, "vehicle_id": optimization.vehicle_id,
         "status": optimization.status.value, "result_json": optimization.result_json,
         "efficiency_score": optimization.efficiency_score, "created_at": optimization.created_at})


@router.get("/{optimization_id}/status")
def get_optimization_status(optimization_id: int, db: Session = Depends(get_db),
                            current_user=Depends(get_current_user)):
    optimization = _service(db).get(optimization_id)
    if not optimization:
        raise AppError("NOT_FOUND", "Optimization not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and optimization.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    return success_response({"id": optimization.id, "status": optimization.status.value})


@router.get("/{optimization_id}/result")
def get_optimization_result(optimization_id: int, db: Session = Depends(get_db),
                            current_user=Depends(get_current_user)):
    optimization = _service(db).get(optimization_id)
    if not optimization:
        raise AppError("NOT_FOUND", "Optimization not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and optimization.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    result_data = {"id": optimization.id, "result": optimization.result_json, "efficiency_score": optimization.efficiency_score}
    # Include securements if they exist
    if optimization.securements_json:
        result_data["securements"] = optimization.securements_json
    return success_response(result_data)


@router.post("/{optimization_id}/autocorrect")
def autocorrect_optimization(optimization_id: int, db: Session = Depends(get_db),
                             current_user=Depends(get_current_user)):
    require_permission(db, current_user, AppPermission.OPTIMIZATION_RUN)
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    result = _service(db).autocorrect(optimization_id, org_id)
    return success_response(result)


@router.get("/{optimization_id}/securements")
def get_securements(optimization_id: int, db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):
    """List all securements for an optimization."""
    optimization = _service(db).get(optimization_id)
    if not optimization:
        raise AppError("NOT_FOUND", "Optimization not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and optimization.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    securements = optimization.securements_json or []
    return success_response({"securements": securements})


@router.post("/{optimization_id}/securements")
def create_securement(optimization_id: int, payload: dict, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    """Create a new securement item."""
    require_permission(db, current_user, AppPermission.OPTIMIZATION_RUN)
    optimization = _service(db).get(optimization_id)
    if not optimization:
        raise AppError("NOT_FOUND", "Optimization not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and optimization.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    
    # Add ID to securement
    securements = optimization.securements_json or []
    sec_id = max([s.get("id", 0) for s in securements] + [0]) + 1
    payload["id"] = sec_id
    securements.append(payload)
    
    # Save
    optimization.securements_json = securements
    db.commit()
    return success_response({"id": sec_id, "securement": payload})


@router.put("/{optimization_id}/securements/{sec_id}")
def update_securement(optimization_id: int, sec_id: int, payload: dict, 
                     db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Update a securement item."""
    require_permission(db, current_user, AppPermission.OPTIMIZATION_RUN)
    optimization = _service(db).get(optimization_id)
    if not optimization:
        raise AppError("NOT_FOUND", "Optimization not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and optimization.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    
    securements = optimization.securements_json or []
    for i, sec in enumerate(securements):
        if sec.get("id") == sec_id:
            securements[i] = {**sec, **payload, "id": sec_id}
            optimization.securements_json = securements
            db.commit()
            return success_response({"securement": securements[i]})
    
    raise AppError("NOT_FOUND", f"Securement {sec_id} not found", status_code=404)


@router.delete("/{optimization_id}/securements/{sec_id}")
def delete_securement(optimization_id: int, sec_id: int, db: Session = Depends(get_db),
                     current_user=Depends(get_current_user)):
    """Delete a securement item."""
    require_permission(db, current_user, AppPermission.OPTIMIZATION_RUN)
    optimization = _service(db).get(optimization_id)
    if not optimization:
        raise AppError("NOT_FOUND", "Optimization not found", status_code=404)
    org_id = get_tenant_organization_id(current_user)
    if org_id is not None and optimization.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    
    securements = optimization.securements_json or []
    securements = [s for s in securements if s.get("id") != sec_id]
    
    if len(securements) == len(optimization.securements_json or []):
        raise AppError("NOT_FOUND", f"Securement {sec_id} not found", status_code=404)
    
    optimization.securements_json = securements if securements else None
    db.commit()
    return success_response({"deleted": sec_id})
