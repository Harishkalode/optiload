from app.modules.permissions.model import Permission
from sqlalchemy import select
from sqlalchemy.orm import Session


class PermissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[Permission]:
        return list(self.db.scalars(select(Permission)).all())
