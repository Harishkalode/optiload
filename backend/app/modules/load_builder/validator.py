from pydantic import BaseModel, Field


class LoadBuilderSessionCreateRequest(BaseModel):
    vehicle_id: int = Field(gt=0)


class LoadBuilderAddItemRequest(BaseModel):
    session_id: int = Field(gt=0)
    load_id: int = Field(gt=0)
    quantity: int = Field(default=1, ge=1)
