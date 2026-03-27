from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.loads.model import Load


class LoadRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_org(self, organization_id: int) -> list[Load]:
        return list(self.db.scalars(select(Load).where(Load.organization_id == organization_id)).all())

    def create(self, load: Load) -> Load:
        self.db.add(load)
        self.db.commit()
        self.db.refresh(load)
        return load
