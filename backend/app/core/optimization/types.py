"""Shared type definitions for physics-based optimization engine."""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Axle:
    """Represents a truck/cargo axle with weight limit and position."""
    position_m: float  # Distance from front of vehicle
    weight_limit_kg: float = 22500  # Default AAR limit
    current_load_kg: float = 0.0
    
    def capacity_remaining(self) -> float:
        return max(0, self.weight_limit_kg - self.current_load_kg)
    
    def is_overloaded(self) -> bool:
        return self.current_load_kg > self.weight_limit_kg


@dataclass
class CenterOfGravity:
    """Physical center of gravity with stability metrics (AAR 3.5.1-3.5.3)."""
    x_m: float  # Longitudinal (along vehicle length)
    y_m: float  # Vertical (height)
    z_m: float  # Lateral (across vehicle width)
    height_inches: float = 0.0  # Combined height above rail (AAR 3.5.1 limit: 98")
    total_weight: float = 0.0  # Total vehicle + load weight
    is_valid: bool = True
    
    def is_within_aar_limit(self, limit_inches: float = 98.0) -> bool:
        """AAR 3.5.1: CG height must not exceed 98 inches above top of rail."""
        return self.height_inches <= limit_inches
    
    def imbalance_lateral_pct(self, vehicle_width: float) -> float:
        """AAR 3.5.2: Lateral imbalance as percentage from centerline."""
        if vehicle_width <= 0:
            return 0.0
        center = vehicle_width / 2
        return abs(self.z_m - center) / center * 100
    
    def imbalance_longitudinal_pct(self, vehicle_length: float) -> float:
        """AAR 3.5.3: Longitudinal imbalance as percentage from centerline."""
        if vehicle_length <= 0:
            return 0.0
        center = vehicle_length / 2
        return abs(self.x_m - center) / center * 100


@dataclass
class ContactSurface:
    """Physical contact between load and vehicle/loads."""
    type: str  # "floor", "wall", "load", "riser"
    area_m2: float  # Contact area in square meters
    pressure_psi: float = 0.0  # Load pressure at contact point
    is_valid: bool = True  # False if contact is unstable or insufficient
    support_points: list[tuple[float, float, float]] = field(default_factory=list)


@dataclass
class VehicleSpec:
    id: int
    type: str  # "boxcar", "flatcar", "gondola", "reefer", "container", "railcar"
    length_m: float
    width_m: float
    height_m: float
    capacity_kg: float
    tare_weight_kg: float
    plate_type: str | None = None
    truck_center_front_m: float | None = None
    truck_center_rear_m: float | None = None
    empty_cg_height_m: float | None = None  # meters above rail (AAR 3.5.1 reference)
    empty_cg_height_in: float | None = None  # inches (for compatibility)
    axle_positions: list[float] | None = None
    axle_count: int | None = None
    per_axle_limit_kg: float | None = None
    doorway_width_m: float | None = None  # For boxcars/reefers
    doorway_height_m: float | None = None
    platform_height_m: float | None = 1.1  # Rail to deck (AAR standard)

    def get_axles(self) -> list[Axle]:
        """Create Axle objects from positions."""
        if not self.axle_positions:
            return []
        limit = self.per_axle_limit_kg or 22500
        return [Axle(position_m=pos, weight_limit_kg=limit) for pos in self.axle_positions]

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
    type: str  # "cube", "cylinder", "paper_roll", "pallet", "case", "coil"
    length_m: float
    width_m: float
    height_m: float
    weight_kg: float
    quantity: int
    fragile: bool
    stackable: bool
    hazmat_class: str | None
    diameter_m: float | None
    
    def compute_cog_offset(self) -> tuple[float, float, float]:
        """Compute center of gravity offset from load origin."""
        return (
            self.length_m / 2,
            self.height_m / 2 if self.type != "cylinder" else self.diameter_m / 2 if self.diameter_m else self.width_m / 2,
            self.width_m / 2
        )


@dataclass
class LoadPlacement:
    load_id: int
    x: float  # Longitudinal position (m from front)
    y: float  # Vertical height above floor (m)
    z: float  # Lateral position across width (m from left)
    orientation: str = "vertical"  # "vertical" or "horizontal" (affects W/H)
    rotation_y: float = 0.0  # Y-axis rotation in degrees (0, 90, 180, 270 for cylinders only)
    placed_w: float = 0.0  # Actual placed width
    placed_h: float = 0.0  # Actual placed height
    placed_d: float = 0.0  # Actual placed depth
    cog_x: float = 0.0  # Load's center of gravity X (absolute in vehicle coords)
    cog_y: float = 0.0  # Load's center of gravity Y (absolute in vehicle coords)
    cog_z: float = 0.0  # Load's center of gravity Z (absolute in vehicle coords)
    contact_type: str = "none"  # floor, wall, load, riser
    contact_surface_area: float = 0.0
    load: 'LoadSpec | None' = None  # Reference to original load spec
    contact_surfaces: list[ContactSurface] = field(default_factory=list)
    contact_points: list[tuple[float, float, float]] = field(default_factory=list)  # [x,y,z] contact points
    is_stable: bool = True  # Physics stability check


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
    rule: str  # e.g., "3.5.1"
    message: str
    severity: str  # "error" or "warning"
    details: dict[str, Any] | None = None


@dataclass
class AARValidation:
    """Result of evaluating a single AAR rule."""
    rule_id: str  # e.g., "3.5.1"
    passed: bool
    message: str
    severity: str = "error"  # "error" or "warning"
    details: dict[str, Any] | None = None  # Additional context


@dataclass
class AARValidationResult:
    """Result of validating a placement against all AAR rules."""
    valid: bool  # True if no errors (warnings allowed)
    violations: list[AARViolation] = field(default_factory=list)
    warnings: list[AARViolation] = field(default_factory=list)


@dataclass
class OptimizationResult:
    placements: list[LoadPlacement]
    metrics: OptimizationMetrics
    violations: list[AARViolation]
    warnings: list[AARViolation]
    extra_data: dict[str, Any] | None = None
