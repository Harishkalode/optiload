from pydantic import BaseModel


class OrganizationCreateRequest(BaseModel):
    name: str
    status: str = "active"
    plan_type: str = "starter"
