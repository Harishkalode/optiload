from pydantic import BaseModel, EmailStr


class PermissionRead(BaseModel):
    code: str


class RoleRead(BaseModel):
    name: str
    permissions: list[PermissionRead] = []


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str
    parent_admin_id: int | None = None


class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    parent_admin_id: int | None
    roles: list[RoleRead] = []

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
