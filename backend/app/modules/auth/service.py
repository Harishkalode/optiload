from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.utils.errors import AppError
from app.core.utils.security import create_access_token, decode_access_token, hash_password, verify_password
from app.modules.audit_logs.service import AuditLogService
from app.modules.auth.model import ApiKey
from app.modules.auth.repository import AuthRepository
from app.modules.loads.model import Load, LoadType
from app.modules.organizations.model import Organization, OrganizationPlanType, OrganizationStatus
from app.modules.permissions.model import Permission
from app.modules.roles.model import Role, RoleScope
from app.modules.users.model import User, UserStatus
from app.modules.vehicles.model import Vehicle, VehicleType


class AuthService:
    def __init__(self, repository: AuthRepository, audit_log_service: AuditLogService):
        self.repository = repository
        self.audit_log_service = audit_log_service

    def _token_pair(self, user: User) -> tuple[str, str]:
        role_name = user.role.name if user.role else None
        access_token = create_access_token(str(user.id), role=role_name, organization_id=user.organization_id)
        refresh_token = create_access_token(f"refresh:{user.id}", role=role_name, organization_id=user.organization_id)
        return access_token, refresh_token

    def login(self, email: str, password: str, ip_address: str) -> dict:
        user = self.repository.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise AppError("INVALID_CREDENTIALS", "Invalid email or password", status_code=401)

        user.last_login = datetime.utcnow()
        self.repository.db.commit()
        access_token, refresh_token = self._token_pair(user)

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
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.name if user.role else None,
                "organization_id": user.organization_id,
            },
        }

    def refresh(self, token: str) -> dict:
        if not token:
            raise AppError("INVALID_TOKEN", "Refresh token is required", status_code=401)
        payload = decode_access_token(token)
        subject = payload.get("sub", "")
        if not isinstance(subject, str) or not subject.startswith("refresh:"):
            raise AppError("INVALID_TOKEN", "Invalid refresh token", status_code=401)
        user_id = subject.split(":", 1)[1]
        user = self.repository.get_by_id(int(user_id))
        if not user:
            raise AppError("INVALID_TOKEN", "Invalid refresh token", status_code=401)
        access_token, _ = self._token_pair(user)
        return {"access_token": access_token}

    def me(self, user: User) -> dict:
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "status": user.status.value,
            "organization_id": user.organization_id,
            "role": user.role.name if user.role else None,
        }

    def register_admin(self, payload: dict, ip_address: str) -> dict:
        if self.repository.get_by_email(payload["email"]):
            raise AppError("USER_EXISTS", "User email already exists", status_code=409)

        db = self.repository.db
        try:
            with db.begin():
                organization = Organization(
                    name=payload["organization_name"],
                    status=OrganizationStatus.active,
                    plan_type=OrganizationPlanType.starter,
                )
                db.add(organization)
                db.flush()

                permissions_by_name = {
                    "users.manage": "users",
                    "roles.manage": "roles",
                    "loads.manage": "loads",
                    "vehicles.manage": "vehicles",
                    "optimization.run": "optimization",
                    "audit.read": "audit",
                }
                permissions: dict[str, Permission] = {}
                for name, category in permissions_by_name.items():
                    existing = db.scalar(select(Permission).where(Permission.name == name))
                    if existing:
                        permissions[name] = existing
                    else:
                        created = Permission(name=name, category=category)
                        db.add(created)
                        db.flush()
                        permissions[name] = created

                org_roles: dict[str, Role] = {}
                role_names = ["admin", "sub_admin", "operator", "viewer"]
                for role_name in role_names:
                    role = Role(name=role_name, scope=RoleScope.org, description=f"Default {role_name} role")
                    db.add(role)
                    db.flush()
                    org_roles[role_name] = role

                org_roles["admin"].permissions = list(permissions.values())
                org_roles["sub_admin"].permissions = [
                    permissions["users.manage"],
                    permissions["loads.manage"],
                    permissions["vehicles.manage"],
                    permissions["optimization.run"],
                    permissions["audit.read"],
                ]
                org_roles["operator"].permissions = [permissions["loads.manage"], permissions["optimization.run"]]
                org_roles["viewer"].permissions = [permissions["audit.read"]]

                user = User(
                    organization_id=organization.id,
                    name=payload["full_name"],
                    email=payload["email"],
                    password_hash=hash_password(payload["password"]),
                    role_id=org_roles["admin"].id,
                    status=UserStatus.active,
                )
                db.add(user)
                db.flush()

                # Seed defaults
                default_vehicle = Vehicle(
                    organization_id=organization.id,
                    type=VehicleType.container,
                    dimensions={"length": 1200, "width": 250, "height": 260, "max_weight": 24000},
                    capacity=24000,
                )
                db.add(default_vehicle)
                db.add(
                    Load(
                        organization_id=organization.id,
                        type=LoadType.cube,
                        dimensions={"length": 100, "width": 100, "height": 100},
                        weight=10,
                        quantity=1,
                    )
                )
                db.add(ApiKey(organization_id=organization.id, key_hash=hash_password(f"seed-{organization.id}"), permissions_json={"scope": "default"}))

            db.refresh(user)
        except IntegrityError as exc:
            db.rollback()
            raise AppError("REGISTRATION_FAILED", "Organization registration failed", status_code=409) from exc

        self.audit_log_service.record(
            user_id=user.id,
            organization_id=user.organization_id,
            action="organization_created",
            resource="organization",
            resource_id=str(user.organization_id),
            metadata_json={"organization_name": payload["organization_name"]},
            ip_address=ip_address,
        )

        access_token, refresh_token = self._token_pair(user)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "role": user.role.name if user.role else "admin",
                "organization_id": user.organization_id,
            },
        }

    def bootstrap_super_admin(self) -> None:
        db = self.repository.db
        existing = db.scalar(select(User).join(Role).where(Role.name == "super_admin"))
        if existing:
            return
        existing_email = db.scalar(select(User).where(User.email == "harish@optiload.com"))
        if existing_email:
            return

        role = db.scalar(select(Role).where(Role.name == "super_admin", Role.scope == RoleScope.global_scope))
        if not role:
            role = Role(name="super_admin", scope=RoleScope.global_scope, description="Platform owner")
            db.add(role)
            db.flush()

        user = User(
            organization_id=None,
            name="Harish",
            email="harish@optiload.com",
            password_hash=hash_password("Harish@123"),
            role_id=role.id,
            status=UserStatus.active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        self.audit_log_service.record(
            user_id=user.id,
            organization_id=None,
            action="system_superadmin_created",
            resource="user",
            resource_id=str(user.id),
            metadata_json={"email": user.email},
            ip_address="system",
        )
