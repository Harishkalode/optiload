from app.modules.loads.model import Load
from sqlalchemy import select
from sqlalchemy.orm import Session


class LoadRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_org(self, organization_id: int) -> list[Load]:
        return list(
            self.db.scalars(select(Load).where(Load.organization_id == organization_id).order_by(Load.id.desc())).all())

    def get_by_id(self, load_id: int) -> Load | None:
        return self.db.get(Load, load_id)

    def create(self, load: Load) -> Load:
        self.db.add(load)
        self.db.commit()
        self.db.refresh(load)
        return load

    def save(self, load: Load) -> Load:
        self.db.commit()
        self.db.refresh(load)
        return load

    def delete(self, load: Load) -> None:
        self.db.delete(load)
        self.db.commit()
