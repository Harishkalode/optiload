from datetime import datetime
from enum import Enum

from app.core.database.base import Base
from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column


class LoadSessionStatus(str, Enum):
    draft = "draft"
    optimized = "optimized"
    failed = "failed"


class LoadSession(Base):
    __tablename__ = "load_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id"), index=True)
    status: Mapped[LoadSessionStatus] = mapped_column(SAEnum(LoadSessionStatus), default=LoadSessionStatus.draft,
                                                      index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)


class LoadSessionItem(Base):
    __tablename__ = "load_session_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("load_sessions.id"), index=True)
    load_id: Mapped[int] = mapped_column(ForeignKey("loads.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
