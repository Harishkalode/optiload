from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base


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
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
