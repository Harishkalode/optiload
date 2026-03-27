from enum import Enum

from sqlalchemy import Enum as SAEnum, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base


class LoadType(str, Enum):
    pallet = "pallet"
    box = "box"
    loose = "loose"
    mixed = "mixed"


class Load(Base):
    __tablename__ = "loads"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), index=True)
    type: Mapped[LoadType] = mapped_column(SAEnum(LoadType), index=True)
    dimensions: Mapped[dict] = mapped_column(JSON)
    weight: Mapped[float] = mapped_column(Float)
