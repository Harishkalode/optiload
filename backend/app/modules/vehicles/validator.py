from pydantic import BaseModel


class VehicleCreateRequest(BaseModel):
    type: str
    dimensions: dict
    capacity: float
