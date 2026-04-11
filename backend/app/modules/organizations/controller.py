from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.role import require_roles
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.organizations.repository import OrganizationRepository
from app.modules.organizations.service import OrganizationService
from app.modules.organizations.validator import OrganizationCreateRequest
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.modules.organizations.model import OrganizationStatus

router = APIRouter(tags=["organizations"])


def _service(db: Session):
    return OrganizationService(OrganizationRepository(db))


@router.get("/organizations")
def list_organizations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    organizations = _service(db).list_organizations()
    return success_response([{"id": o.id, "name": o.name, "status": o.status.value, "plan_type": o.plan_type.value,
                              "created_at": o.created_at} for o in organizations])


@router.post("/organizations")
def create_organization(payload: OrganizationCreateRequest, db: Session = Depends(get_db),
                        current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    organization = _service(db).create_organization(payload.model_dump())
    return success_response({"id": organization.id})


@router.get("/organizations/{org_id}")
def get_organization_by_id(org_id: int, db: Session = Depends(get_db),
                           current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    o = _service(db).get_organization(org_id)
    if not o:
        raise AppError("NOT_FOUND", "Organization not found", status_code=404)
    return success_response({
        "id": o.id, "name": o.name, "status": o.status.value, "plan_type": o.plan_type.value,
        "timezone": o.timezone, "contact_email": o.contact_email, "contact_phone": o.contact_phone,
        "address": o.address, "city": o.city, "state": o.state, "country": o.country,
        "postal_code": o.postal_code, "max_users": o.max_users,
        "created_at": o.created_at,
    })


class OrgStatusUpdate(BaseModel):
    status: str


class OrgPlanUpdate(BaseModel):
    plan_type: str


@router.patch("/organizations/{org_id}/status")
def update_organization_status(org_id: int, payload: OrgStatusUpdate, db: Session = Depends(get_db),
                               current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    if payload.status not in ("active", "suspended", "deleted"):
        raise AppError("INVALID_STATUS", "Status must be active, suspended, or deleted")
    o = _service(db).update_organization(org_id, {"status": OrganizationStatus(payload.status)})
    return success_response({"id": o.id, "status": o.status.value})


@router.patch("/organizations/{org_id}/plan")
def update_organization_plan(org_id: int, payload: OrgPlanUpdate, db: Session = Depends(get_db),
                             current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    from app.modules.organizations.model import OrganizationPlanType
    if payload.plan_type not in ("starter", "growth", "enterprise"):
        raise AppError("INVALID_PLAN", "Plan must be starter, growth, or enterprise")
    o = _service(db).update_organization(org_id, {"plan_type": OrganizationPlanType(payload.plan_type)})
    return success_response({"id": o.id, "plan_type": o.plan_type.value})


@router.delete("/organizations/{org_id}")
def delete_organization(org_id: int, db: Session = Depends(get_db),
                        current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    _service(db).update_organization(org_id, {"status": OrganizationStatus.deleted})
    return success_response({"deleted": True})


@router.get("/organization")
def get_organization(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    o = _service(db).get_organization(org_id)
    return success_response({
        "id": o.id, "name": o.name, "status": o.status.value, "plan_type": o.plan_type.value,
        "timezone": o.timezone, "contact_email": o.contact_email, "contact_phone": o.contact_phone,
        "address": o.address, "city": o.city, "state": o.state, "country": o.country,
        "postal_code": o.postal_code, "max_users": o.max_users,
        "created_at": o.created_at,
    })


class OrganizationUpdateRequest(BaseModel):
    name: str | None = None
    timezone: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None


@router.put("/organization")
def update_organization(payload: OrganizationUpdateRequest, db: Session = Depends(get_db),
                        current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise AppError("NO_UPDATES", "No fields to update")
    o = _service(db).update_organization(org_id, updates)
    return success_response({"id": o.id, "name": o.name})


@router.get("/organization/plan")
def get_organization_plan(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    o = _service(db).get_organization(org_id)
    return success_response({"organization_id": o.id, "plan_type": o.plan_type.value, "status": o.status.value})
