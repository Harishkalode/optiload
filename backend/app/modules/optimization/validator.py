from pydantic import BaseModel, Field


class LoadQuantity(BaseModel):
    load_id: int = Field(gt=0)
    quantity: int = Field(ge=1, default=1)


class OptimizationConstraints(BaseModel):
    weight_balance: bool = True
    stack_rules: bool = True
    hazmat_separation: bool = False
    priority_order: bool = True


class OptimizationRunRequest(BaseModel):
    vehicle_id: int = Field(gt=0)
    loads: list[LoadQuantity] = Field(min_length=1)
    constraints: OptimizationConstraints | None = None
