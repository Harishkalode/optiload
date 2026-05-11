"""Comprehensive test suite for AAR 2019 Compliance Rules.
Covers CoG height, axle loads, lateral/longitudinal balance, and spatial constraints.
"""

import pytest
from app.core.optimization.types import LoadSpec, VehicleSpec, LoadPlacement, AARViolation
from app.core.optimization.physics_engine import PhysicsEngine
from app.core.optimization.aar_rules import (
    validate_load_bounds, check_collisions, validate_hazmat_separation,
    validate_lateral_balance, validate_longitudinal_balance, validate_combined_cg
)

# ── Helpers ──────────────────────────────────────────────────────────────────

def make_load(id=1, type="cube", length=1.0, width=1.0, height=1.0, weight_kg=100, 
              quantity=1, fragile=False, stackable=True, hazmat_class=None, diameter=None):
    return LoadSpec(
        id=id, type=type, length_m=length, width_m=width, height_m=height,
        weight_kg=weight_kg, quantity=quantity, fragile=fragile, stackable=stackable,
        hazmat_class=hazmat_class, diameter_m=diameter,
    )

# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def standard_vehicle():
    """Returns a standard AAR-compliant vehicle (e.g., a 40ft flatcar)."""
    return VehicleSpec(
        id=1, type="flatcar", length_m=12.192, width_m=3.048, height_m=2.5,
        capacity_kg=25000, tare_weight_kg=20000, plate_type=None,
        truck_center_front_m=None, truck_center_rear_m=None,
        empty_cg_height_in=40.0, axle_positions=[1.5, 4.5, 7.5, 10.5],
    )

@pytest.fixture
def physics():
    return PhysicsEngine()

# ── AAR 3.5.1: Center of Gravity Height ───────────────────────────────────────

class TestCoGHeight:
    def test_cog_height_valid(self, physics, standard_vehicle):
        """CoG height well below 98 inches should pass."""
        # Create a low placement
        placements = [LoadPlacement(load_id=1, x=6.0, y=0.0, z=1.5, placed_w=1.0, placed_h=1.0, placed_d=1.0, load=make_load(id=1, weight_kg=1000))]
        loads_dict = {1: placements[0].load}
        cog = physics.compute_combined_cog(standard_vehicle, placements, loads_dict)
        violation = physics.validate_cog_height(cog)
        assert violation is None

    def test_cog_height_exceeded(self, physics, standard_vehicle):
        """CoG height exceeding 98 inches should trigger a violation."""
        # Create a very tall and heavy placement to ensure combined CG is high
        placements = [LoadPlacement(load_id=1, x=6.0, y=0.0, z=1.5, placed_w=1.0, placed_h=10.0, placed_d=1.0, load=make_load(id=1, weight_kg=50000, height=10))]
        loads_dict = {1: placements[0].load}
        cog = physics.compute_combined_cog(standard_vehicle, placements, loads_dict)
        violation = physics.validate_cog_height(cog)
        assert violation is not None
        assert violation.rule == "3.5.1"
        assert violation.severity == "error"

# ── AAR 3.2.2: Axle Load Limits ───────────────────────────────────────────────

class TestAxleLoads:
    def test_axle_loads_balanced(self, physics, standard_vehicle):
        """Balanced loads should not exceed per-axle limits."""
        # Place a load in the center
        placements = [LoadPlacement(load_id=1, x=5.5, y=0.0, z=1.0, placed_w=1.0, placed_h=1.0, placed_d=1.0, load=make_load(id=1, weight_kg=5000))]
        load_weights = {1: 5000}
        violations = physics.validate_axle_loads(standard_vehicle, placements, load_weights)
        assert len(violations) == 0

    def test_axle_loads_overlimit(self, physics, standard_vehicle):
        """Extremely heavy load on one end should trigger axle limit violation."""
        # Heavy load at the very front
        placements = [LoadPlacement(load_id=1, x=0.0, y=0.0, z=1.0, placed_w=1.0, placed_h=1.0, placed_d=1.0, load=make_load(id=1, weight_kg=50000))]
        load_weights = {1: 50000}
        violations = physics.validate_axle_loads(standard_vehicle, placements, load_weights)
        assert len(violations) > 0
        assert any(v.rule == "aar_axle_load" for v in violations)

# ── AAR 3.5.2: Lateral Balance ────────────────────────────────────────────────

class TestLateralBalance:
    def test_lateral_balance_centered(self, standard_vehicle):
        """Centered load should be perfectly balanced."""
        # Vehicle width=3.048, half=1.524. Load width=1.0, start=1.524-0.5=1.024
        placements = [LoadPlacement(load_id=1, x=6.0, y=0.0, z=1.024, placed_w=1.0, placed_h=1.0, placed_d=1.0, load=make_load(id=1, weight_kg=1000))]
        load_weights = {1: 1000}
        violations = validate_lateral_balance(standard_vehicle, placements, load_weights)
        errors = [v for v in violations if v.severity == "error"]
        assert len(errors) == 0

    def test_lateral_balance_unbalanced(self, standard_vehicle):
        """Load placed far to one side should trigger balance violation."""
        # Place load at z=0.1 (far left)
        placements = [LoadPlacement(load_id=1, x=6.0, y=0.0, z=0.1, placed_w=1.0, placed_h=1.0, placed_d=1.0, load=make_load(id=1, weight_kg=10000))]
        load_weights = {1: 10000}
        violations = validate_lateral_balance(standard_vehicle, placements, load_weights)
        errors = [v for v in violations if v.severity == "error"]
        assert len(errors) > 0

# ── AAR 3.5.3: Longitudinal Balance ───────────────────────────────────────────

class TestLongitudinalBalance:
    def test_longitudinal_balance_centered(self, standard_vehicle):
        """Centered load should be balanced."""
        placements = [LoadPlacement(load_id=1, x=5.5, y=0.0, z=1.5, placed_w=1.0, placed_h=1.0, placed_d=1.0, load=make_load(id=1, weight_kg=1000))]
        load_weights = {1: 1000}
        violations = validate_longitudinal_balance(standard_vehicle, placements, load_weights)
        errors = [v for v in violations if v.severity == "error"]
        assert len(errors) == 0

    def test_longitudinal_balance_unbalanced(self, standard_vehicle):
        """Load placed at one extreme end should trigger balance violation."""
        # Place load at x=0.0 (front)
        placements = [LoadPlacement(load_id=1, x=0.0, y=0.0, z=1.5, placed_w=1.0, placed_h=1.0, placed_d=1.0, load=make_load(id=1, weight_kg=10000))]
        load_weights = {1: 10000}
        violations = validate_longitudinal_balance(standard_vehicle, placements, load_weights)
        errors = [v for v in violations if v.severity == "error"]
        assert len(errors) > 0

# ── Spatial Constraints ───────────────────────────────────────────────────────

class TestSpatialConstraints:
    def test_load_bounds_valid(self, standard_vehicle):
        """Load completely within vehicle bounds should pass."""
        placements = [LoadPlacement(load_id=1, x=1.0, y=0.0, z=1.0, placed_w=1.0, placed_h=1.0, placed_d=1.0)]
        violations = validate_load_bounds(standard_vehicle, placements, {})
        assert len(violations) == 0

    def test_load_bounds_invalid(self, standard_vehicle):
        """Load hanging off the vehicle should fail."""
        # Load at x=12.0 with width=1.0 (ends at 13.0, vehicle is 12.192)
        placements = [LoadPlacement(load_id=1, x=12.0, y=0.0, z=1.0, placed_w=1.0, placed_h=1.0, placed_d=1.0)]
        violations = validate_load_bounds(standard_vehicle, placements, {})
        assert len(violations) > 0

    def test_collision_no_overlap(self):
        """Non-overlapping loads should not trigger collision."""
        placements = [
            LoadPlacement(load_id=1, x=1.0, y=0.0, z=1.0, placed_w=1.0, placed_h=1.0, placed_d=1.0),
            LoadPlacement(load_id=2, x=3.0, y=0.0, z=1.0, placed_w=1.0, placed_h=1.0, placed_d=1.0),
        ]
        violations = check_collisions(placements, {})
        assert len(violations) == 0

    def test_collision_overlap(self):
        """Overlapping loads should trigger collision violation."""
        placements = [
            LoadPlacement(load_id=1, x=1.0, y=0.0, z=1.0, placed_w=1.0, placed_h=1.0, placed_d=1.0),
            LoadPlacement(load_id=2, x=1.5, y=0.0, z=1.0, placed_w=1.0, placed_h=1.0, placed_d=1.0),
        ]
        violations = check_collisions(placements, {})
        assert len(violations) > 0

# ── Hazmat Separation ─────────────────────────────────────────────────────────

class TestHazmatSeparation:
    def test_hazmat_separation_valid(self):
        """Loads of different hazmat classes far apart should pass."""
        placements = [
            LoadPlacement(load_id=1, x=1.0, y=0.0, z=1.0, placed_w=1.0, placed_h=1.0, placed_d=1.0),
            LoadPlacement(load_id=2, x=8.0, y=0.0, z=1.0, placed_w=1.0, placed_h=1.0, placed_d=1.0),
        ]
        hazmat_map = {1: "3", 2: "8"} # Flammable and Corrosive
        violations = validate_hazmat_separation(placements, hazmat_map)
        assert len(violations) == 0

    def test_hazmat_separation_invalid(self):
        """Loads of different hazmat classes too close should fail."""
        placements = [
            LoadPlacement(load_id=1, x=1.0, y=0.0, z=1.0, placed_w=1.0, placed_h=1.0, placed_d=1.0),
            LoadPlacement(load_id=2, x=2.0, y=0.0, z=1.0, placed_w=1.0, placed_h=1.0, placed_d=1.0),
        ]
        hazmat_map = {1: "3", 2: "8"}
        violations = validate_hazmat_separation(placements, hazmat_map)
        assert len(violations) > 0
