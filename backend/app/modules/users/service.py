from app.core.utils.errors import AppError
from app.core.utils.security import hash_password
from app.modules.audit_logs.service import AuditLogService
from app.modules.users.model import User
from app.modules.users.repository import UserRepository


class UserService:
    def __init__(self, repository: UserRepository, audit_log_service: AuditLogService):
        self.repository = repository
        self.audit_log_service = audit_log_service

    def list_users(self, tenant_organization_id: int | None) -> list[User]:
        return self.repository.list_by_org(tenant_organization_id)

    def create_user(self, payload: dict, actor_id: int, actor_org_id: int | None, ip_address: str) -> User:
        if self.repository.get_by_email(payload["email"]):
            raise AppError("USER_EXISTS", "User email already exists", status_code=409)

        user = User(
            organization_id=payload.get("organization_id", actor_org_id),
            name=payload["name"],
            email=payload["email"],
            password_hash=hash_password(payload["password"]),
            role_id=payload["role_id"],
        )
        created = self.repository.create(user)
        self.audit_log_service.record(
            user_id=actor_id,
            organization_id=actor_org_id,
            action="user.create",
            resource="user",
            resource_id=str(created.id),
            metadata_json={"email": created.email},
            ip_address=ip_address,
        )
        return created

    def update_user(self, user_id: int, payload: dict, actor_id: int, actor_org_id: int | None, ip_address: str) -> User:
        user = self.repository.get_by_id(user_id)
        if not user:
            raise AppError("NOT_FOUND", "User not found", status_code=404)

        for key, value in payload.items():
            if value is not None:
                setattr(user, key, value)
        self.repository.db.commit()
        self.repository.db.refresh(user)

        self.audit_log_service.record(
            user_id=actor_id,
            organization_id=actor_org_id,
            action="user.update",
            resource="user",
            resource_id=str(user.id),
            metadata_json={"updated_fields": [k for k, v in payload.items() if v is not None]},
            ip_address=ip_address,
        )
        return user

    def delete_user(self, user_id: int, actor_id: int, actor_org_id: int | None, ip_address: str) -> None:
        user = self.repository.get_by_id(user_id)
        if not user:
            raise AppError("NOT_FOUND", "User not found", status_code=404)
        self.repository.delete(user)
        self.audit_log_service.record(
            user_id=actor_id,
            organization_id=actor_org_id,
            action="user.delete",
            resource="user",
            resource_id=str(user_id),
            metadata_json={},
            ip_address=ip_address,
        )
