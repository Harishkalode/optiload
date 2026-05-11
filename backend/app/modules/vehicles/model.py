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
    dimensions: Mapped[dict] = mapped_column(JSON)  # {length, width, height} in meters
    capacity: Mapped[float] = mapped_column(Float)  # Gross weight capacity in kg
    tare_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)  # Empty vehicle weight
    plate_type: Mapped[str | None] = mapped_column(String(1), nullable=True)  # A, B, C, or D
    truck_center_front: Mapped[float | None] = mapped_column(Float, nullable=True)  # m from front
    truck_center_rear: Mapped[float | None] = mapped_column(Float, nullable=True)  # m from front
    empty_cg_height_in: Mapped[float | None] = mapped_column(Float, nullable=True)  # inches above rail
    empty_cg_height_m: Mapped[float | None] = mapped_column(Float, nullable=True)  # meters above rail (AAR 3.5.1)
    axle_positions: Mapped[list | None] = mapped_column(JSON, nullable=True)  # List of axle positions from front (m)
    axle_count: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Number of axles (typically 8)
    per_axle_limit_kg: Mapped[float | None] = mapped_column(Float, nullable=True)  # Per-axle weight limit (typically 22,500kg)
    doorway_width_m: Mapped[float | None] = mapped_column(Float, nullable=True)  # For boxcars
    doorway_height_m: Mapped[float | None] = mapped_column(Float, nullable=True)  # For boxcars
    platform_height_m: Mapped[float | None] = mapped_column(Float, nullable=True)  # Rail to deck (typically 1.1m-1.5m)
    optimization_mode: Mapped[str] = mapped_column(String(32), default="stability_optimized")  # space_optimized, cost_optimized, stability_optimized
    space_weight: Mapped[float] = mapped_column(Float, default=0.5)  # Weight for space utilization (0-1)
    stability_weight: Mapped[float] = mapped_column(Float, default=0.4)  # Weight for CoG centering (0-1)
    cost_weight: Mapped[float] = mapped_column(Float, default=0.1)  # Weight for cost reduction (0-1)
