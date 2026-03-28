from app.modules.system_monitoring.model import SystemMetric
from sqlalchemy import select
from sqlalchemy.orm import Session


class SystemMetricRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_metrics(self) -> list[SystemMetric]:
        return list(self.db.scalars(select(SystemMetric).order_by(SystemMetric.timestamp.desc())).all())
