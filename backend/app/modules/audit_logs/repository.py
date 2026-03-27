from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.audit_logs.model import AuditLog


class AuditLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_org(self, organization_id: int | None) -> list[AuditLog]:
        query = select(AuditLog)
        if organization_id is not None:
            query = query.where(AuditLog.organization_id == organization_id)
        return list(self.db.scalars(query.order_by(AuditLog.timestamp.desc())).all())

    def get_by_id(self, log_id: int) -> AuditLog | None:
        return self.db.get(AuditLog, log_id)

    def create(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log
