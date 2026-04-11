"""Packing constraints for the optimization engine."""

from dataclasses import dataclass, field


@dataclass
class PackingConstraints:
    """Constraint configuration for load placement."""
    max_stacking_layers: int = 10
    fragile_no_stack: bool = True
    doorway_zone_ratio: float = 0.15
    doorway_single_layer: bool = True
    max_void_gap_m: float = 0.3
    min_roll_contact_m: float = 0.0
    orientation_forced: dict[int, str] = field(default_factory=dict)
    must_not_touch_door: list[int] = field(default_factory=list)
    floor_friction: float = 0.5
    weight_balance: bool = True
    stack_rules: bool = True
    hazmat_separation: bool = False
    priority_order: bool = False
