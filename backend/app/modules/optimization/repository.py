from sqlalchemy.orm import Session

from app.modules.optimization.model import Optimization


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
