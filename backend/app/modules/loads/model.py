from enum import Enum

from app.core.database.base import Base
from sqlalchemy import Enum as SAEnum, Float, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column


class LoadType(str, Enum):
    cylinder = "cylinder"
    cube = "cube"


class Load(Base):
    __tablename__ = "loads"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), index=True)
    type: Mapped[LoadType] = mapped_column(SAEnum(LoadType), index=True)
    dimensions: Mapped[dict] = mapped_column(JSON)
    weight: Mapped[float] = mapped_column(Float)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
