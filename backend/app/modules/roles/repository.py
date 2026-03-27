from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.permissions.model import Permission
from app.modules.roles.model import Role


class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[Role]:
        return list(self.db.scalars(select(Role)).all())

    def get_by_id(self, role_id: int) -> Role | None:
        return self.db.get(Role, role_id)

    def create(self, role: Role) -> Role:
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        return role

    def get_permissions(self, ids: list[int]) -> list[Permission]:
        if not ids:
            return []
        return list(self.db.scalars(select(Permission).where(Permission.id.in_(ids))).all())
