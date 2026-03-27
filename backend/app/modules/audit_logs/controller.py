from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.responses import success_response
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.service import AuditLogService

router = APIRouter(prefix="/audit-logs", tags=["audit_logs"])


@router.get("")
def list_audit_logs(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    logs = AuditLogService(AuditLogRepository(db)).list_logs(get_tenant_organization_id(current_user))
    return success_response([
        {
            "id": l.id,
            "user_id": l.user_id,
            "organization_id": l.organization_id,
            "action": l.action,
            "resource": l.resource,
            "resource_id": l.resource_id,
            "metadata_json": l.metadata_json,
            "ip_address": l.ip_address,
            "timestamp": l.timestamp,
        }
        for l in logs
    ])
