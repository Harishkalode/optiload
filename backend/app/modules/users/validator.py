from pydantic import BaseModel, EmailStr


class UserCreateRequest(BaseModel):
    organization_id: int | None = None
    name: str
    email: EmailStr
    password: str
    role_id: int


class UserUpdateRequest(BaseModel):
    name: str | None = None
    role_id: int | None = None
    status: str | None = None
    mfa_enabled: bool | None = None
