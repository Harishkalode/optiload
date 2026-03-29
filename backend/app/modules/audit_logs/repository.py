from datetime import datetime

from app.modules.audit_logs.model import AuditLog
from sqlalchemy import select
from sqlalchemy.orm import Session


class AuditLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_org(self, organization_id: int | None, *, limit: int = 2000) -> list[AuditLog]:
        query = select(AuditLog)
        if organization_id is not None:
            query = query.where(AuditLog.organization_id == organization_id)
        query = query.order_by(AuditLog.timestamp.desc()).limit(limit)
        return list(self.db.scalars(query).all())

    def list_filtered(
            self,
            organization_id: int | None,
            *,
            user_id: int | None = None,
            action: str | None = None,
            date_from: datetime | None = None,
            date_to: datetime | None = None,
            limit: int = 500,
    ) -> list[AuditLog]:
        query = select(AuditLog)
        if organization_id is not None:
            query = query.where(AuditLog.organization_id == organization_id)
        if user_id is not None:
            query = query.where(AuditLog.user_id == user_id)
        if action:
            query = query.where(AuditLog.action == action)
        if date_from is not None:
            query = query.where(AuditLog.timestamp >= date_from)
        if date_to is not None:
            query = query.where(AuditLog.timestamp <= date_to)
        query = query.order_by(AuditLog.timestamp.desc()).limit(limit)
        return list(self.db.scalars(query).all())

    def get_by_id(self, log_id: int) -> AuditLog | None:
        return self.db.get(AuditLog, log_id)

    def create(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log
