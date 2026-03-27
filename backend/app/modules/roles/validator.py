from pydantic import BaseModel


class RoleCreateRequest(BaseModel):
    name: str
    scope: str
    description: str | None = None
    permission_ids: list[int] = []


class RoleUpdateRequest(BaseModel):
    description: str | None = None
    permission_ids: list[int] | None = None
