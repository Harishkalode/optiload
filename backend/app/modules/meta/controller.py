from fastapi import APIRouter, Depends

from app.core.middlewares.auth import get_current_user
from app.core.utils.responses import success_response
from app.modules.loads.model import LoadType
from app.modules.optimization.model import OptimizationStatus
from app.modules.organizations.model import OrganizationStatus
from app.modules.users.model import UserStatus
from app.modules.vehicles.model import VehicleType

router = APIRouter(tags=["meta"])


def _label(v: str) -> str:
    return v.replace("_", " ").title()


@router.get("/vehicle-types")
def vehicle_types(_=Depends(get_current_user)):
    items = [{"value": t.value, "label": _label(t.value)} for t in VehicleType]
    return success_response({"items": items})


@router.get("/load-types")
def load_types(_=Depends(get_current_user)):
    items = [{"value": t.value, "label": _label(t.value)} for t in LoadType]
    return success_response({"items": items})


@router.get("/meta/status-options")
def status_options(_=Depends(get_current_user)):
    return success_response(
        {
            "user_status": [{"value": s.value, "label": _label(s.value)} for s in UserStatus],
            "optimization_status": [{"value": s.value, "label": _label(s.value)} for s in OptimizationStatus],
            "organization_status": [{"value": s.value, "label": _label(s.value)} for s in OrganizationStatus],
        },
    )
