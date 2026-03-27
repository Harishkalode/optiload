from app.modules.roles.model import Role, RoleScope
from app.modules.roles.repository import RoleRepository


class RoleService:
    def __init__(self, repository: RoleRepository):
        self.repository = repository

    def list_roles(self) -> list[Role]:
        return self.repository.list_all()

    def create_role(self, payload: dict) -> Role:
        role = Role(name=payload["name"], scope=RoleScope(payload["scope"]), description=payload.get("description"))
        role.permissions = self.repository.get_permissions(payload.get("permission_ids", []))
        return self.repository.create(role)

    def update_role(self, role_id: int, payload: dict) -> Role | None:
        role = self.repository.get_by_id(role_id)
        if not role:
            return None
        if payload.get("description") is not None:
            role.description = payload["description"]
        if payload.get("permission_ids") is not None:
            role.permissions = self.repository.get_permissions(payload["permission_ids"])
        self.repository.db.commit()
        self.repository.db.refresh(role)
        return role
