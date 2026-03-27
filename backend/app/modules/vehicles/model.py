from enum import Enum

from sqlalchemy import Enum as SAEnum, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base


class VehicleType(str, Enum):
    railcar = "railcar"
    container = "container"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), index=True)
    type: Mapped[VehicleType] = mapped_column(SAEnum(VehicleType), index=True)
    dimensions: Mapped[dict] = mapped_column(JSON)
    capacity: Mapped[float] = mapped_column(Float)
