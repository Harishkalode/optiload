from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.role import require_roles
from app.core.utils.responses import success_response
from app.modules.organizations.repository import OrganizationRepository
from app.modules.organizations.service import OrganizationService
from app.modules.organizations.validator import OrganizationCreateRequest

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.get("")
def list_organizations(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    organizations = OrganizationService(OrganizationRepository(db)).list_organizations()
    return success_response([
        {"id": o.id, "name": o.name, "status": o.status.value, "plan_type": o.plan_type.value, "created_at": o.created_at}
        for o in organizations
    ])


@router.post("")
def create_organization(payload: OrganizationCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    require_roles(current_user, {"super_admin"})
    organization = OrganizationService(OrganizationRepository(db)).create_organization(payload.model_dump())
    return success_response({"id": organization.id})
