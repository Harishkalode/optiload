from app.modules.organizations.model import Organization, OrganizationPlanType, OrganizationStatus
from app.modules.organizations.repository import OrganizationRepository


class OrganizationService:
    def __init__(self, repository: OrganizationRepository):
        self.repository = repository

    def list_organizations(self) -> list[Organization]:
        return self.repository.list_all()

    def create_organization(self, payload: dict) -> Organization:
        org = Organization(
            name=payload["name"],
            status=OrganizationStatus(payload["status"]),
            plan_type=OrganizationPlanType(payload["plan_type"]),
        )
        return self.repository.create(org)
