from enum import Enum

from app.core.database.base import Base
from sqlalchemy import Enum as SAEnum, ForeignKey, String, Table, Column, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship


class RoleScope(str, Enum):
    global_scope = "global"
    org = "org"


role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", ForeignKey("permissions.id"), primary_key=True),
)


class Role(Base):
    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("name", "scope", name="uq_role_name_scope"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(64), index=True)
    scope: Mapped[RoleScope] = mapped_column(SAEnum(RoleScope))
    description: Mapped[str | None] = mapped_column(String(512), nullable=True)

    permissions = relationship("Permission", secondary=role_permissions)


class UserPermissionOverride(Base):
    __tablename__ = "user_permission_overrides"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    permission_id: Mapped[int] = mapped_column(ForeignKey("permissions.id"), primary_key=True)
    allowed: Mapped[bool] = mapped_column(Boolean)
