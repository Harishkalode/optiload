from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PermissionRead(BaseModel):
    code: str


class RoleRead(BaseModel):
    name: str
    permissions: list[PermissionRead] = []


class OrganizationSignup(BaseModel):
    organization_name: str = Field(min_length=2)
    full_name: str = Field(min_length=2)
    work_email: EmailStr
    password: str = Field(min_length=8)
    invite_code: str | None = None


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str
    parent_admin_id: int | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    organization_id: int | None
    parent_admin_id: int | None
    roles: list[RoleRead] = []


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class WarehouseCreate(BaseModel):
    name: str
    code: str
    location: str


class WarehouseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    name: str
    code: str
    location: str
    is_active: bool


class VehicleCreate(BaseModel):
    name: str
    vehicle_type: str
    warehouse_id: int | None = None
    status: str = "active"
    max_weight_kg: float
    length_m: float
    width_m: float
    height_m: float
    axle_configuration: str = "standard"
    special_constraints: dict = {}


class VehicleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    warehouse_id: int | None
    name: str
    vehicle_type: str
    status: str
    max_weight_kg: float
    length_m: float
    width_m: float
    height_m: float
    axle_configuration: str
    special_constraints: dict


class LoadCreate(BaseModel):
    customer_name: str
    external_ref: str
    warehouse_id: int | None = None
    priority_score: int = 50
    status: str = "pending"
    weight_kg: float
    length_m: float
    width_m: float
    height_m: float
    stack_rules: dict = {}
    fragility_level: str = "normal"
    rotation_allowed: bool = True
    custom_constraints: dict = {}


class LoadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    warehouse_id: int | None
    customer_name: str
    external_ref: str
    priority_score: int
    status: str
    weight_kg: float
    length_m: float
    width_m: float
    height_m: float
    stack_rules: dict
    fragility_level: str
    rotation_allowed: bool
    custom_constraints: dict


class OptimizationJobCreate(BaseModel):
    vehicle_ids: list[int]
    load_ids: list[int]
    constraints: dict = {}


class OptimizationJobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    created_by_user_id: int
    status: str
    vehicle_ids: list[int]
    load_ids: list[int]
    constraints: dict
    utilization_pct: float
    efficiency_pct: float
    cost_savings_pct: float
    violations_count: int
    logs: str
    created_at: datetime


class DashboardKpis(BaseModel):
    active_optimizations: int
    fleet_utilization_pct: float
    load_efficiency_pct: float
    cost_savings_pct: float
    constraint_violations: int
    active_warehouses: int


class DashboardResponse(BaseModel):
    kpis: DashboardKpis
    recent_jobs: list[OptimizationJobRead]


class ApiKeyCreate(BaseModel):
    key_name: str
    environment: str = "prod"


class ApiKeyRead(BaseModel):
    id: int
    key_name: str
    key_prefix: str
    environment: str
    is_active: bool
