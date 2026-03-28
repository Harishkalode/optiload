from pydantic import BaseModel, EmailStr, Field


class UserCreateRequest(BaseModel):
    organization_id: int | None = None
    name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)
    role_id: int


class UserUpdateRequest(BaseModel):
    name: str | None = None
    role_id: int | None = None
    status: str | None = None
    mfa_enabled: bool | None = None


class UserRolePatchRequest(BaseModel):
    role_id: int


class UserStatusPatchRequest(BaseModel):
    status: str
