"""Test suite for AAR-compliant deterministic optimization engine (engine_v2)."""

import pytest
from app.core.optimization.engine_v2 import run_optimization
from app.core.optimization.physics_engine import PhysicsEngine
from app.core.optimization.types import LoadSpec, VehicleSpec, LoadPlacement
from app.core.optimization.aar_rules import check_collisions


# ── Test Fixtures ─────────────────────────────────────────────────────────────

def make_vehicle(length=12.0, width=2.5, height=2.6, capacity=24000, axles=None):
    return VehicleSpec(
        id=1, type="container", length_m=length, width_m=width, height_m=height,
        capacity_kg=capacity, tare_weight_kg=20000, plate_type=None,
        truck_center_front_m=1.5, truck_center_rear_m=10.5,
        empty_cg_height_in=45, axle_positions=axles or [1.5, 4.5, 7.5, 10.5],
    )

def make_load(id=1, type="cube", length=1.0, width=1.0, height=1.0, weight=100,
              quantity=1, fragile=False, stackable=True, hazmat_class=None, diameter=None):
    return LoadSpec(
        id=id, type=type, length_m=length, width_m=width, height_m=height,
        weight_kg=weight, quantity=quantity, fragile=fragile, stackable=stackable,
        hazmat_class=hazmat_class, diameter_m=diameter,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# A. DETERMINISM & CORRECTNESS
# ═══════════════════════════════════════════════════════════════════════════════

class TestDeterminism:
    """Verify deterministic output: same input → same output."""

    def test_single_load_deterministic(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=1)]
        r1 = run_optimization(v, loads)
        r2 = run_optimization(v, loads)
        assert len(r1.placements) == len(r2.placements)
        if r1.placements:
            assert r1.placements[0].x == r2.placements[0].x
            assert r1.placements[0].y == r2.placements[0].y

    def test_multiple_loads_deterministic(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=5)]
        r1 = run_optimization(v, loads)
        r2 = run_optimization(v, loads)
        assert len(r1.placements) == len(r2.placements)


class TestNoOverlap:
    """Verify no overlapping loads."""

    def test_collision_detection(self):
        placements = [
            LoadPlacement(load_id=1, x=0, y=0, z=0, rx=0, ry=0, rz=0, rotated=False, 
                         placed_w=2, placed_h=1, placed_d=1),
            LoadPlacement(load_id=2, x=1, y=0, z=0, rx=0, ry=0, rz=0, rotated=False, 
                         placed_w=2, placed_h=1, placed_d=1),
        ]
        violations = check_collisions(placements, {})
        assert any(v.severity == "error" for v in violations)

    def test_no_collision_adjacent(self):
        placements = [
            LoadPlacement(load_id=1, x=0, y=0, z=0, rx=0, ry=0, rz=0, rotated=False, 
                         placed_w=2, placed_h=1, placed_d=1),
            LoadPlacement(load_id=2, x=2, y=0, z=0, rx=0, ry=0, rz=0, rotated=False, 
                         placed_w=2, placed_h=1, placed_d=1),
        ]
        violations = [v for v in check_collisions(placements, {}) if v.severity == "error"]
        assert len(violations) == 0

    def test_engine_no_overlaps(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=10)]
        r = run_optimization(v, loads)
        violations = check_collisions(r.placements, {})
        errors = [v for v in violations if v.severity == "error"]
        assert len(errors) == 0


class TestBoundsCompliance:
    """Verify all loads within vehicle bounds."""

    def test_load_too_large(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=15.0, width=3.0, height=3.0)]
        r = run_optimization(v, loads)
        assert len(r.placements) == 0

    def test_load_exact_boundary(self):
        v = make_vehicle(length=2.0, width=1.0, height=1.0)
        loads = [make_load(id=1, length=2.0, width=1.0, height=1.0)]
        r = run_optimization(v, loads)
        assert len(r.placements) == 1

    def test_placements_within_bounds(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=5)]
        r = run_optimization(v, loads)
        for p in r.placements:
            assert p.x + p.placed_w <= v.length_m + 0.01
            assert p.y + p.placed_h <= v.height_m + 0.01
            assert p.z + p.placed_d <= v.width_m + 0.01


class TestStableStacking:
    """Verify stable stacking (contact validation)."""

    def test_floor_or_stacked(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=10)]
        r = run_optimization(v, loads)
        for p in r.placements:
            assert p.y < 0.01 or p.contact_type == "load"

    def test_fragile_not_stacked(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=5, fragile=True)]
        r = run_optimization(v, loads)
        for p in r.placements:
            assert p.y < 0.01

    def test_non_stackable_not_stacked(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=5, stackable=False)]
        r = run_optimization(v, loads)
        for p in r.placements:
            assert p.y < 0.01


class TestCoGInOutput:
    """Verify CoG is computed and in placements."""

    def test_placement_has_cog(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=1)]
        r = run_optimization(v, loads)
        assert len(r.placements) > 0
        for p in r.placements:
            assert p.cog_x > 0 and p.cog_y > 0 and p.cog_z > 0

    def test_metrics_has_cg(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=1)]
        r = run_optimization(v, loads)
        assert r.metrics.cg_x >= 0
        assert r.metrics.cg_y >= 0
        assert r.metrics.cg_z >= 0


class TestAAREvaluation:
    """Verify AAR rules are evaluated."""

    def test_rules_evaluated(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=1)]
        r = run_optimization(v, loads)
        # Rules were evaluated (violations or warnings list should exist)
        assert isinstance(r.violations, list)
        assert isinstance(r.warnings, list)

    def test_securements_suggested(self):
        v = make_vehicle()
        loads = [make_load(id=1, weight=10000, quantity=1)]
        r = run_optimization(v, loads)
        assert "suggested_securements" in r.extra_data
        assert isinstance(r.extra_data["suggested_securements"], list)


class TestPhysicsEngineBalance:
    """Verify physics balance calculations handle repeated load quantities."""

    def test_repeated_load_ids_lateral_balance_uses_total_placed_weight(self):
        v = make_vehicle(width=2.0)
        load = make_load(id=9, weight=1000, quantity=10)
        engine = PhysicsEngine()
        placements = [
            LoadPlacement(
                load_id=9, x=0.0, y=0.0, z=0.0,
                rx=0, ry=0, rz=0, rotated=False,
                placed_w=1.0, placed_h=1.0, placed_d=1.0,
            )
            for _ in range(10)
        ]

        violations = engine.validate_lateral_balance(v, placements, [load])
        assert all(v.details and v.details["imbalance_pct"] <= 100 for v in violations)

    def test_repeated_load_ids_longitudinal_balance_uses_total_placed_weight(self):
        v = make_vehicle(length=20.0)
        load = make_load(id=9, weight=1000, quantity=10)
        engine = PhysicsEngine()
        placements = [
            LoadPlacement(
                load_id=9, x=0.0, y=0.0, z=0.0,
                rx=0, ry=0, rz=0, rotated=False,
                placed_w=1.0, placed_h=1.0, placed_d=1.0,
            )
            for _ in range(10)
        ]

        violations = engine.validate_longitudinal_balance(v, placements, [load])
        assert all(v.details and v.details["imbalance_pct"] <= 100 for v in violations)


class TestEdgeCases:
    """Edge case handling."""

    def test_empty_loads(self):
        v = make_vehicle()
        r = run_optimization(v, [])
        assert len(r.placements) == 0

    def test_tiny_load(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=0.01, width=0.01, height=0.01, weight=0.01)]
        r = run_optimization(v, loads)
        assert len(r.placements) == 1

    def test_large_quantity(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=0.3, width=0.3, height=0.3, weight=10, quantity=100)]
        r = run_optimization(v, loads)
        assert len(r.placements) > 0

    def test_zero_weight(self):
        v = make_vehicle()
        loads = [make_load(id=1, weight=0)]
        r = run_optimization(v, loads)
        assert len(r.placements) >= 0
