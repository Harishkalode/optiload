from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.organizations.model import Organization


class OrganizationRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[Organization]:
        return list(self.db.scalars(select(Organization)).all())

    def create(self, org: Organization) -> Organization:
        self.db.add(org)
        self.db.commit()
        self.db.refresh(org)
        return org
