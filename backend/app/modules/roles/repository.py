from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.permissions.model import Permission
from app.modules.roles.model import Role


class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[Role]:
        return list(self.db.scalars(select(Role).order_by(Role.id.desc())).all())

    def get_by_id(self, role_id: int) -> Role | None:
        return self.db.get(Role, role_id)

    def get_by_name_scope(self, name: str, scope: str) -> Role | None:
        return self.db.scalar(select(Role).where(Role.name == name, Role.scope == scope))

    def create(self, role: Role) -> Role:
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        return role

    def delete(self, role: Role) -> None:
        self.db.delete(role)
        self.db.commit()

    def get_permissions(self, ids: list[int]) -> list[Permission]:
        if not ids:
            return []
        return list(self.db.scalars(select(Permission).where(Permission.id.in_(ids))).all())
