from app.modules.optimization.model import Optimization
from sqlalchemy import select
from sqlalchemy.orm import Session


class OptimizationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, optimization: Optimization) -> Optimization:
        self.db.add(optimization)
        self.db.commit()
        self.db.refresh(optimization)
        return optimization

    def get_by_id(self, optimization_id: int) -> Optimization | None:
        return self.db.get(Optimization, optimization_id)

    def list_by_org(self, organization_id: int) -> list[Optimization]:
        return list(self.db.scalars(
            select(Optimization).where(Optimization.organization_id == organization_id).order_by(
                Optimization.id.desc())).all())
