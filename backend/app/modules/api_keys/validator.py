from pydantic import BaseModel, Field


class ApiKeyCreateRequest(BaseModel):
    permissions_json: dict = Field(default_factory=dict)
