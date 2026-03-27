from datetime import datetime

from app.core.utils.errors import AppError
from app.core.utils.security import create_access_token, verify_password
from app.modules.audit_logs.service import AuditLogService
from app.modules.auth.repository import AuthRepository


class AuthService:
    def __init__(self, repository: AuthRepository, audit_log_service: AuditLogService):
        self.repository = repository
        self.audit_log_service = audit_log_service

    def login(self, email: str, password: str, ip_address: str) -> dict:
        user = self.repository.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise AppError("INVALID_CREDENTIALS", "Invalid email or password", status_code=401)

        user.last_login = datetime.utcnow()
        self.repository.db.commit()
        token = create_access_token(str(user.id))

        self.audit_log_service.record(
            user_id=user.id,
            organization_id=user.organization_id,
            action="auth.login",
            resource="user",
            resource_id=str(user.id),
            metadata_json={"email": email},
            ip_address=ip_address,
        )

        return {
            "access_token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "status": user.status.value,
                "mfa_enabled": user.mfa_enabled,
            },
            "role": user.role.name if user.role else None,
            "organization_id": user.organization_id,
        }
