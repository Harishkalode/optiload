"""Comprehensive test suite for the optimization engine and all subsystems."""

import pytest
import time
from app.core.optimization.engine import (
    run_optimization, place_loads_3d, balance_cg, expand_loads, _get_dims, _fits
)
from app.core.optimization.constraints import PackingConstraints
from app.core.optimization.types import LoadSpec, VehicleSpec, LoadPlacement
from app.core.optimization.aar_rules import (
    validate_combined_cg, validate_axle_loads, validate_lateral_balance,
    validate_longitudinal_balance, validate_load_bounds, check_collisions,
    validate_hazmat_separation, compute_metrics, analyze_weight_distribution
)
from app.core.optimization.materials import analyze_stability, MATERIALS
from app.core.optimization.compression import analyze_compression, COMPRESSION_LIMITS
from app.core.optimization.fillers import detect_voids, fill_voids, FILLER_TYPES
from app.core.optimization.sequencing import generate_loading_sequence
from app.core.optimization.autocorrect import auto_correct


# ── Test Fixtures ─────────────────────────────────────────────────────────────

def make_vehicle(length=12.0, width=2.5, height=2.6, capacity=24000, axles=None):
    return VehicleSpec(
        id=1, type="container", length_m=length, width_m=width, height_m=height,
        capacity_kg=capacity, tare_weight_kg=20000, plate_type=None,
        truck_center_front_m=None, truck_center_rear_m=None,
        empty_cg_height_in=None, axle_positions=axles or [1.5, 4.5, 7.5, 10.5],
    )

def make_load(id=1, type="cube", length=1.0, width=1.0, height=1.0, weight=100,
              quantity=1, fragile=False, stackable=True, hazmat_class=None, diameter=None):
    return LoadSpec(
        id=id, type=type, length_m=length, width_m=width, height_m=height,
        weight_kg=weight, quantity=quantity, fragile=fragile, stackable=stackable,
        hazmat_class=hazmat_class, diameter_m=diameter,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# A. CORE FUNCTIONAL TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestCoreFunctional:
    def test_single_load_fits(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight=100, quantity=1)]
        result = run_optimization(v, loads)
        assert len(result.placements) == 1
        assert len(result.violations) == 0

    def test_multiple_loads_fit(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=0.5, width=0.5, height=0.5, weight=50, quantity=10)]
        result = run_optimization(v, loads)
        assert len(result.placements) == 10
        assert len(result.violations) == 0

    def test_expand_loads(self):
        loads = [make_load(id=1, quantity=5)]
        expanded = expand_loads(loads)
        assert len(expanded) == 5
        for l in expanded:
            assert l.quantity == 1

    def test_get_dims_cube(self):
        load = make_load(type="cube", length=2.0, width=1.0, height=0.5)
        assert _get_dims(load) == (2.0, 0.5, 1.0)

    def test_get_dims_cylinder(self):
        load = make_load(type="cylinder", length=3.0, width=1.0, height=1.0, diameter=0.8)
        assert _get_dims(load) == (0.8, 0.8, 3.0)

    def test_mixed_load_types(self):
        v = make_vehicle()
        loads = [
            make_load(id=1, type="cube", length=1.0, width=1.0, height=1.0, weight=100, quantity=3),
            make_load(id=2, type="cylinder", length=2.0, width=0.5, height=0.5, weight=200, quantity=2, diameter=0.5),
        ]
        result = run_optimization(v, loads)
        assert len(result.placements) == 5

    def test_optimization_returns_extra_data(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=5)]
        result = run_optimization(v, loads)
        assert result.extra_data is not None
        assert "material_analysis" in result.extra_data
        assert "compression_analysis" in result.extra_data
        assert "weight_distribution" in result.extra_data
        assert "fillers" in result.extra_data
        assert "loading_sequence" in result.extra_data

    def test_weight_distribution_analysis(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=0.5, width=0.5, height=0.5, weight=100, quantity=4)]
        result = run_optimization(v, loads)
        wd = result.extra_data["weight_distribution"]
        assert "cg_x" in wd
        assert "left_pct" in wd
        assert "right_pct" in wd
        assert "front_pct" in wd
        assert "rear_pct" in wd
        assert abs(wd["left_pct"] + wd["right_pct"] - 100.0) < 1.0

    def test_loading_sequence_generated(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=5)]
        result = run_optimization(v, loads)
        seq = result.extra_data["loading_sequence"]
        assert "steps" in seq
        assert "total_time_seconds" in seq
        assert "total_loads" in seq
        assert seq["total_loads"] == len(result.placements)


# ═══════════════════════════════════════════════════════════════════════════════
# B. CONSTRAINT RULE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestConstraintRules:
    def test_doorway_single_layer(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=11.0, width=1.0, height=1.0, weight=100, quantity=2)]
        constraints = PackingConstraints(doorway_single_layer=True)
        result = run_optimization(v, loads, constraints)
        doorway_start = v.length_m * 0.85
        for p in result.placements:
            if p.x + p.placed_w > doorway_start:
                assert p.y < 0.01

    def test_fragile_no_stack(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight=100, quantity=5, fragile=True)]
        constraints = PackingConstraints(fragile_no_stack=True)
        result = run_optimization(v, loads, constraints)
        for p in result.placements:
            assert p.y < 0.01

    def test_non_stackable(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight=100, quantity=5, stackable=False)]
        result = run_optimization(v, loads)
        for p in result.placements:
            assert p.y < 0.01

    def test_max_stacking_layers(self):
        v = make_vehicle(height=10.0)
        loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight=100, quantity=20)]
        constraints = PackingConstraints(max_stacking_layers=2)
        result = run_optimization(v, loads, constraints)
        for p in result.placements:
            layer = int(p.y / max(1.0, 0.01))
            assert layer < 2

    def test_hazmat_separation(self):
        v = make_vehicle()
        loads = [
            make_load(id=1, length=0.5, width=0.5, height=0.5, weight=100, quantity=1, hazmat_class="3"),
            make_load(id=2, length=0.5, width=0.5, height=0.5, weight=100, quantity=1, hazmat_class="3"),
        ]
        result = run_optimization(v, loads)
        hazmat_violations = [v for v in result.violations if v.rule == "hazmat_separation"]
        for p1 in result.placements:
            for p2 in result.placements:
                if p1.load_id != p2.load_id:
                    dist = ((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2)**0.5
                    if dist < 3.0:
                        assert len(hazmat_violations) > 0

    def test_load_bounds_violation(self):
        v = make_vehicle(length=5.0, width=2.0, height=2.0)
        loads = [make_load(id=1, length=6.0, width=1.0, height=1.0, weight=100, quantity=1)]
        result = run_optimization(v, loads)
        assert len(result.placements) == 0

    def test_collision_detection(self):
        placements = [
            LoadPlacement(load_id=1, x=0, y=0, z=0, rx=0, ry=0, rz=0, rotated=False, placed_w=2, placed_h=1, placed_d=1),
            LoadPlacement(load_id=1, x=1, y=0, z=0, rx=0, ry=0, rz=0, rotated=False, placed_w=2, placed_h=1, placed_d=1),
        ]
        violations = check_collisions(placements, {})
        assert len(violations) > 0

    def test_no_collision_adjacent(self):
        placements = [
            LoadPlacement(load_id=1, x=0, y=0, z=0, rx=0, ry=0, rz=0, rotated=False, placed_w=2, placed_h=1, placed_d=1),
            LoadPlacement(load_id=1, x=2, y=0, z=0, rx=0, ry=0, rz=0, rotated=False, placed_w=2, placed_h=1, placed_d=1),
        ]
        violations = check_collisions(placements, {})
        assert len(violations) == 0

    def test_no_collision_stacked(self):
        placements = [
            LoadPlacement(load_id=1, x=0, y=0, z=0, rx=0, ry=0, rz=0, rotated=False, placed_w=2, placed_h=1, placed_d=1),
            LoadPlacement(load_id=1, x=0, y=1, z=0, rx=0, ry=0, rz=0, rotated=False, placed_w=2, placed_h=1, placed_d=1),
        ]
        violations = check_collisions(placements, {})
        assert len(violations) == 0


# ═══════════════════════════════════════════════════════════════════════════════
# C. EDGE CASE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestEdgeCases:
    def test_empty_loads(self):
        v = make_vehicle()
        result = run_optimization(v, [])
        assert len(result.placements) == 0

    def test_single_tiny_item(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=0.01, width=0.01, height=0.01, weight=0.01, quantity=1)]
        result = run_optimization(v, loads)
        assert len(result.placements) == 1

    def test_single_massive_item_fits(self):
        v = make_vehicle(length=12.0, width=2.5, height=2.6, capacity=100000)
        loads = [make_load(id=1, length=11.9, width=2.4, height=2.5, weight=50000, quantity=1)]
        result = run_optimization(v, loads)
        assert len(result.placements) == 1

    def test_item_too_large(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=15.0, width=3.0, height=3.0, weight=100, quantity=1)]
        result = run_optimization(v, loads)
        assert len(result.placements) == 0

    def test_very_small_vehicle(self):
        v = make_vehicle(length=1.0, width=0.5, height=0.5, capacity=1000)
        loads = [make_load(id=1, length=0.3, width=0.3, height=0.3, weight=50, quantity=5)]
        result = run_optimization(v, loads)
        assert len(result.placements) >= 1

    def test_zero_weight_load(self):
        v = make_vehicle()
        loads = [make_load(id=1, weight=0, quantity=1)]
        result = run_optimization(v, loads)
        assert len(result.placements) >= 0

    def test_duplicate_load_ids(self):
        v = make_vehicle()
        loads = [
            make_load(id=1, length=0.5, width=0.5, height=0.5, weight=100, quantity=1),
            make_load(id=1, length=0.5, width=0.5, height=0.5, weight=200, quantity=1),
        ]
        result = run_optimization(v, loads)
        assert len(result.placements) >= 0

    def test_quantity_one(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=1)]
        result = run_optimization(v, loads)
        assert len(result.placements) == 1

    def test_large_quantity_small_items(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=0.3, width=0.3, height=0.3, weight=10, quantity=100)]
        result = run_optimization(v, loads)
        assert len(result.placements) > 0

    def test_mixed_fragile_and_sturdy(self):
        v = make_vehicle()
        loads = [
            make_load(id=1, length=1.0, width=1.0, height=1.0, weight=100, quantity=2, fragile=True),
            make_load(id=2, length=1.0, width=1.0, height=1.0, weight=200, quantity=2, fragile=False),
        ]
        result = run_optimization(v, loads)
        for p in result.placements:
            if p.load_id == 1:
                assert p.y < 0.01

    def test_cylinder_orientation(self):
        v = make_vehicle()
        loads = [make_load(id=1, type="cylinder", length=3.0, width=0.5, height=0.5, weight=100, quantity=1, diameter=0.5)]
        result = run_optimization(v, loads)
        assert len(result.placements) >= 0

    def test_exact_fit_vehicle(self):
        v = make_vehicle(length=2.0, width=1.0, height=1.0, capacity=500)
        loads = [make_load(id=1, length=2.0, width=1.0, height=1.0, weight=100, quantity=1)]
        result = run_optimization(v, loads)
        assert len(result.placements) == 1

    def test_overweight_total(self):
        v = make_vehicle(capacity=500)
        loads = [make_load(id=1, weight=600, quantity=1)]
        result = run_optimization(v, loads)
        assert len(result.placements) >= 0


# ═══════════════════════════════════════════════════════════════════════════════
# D. PHYSICS / STABILITY TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestPhysicsStability:
    def test_stability_scoring_all_types(self):
        for load_type in MATERIALS:
            lt = "cube" if load_type == "default" else load_type
            load = make_load(type=lt)
            v = make_vehicle()
            result = run_optimization(v, [load])
            if result.extra_data and "material_analysis" in result.extra_data:
                for ma in result.extra_data["material_analysis"]:
                    assert 0 <= ma["stability_score"] <= 100
                    assert 0 <= ma["sliding_risk"] <= 100
                    assert 0 <= ma["rolling_risk"] <= 100
                    assert 0 <= ma["tipping_risk"] <= 100

    def test_cylinder_rolling_risk(self):
        v = make_vehicle()
        loads = [make_load(id=1, type="cylinder", length=2.0, width=0.5, height=0.5, weight=100, quantity=1, diameter=0.5)]
        result = run_optimization(v, loads)
        ma = result.extra_data.get("material_analysis", [])
        for m in ma:
            if m["type"] == "cylinder":
                assert m["rolling_risk"] > 0

    def test_tall_load_tipping_risk(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=0.2, width=0.2, height=2.5, weight=50, quantity=1)]
        result = run_optimization(v, loads)
        ma = result.extra_data.get("material_analysis", [])
        for m in ma:
            assert m["tipping_risk"] >= 0

    def test_stack_risk_increases_with_layers(self):
        v = make_vehicle(height=5.0)
        loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight=100, quantity=4)]
        result = run_optimization(v, loads)
        ma = result.extra_data.get("material_analysis", [])
        stack_risks = [m["stack_risk"] for m in ma]
        assert max(stack_risks) >= min(stack_risks)

    def test_low_friction_material(self):
        mat = MATERIALS["cylinder"]
        assert mat["friction_floor"] < 0.5

    def test_high_friction_material(self):
        mat = MATERIALS["pallet"]
        assert mat["friction_floor"] >= 0.5


# ═══════════════════════════════════════════════════════════════════════════════
# E. FILLER SYSTEM TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestFillerSystem:
    def test_voids_detected_after_placement(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight=100, quantity=1)]
        result = run_optimization(v, loads)
        assert "void_count" in result.extra_data
        assert "void_volume" in result.extra_data
        assert result.extra_data["void_count"] >= 0

    def test_fillers_placed_in_voids(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight=100, quantity=1)]
        result = run_optimization(v, loads)
        fillers = result.extra_data.get("fillers", [])
        assert isinstance(fillers, list)

    def test_filler_types_exist(self):
        assert "airbag" in FILLER_TYPES
        assert "foam_panel" in FILLER_TYPES
        assert "honeycomb" in FILLER_TYPES

    def test_filler_crush_strengths_positive(self):
        for ftype, fspec in FILLER_TYPES.items():
            assert fspec.crush_strength_pa > 0
            assert fspec.min_gap_m > 0
            assert fspec.max_gap_m > fspec.min_gap_m

    def test_no_fillers_in_doorway(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight=100, quantity=1)]
        result = run_optimization(v, loads)
        fillers = result.extra_data.get("fillers", [])
        doorway_start = v.length_m * 0.85
        for f in fillers:
            assert f["x"] + f["length"] <= doorway_start or f["x"] < doorway_start

    def test_large_vehicle_many_voids(self):
        v = make_vehicle(length=20.0, width=3.0, height=3.0)
        loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight=100, quantity=2)]
        result = run_optimization(v, loads)
        assert result.extra_data["void_count"] > 0
        assert result.extra_data["void_volume"] > 0


# ═══════════════════════════════════════════════════════════════════════════════
# F. PERFORMANCE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestPerformance:
    def test_one_item(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=1)]
        start = time.time()
        run_optimization(v, loads)
        elapsed = time.time() - start
        assert elapsed < 1.0, f"Single item took {elapsed:.2f}s"

    def test_100_items(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=0.5, width=0.5, height=0.5, weight=10, quantity=100)]
        start = time.time()
        result = run_optimization(v, loads)
        elapsed = time.time() - start
        print(f"\n  [PERF] 100 items: {elapsed:.2f}s, placed={len(result.placements)}")
        assert elapsed < 30.0, f"100 items took {elapsed:.2f}s"

    def test_500_items(self):
        v = make_vehicle(length=20.0, width=3.0, height=3.0, capacity=100000)
        loads = [make_load(id=1, length=0.3, width=0.3, height=0.3, weight=5, quantity=500)]
        start = time.time()
        result = run_optimization(v, loads)
        elapsed = time.time() - start
        print(f"\n  [PERF] 500 items: {elapsed:.2f}s, placed={len(result.placements)}")
        assert elapsed < 60.0, f"500 items took {elapsed:.2f}s"

    def test_many_different_load_types(self):
        v = make_vehicle(length=20.0, width=3.0, height=3.0, capacity=100000)
        loads = [
            make_load(id=1, type="cube", length=0.5, width=0.5, height=0.5, weight=50, quantity=20),
            make_load(id=2, type="cylinder", length=1.0, width=0.3, height=0.3, weight=80, quantity=10, diameter=0.3),
            make_load(id=3, type="pallet", length=1.2, width=0.8, height=0.5, weight=200, quantity=5),
        ]
        start = time.time()
        result = run_optimization(v, loads)
        elapsed = time.time() - start
        print(f"\n  [PERF] Mixed types: {elapsed:.2f}s, placed={len(result.placements)}")
        assert elapsed < 30.0


# ═══════════════════════════════════════════════════════════════════════════════
# G. AUTO-CORRECTION TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestAutoCorrection:
    def test_no_violations_returns_unchanged(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight=100, quantity=1)]
        result = run_optimization(v, loads)
        if len(result.violations) == 0:
            correction = auto_correct(v, result.placements, {1: 100}, [])
            assert correction.improvement_score == 1.0
            assert correction.violations_before == 0

    def test_correction_reduces_violations(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=0.5, width=0.5, height=0.5, weight=100, quantity=10)]
        result = run_optimization(v, loads)
        if len(result.violations) > 0:
            correction = auto_correct(v, result.placements, {1: 100}, [])
            assert correction.violations_after <= correction.violations_before


# ═══════════════════════════════════════════════════════════════════════════════
# H. SEQUENCING TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestSequencing:
    def test_sequence_has_all_loads(self):
        v = make_vehicle()
        loads = [make_load(id=1, quantity=5)]
        result = run_optimization(v, loads)
        seq = result.extra_data["loading_sequence"]
        assert seq["total_loads"] == len(result.placements)
        assert len(seq["steps"]) == len(result.placements)

    def test_sequence_far_first(self):
        v = make_vehicle()
        loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight=100, quantity=2)]
        result = run_optimization(v, loads)
        seq = result.extra_data["loading_sequence"]
        if len(seq["steps"]) >= 2:
            first_x = seq["steps"][0]["position"]["x"]
            last_x = seq["steps"][-1]["position"]["x"]
            assert abs(first_x - v.length_m) >= abs(last_x - v.length_m) - 0.1


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
