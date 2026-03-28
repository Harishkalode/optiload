from app.core.utils.errors import AppError
from app.modules.organizations.model import Organization, OrganizationPlanType, OrganizationStatus
from app.modules.organizations.repository import OrganizationRepository


class OrganizationService:
    def __init__(self, repository: OrganizationRepository):
        self.repository = repository

    def list_organizations(self) -> list[Organization]:
        return self.repository.list_all()

    def create_organization(self, payload: dict) -> Organization:
        org = Organization(name=payload["name"], status=OrganizationStatus(payload["status"]), plan_type=OrganizationPlanType(payload["plan_type"]))
        return self.repository.create(org)

    def get_organization(self, organization_id: int) -> Organization:
        org = self.repository.get_by_id(organization_id)
        if not org:
            raise AppError("NOT_FOUND", "Organization not found", status_code=404)
        return org

    def update_organization(self, organization_id: int, payload: dict) -> Organization:
        org = self.get_organization(organization_id)
        if payload.get("name"):
            org.name = payload["name"]
        if payload.get("status"):
            org.status = OrganizationStatus(payload["status"])
        if payload.get("plan_type"):
            org.plan_type = OrganizationPlanType(payload["plan_type"])
        return self.repository.save(org)
