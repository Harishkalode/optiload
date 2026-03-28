from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.security.authorization import AppPermission, require_permission
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.audit_logs.service import AuditLogService
from app.modules.users.model import User

router = APIRouter(prefix="/audit-logs", tags=["audit_logs"])


def _audit_user(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> User:
    require_permission(db, user, AppPermission.AUDIT_READ)
    return user


def _log_row(l):
    return {
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


@router.get("")
def list_audit_logs(
    user_id: int | None = None,
    action: str | None = None,
    date_from: datetime | None = Query(default=None, description="ISO-8601 start of range"),
    date_to: datetime | None = Query(default=None, description="ISO-8601 end of range"),
    db: Session = Depends(get_db),
    current_user: User = Depends(_audit_user),
):
    repo = AuditLogRepository(db)
    organization_id = get_tenant_organization_id(current_user)
    logs = AuditLogService(repo).list_logs_filtered(
        organization_id,
        user_id=user_id,
        action=action,
        date_from=date_from,
        date_to=date_to,
        limit=500,
    )
    return success_response([_log_row(l) for l in logs])


@router.get("/{log_id}")
def get_audit_log(log_id: int, db: Session = Depends(get_db), current_user: User = Depends(_audit_user)):
    org_id = get_tenant_organization_id(current_user)
    log = AuditLogRepository(db).get_by_id(log_id)
    if not log:
        raise AppError("NOT_FOUND", "Audit log not found", status_code=404)
    if org_id is not None and log.organization_id != org_id:
        raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
    return success_response(_log_row(log))
