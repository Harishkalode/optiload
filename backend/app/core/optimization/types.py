"""Shared type definitions for the optimization engine."""

from dataclasses import dataclass
from typing import Any


@dataclass
class VehicleSpec:
    id: int
    type: str
    length_m: float
    width_m: float
    height_m: float
    capacity_kg: float
    tare_weight_kg: float
    plate_type: str | None
    truck_center_front_m: float | None
    truck_center_rear_m: float | None
    empty_cg_height_in: float | None
    axle_positions: list[float] | None

    @property
    def interior_length(self) -> float:
        return self.length_m

    @property
    def interior_width(self) -> float:
        return self.width_m

    @property
    def interior_height(self) -> float:
        return self.height_m


@dataclass
class LoadSpec:
    id: int
    type: str
    length_m: float
    width_m: float
    height_m: float
    weight_kg: float
    quantity: int
    fragile: bool
    stackable: bool
    hazmat_class: str | None
    diameter_m: float | None


@dataclass
class LoadPlacement:
    load_id: int
    x: float
    y: float
    z: float
    rx: float
    ry: float
    rz: float
    rotated: bool
    placed_w: float = 0.0
    placed_h: float = 0.0
    placed_d: float = 0.0


@dataclass
class OptimizationMetrics:
    cg_x: float
    cg_y: float
    cg_z: float
    axle_loads: list[float]
    lateral_imbalance_pct: float
    longitudinal_imbalance_pct: float
    volume_utilization: float
    weight_utilization: float


@dataclass
class AARViolation:
    rule: str
    message: str
    severity: str  # "error" or "warning"
    details: dict[str, Any] | None = None


@dataclass
class OptimizationResult:
    placements: list[LoadPlacement]
    metrics: OptimizationMetrics
    violations: list[AARViolation]
    warnings: list[AARViolation]
    extra_data: dict[str, Any] | None = None
