from pydantic import BaseModel, Field


class OptimizationRunRequest(BaseModel):
    vehicle_id: int = Field(gt=0)
    load_ids: list[int] = Field(min_length=1)
