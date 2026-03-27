from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class VehiclePayload(BaseModel):
    name: str
    type: str
    parameters: dict


@router.post("")
def create_vehicle(payload: VehiclePayload) -> dict:
    return {"id": "temp", **payload.model_dump(), "aar_compliant": True, "validation_errors": []}


@router.get("")
def list_vehicles() -> list[dict]:
    return []


@router.get("/{vehicle_id}")
def get_vehicle(vehicle_id: str) -> dict[str, str]:
    return {"id": vehicle_id}


@router.put("/{vehicle_id}")
def update_vehicle(vehicle_id: str, payload: VehiclePayload) -> dict:
    return {"id": vehicle_id, **payload.model_dump()}


@router.post("/{vehicle_id}/validate")
def validate_vehicle(vehicle_id: str) -> dict[str, object]:
    return {"id": vehicle_id, "aar_compliant": True, "errors": []}
