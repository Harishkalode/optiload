from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.role import require_roles
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.organizations.repository import OrganizationRepository
from app.modules.organizations.service import OrganizationService
from app.modules.organizations.validator import OrganizationCreateRequest

router = APIRouter(tags=["organizations"])


def _service(db: Session):
    return OrganizationService(OrganizationRepository(db))


@router.get("/organizations")
def list_organizations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    organizations = _service(db).list_organizations()
    return success_response([{"id": o.id, "name": o.name, "status": o.status.value, "plan_type": o.plan_type.value, "created_at": o.created_at} for o in organizations])


@router.post("/organizations")
def create_organization(payload: OrganizationCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    organization = _service(db).create_organization(payload.model_dump())
    return success_response({"id": organization.id})


@router.get("/organization")
def get_organization(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    o = _service(db).get_organization(org_id)
    return success_response({"id": o.id, "name": o.name, "status": o.status.value, "plan_type": o.plan_type.value, "created_at": o.created_at})


@router.put("/organization")
def update_organization(payload: OrganizationCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    o = _service(db).update_organization(org_id, payload.model_dump())
    return success_response({"id": o.id})


@router.get("/organization/plan")
def get_organization_plan(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    o = _service(db).get_organization(org_id)
    return success_response({"organization_id": o.id, "plan_type": o.plan_type.value, "status": o.status.value})
