from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database.base import Base


class UserStatus(str, Enum):
    active = "active"
    invited = "invited"
    disabled = "disabled"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int | None] = mapped_column(ForeignKey("organizations.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"))
    status: Mapped[UserStatus] = mapped_column(SAEnum(UserStatus), index=True, default=UserStatus.active)
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    role = relationship("Role")

    @property
    def is_super_admin(self) -> bool:
        return bool(self.role and self.role.name == "super_admin")
