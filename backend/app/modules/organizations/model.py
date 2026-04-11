from datetime import datetime
from enum import Enum

from app.core.database.base import Base
from sqlalchemy import DateTime, Enum as SAEnum, String, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column


class OrganizationStatus(str, Enum):
    active = "active"
    suspended = "suspended"
    deleted = "deleted"


class OrganizationPlanType(str, Enum):
    starter = "starter"
    growth = "growth"
    enterprise = "enterprise"


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    status: Mapped[OrganizationStatus] = mapped_column(SAEnum(OrganizationStatus), index=True)
    plan_type: Mapped[OrganizationPlanType] = mapped_column(SAEnum(OrganizationPlanType), index=True)
    timezone: Mapped[str | None] = mapped_column(String(64), default="America/Chicago")
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_phone: Mapped[str | None] = mapped_column(String(32))
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(128))
    state: Mapped[str | None] = mapped_column(String(64))
    country: Mapped[str | None] = mapped_column(String(64), default="US")
    postal_code: Mapped[str | None] = mapped_column(String(16))
    max_users: Mapped[int] = mapped_column(Integer, default=10)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
