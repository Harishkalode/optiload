from app.core.utils.errors import AppError
from app.modules.roles.model import Role, RoleScope
from app.modules.roles.repository import RoleRepository
from app.modules.users.model import User


class RoleService:
    def __init__(self, repository: RoleRepository):
        self.repository = repository

    def list_roles(self) -> list[Role]:
        return self.repository.list_all()

    def list_roles_for_actor(self, actor: User) -> list[Role]:
        if actor.is_super_admin:
            return self.repository.list_all()
        return self.repository.list_org_scoped()

    @staticmethod
    def _role_visible(role: Role, actor: User) -> bool:
        if role.scope == RoleScope.global_scope and not actor.is_super_admin:
            return False
        return True

    def create_role(self, payload: dict, *, actor: User) -> Role:
        scope = RoleScope(payload["scope"])
        if scope == RoleScope.global_scope and not actor.is_super_admin:
            raise AppError("FORBIDDEN", "Only platform administrators may create global roles", status_code=403)
        if self.repository.get_by_name_scope(payload["name"], payload["scope"]):
            raise AppError("DUPLICATE_ROLE", "Role already exists for this scope", status_code=409)
        role = Role(name=payload["name"], scope=scope, description=payload.get("description"))
        role.permissions = self.repository.get_permissions(payload.get("permission_ids", []))
        return self.repository.create(role)

    def update_role(self, role_id: int, payload: dict, *, actor: User) -> Role | None:
        role = self.repository.get_by_id(role_id)
        if not role or not self._role_visible(role, actor):
            return None
        if payload.get("description") is not None:
            role.description = payload["description"]
        if payload.get("permission_ids") is not None:
            role.permissions = self.repository.get_permissions(payload["permission_ids"])
        self.repository.db.commit()
        self.repository.db.refresh(role)
        return role

    def delete_role(self, role_id: int, *, actor: User) -> None:
        role = self.repository.get_by_id(role_id)
        if not role or not self._role_visible(role, actor):
            raise AppError("NOT_FOUND", "Role not found", status_code=404)
        self.repository.delete(role)

    def role_permissions(self, role_id: int, *, actor: User) -> list[int]:
        role = self.repository.get_by_id(role_id)
        if not role or not self._role_visible(role, actor):
            raise AppError("NOT_FOUND", "Role not found", status_code=404)
        return [p.id for p in role.permissions]
