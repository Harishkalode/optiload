from app.modules.audit_logs.model import AuditLog
from app.modules.audit_logs.repository import AuditLogRepository


class AuditLogService:
    def __init__(self, repository: AuditLogRepository):
        self.repository = repository

    def list_logs(self, organization_id: int | None) -> list[AuditLog]:
        return self.repository.list_by_org(organization_id)

    def record(
            self,
            user_id: int,
            organization_id: int | None,
            action: str,
            resource: str,
            resource_id: str,
            metadata_json: dict,
            ip_address: str,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            organization_id=organization_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            metadata_json=metadata_json,
            ip_address=ip_address,
        )
        return self.repository.create(log)
