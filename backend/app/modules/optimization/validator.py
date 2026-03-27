from pydantic import BaseModel


class OptimizationRunRequest(BaseModel):
    vehicle_id: int
    load_ids: list[int]
