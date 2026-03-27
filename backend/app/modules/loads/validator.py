from pydantic import BaseModel


class LoadCreateRequest(BaseModel):
    type: str
    dimensions: dict
    weight: float
