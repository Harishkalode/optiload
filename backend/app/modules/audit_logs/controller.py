from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.service import AuditLogService

router = APIRouter(prefix="/audit-logs", tags=["audit_logs"])


@router.get("")
def list_audit_logs(user_id: int | None = None, action: str | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    repo = AuditLogRepository(db)
    logs = AuditLogService(repo).list_logs(get_tenant_organization_id(current_user))
    if user_id is not None:
        logs = [l for l in logs if l.user_id == user_id]
    if action:
        logs = [l for l in logs if action.lower() in l.action.lower()]
    return success_response([{"id": l.id, "user_id": l.user_id, "organization_id": l.organization_id, "action": l.action, "resource": l.resource, "resource_id": l.resource_id, "metadata_json": l.metadata_json, "ip_address": l.ip_address, "timestamp": l.timestamp} for l in logs])


@router.get("/{log_id}")
def get_audit_log(log_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    log = AuditLogRepository(db).get_by_id(log_id)
    if not log:
        raise AppError("NOT_FOUND", "Audit log not found", status_code=404)
    if org_id is not None and log.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    return success_response({"id": log.id, "user_id": log.user_id, "organization_id": log.organization_id, "action": log.action, "resource": log.resource, "resource_id": log.resource_id, "metadata_json": log.metadata_json, "ip_address": log.ip_address, "timestamp": log.timestamp})
