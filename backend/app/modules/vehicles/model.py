from enum import Enum

from app.core.database.base import Base
from sqlalchemy import Boolean, Enum as SAEnum, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column


class VehicleType(str, Enum):
    boxcar = "boxcar"
    flatcar = "flatcar"
    gondola = "gondola"
    reefer = "reefer"
    container = "container"
    railcar = "railcar"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), index=True)
    type: Mapped[VehicleType] = mapped_column(SAEnum(VehicleType), index=True)
    dimensions: Mapped[dict] = mapped_column(JSON)
    capacity: Mapped[float] = mapped_column(Float)
    tare_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    plate_type: Mapped[str | None] = mapped_column(String(1), nullable=True)
    truck_center_front: Mapped[float | None] = mapped_column(Float, nullable=True)
    truck_center_rear: Mapped[float | None] = mapped_column(Float, nullable=True)
    empty_cg_height_in: Mapped[float | None] = mapped_column(Float, nullable=True)
    axle_positions: Mapped[list | None] = mapped_column(JSON, nullable=True)
