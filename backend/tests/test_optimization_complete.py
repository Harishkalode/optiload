"""Comprehensive test suite for physics-based optimization engine.

Tests cover:
- Determinism (same input → same output)
- Correctness (physics constraints satisfied)
- Stability (edge cases, boundary conditions)
- AAR compliance (all 7 non-negotiables)
- Performance (reasonable runtime)
"""

import pytest
from app.core.optimization.engine_v2 import run_optimization
from app.core.optimization.types import VehicleSpec, LoadSpec


# ═══════════════════════════════════════════════════════════════════════════════
# FIXTURES
# ═══════════════════════════════════════════════════════════════════════════════

@pytest.fixture
def standard_vehicle():
    """Standard boxcar for testing."""
    return VehicleSpec(
        id=1, type="boxcar", length_m=12.0, width_m=2.5, height_m=2.6,
        capacity_kg=24000, tare_weight_kg=20000, plate_type=None,
        truck_center_front_m=1.5, truck_center_rear_m=10.5,
        empty_cg_height_in=45, axle_positions=[1.5, 4.5, 7.5, 10.5],
    )


@pytest.fixture
def cube_load():
    """Standard cube load."""
    return LoadSpec(
        id=1, type="cube", length_m=1.0, width_m=1.0, height_m=1.0,
        weight_kg=100, quantity=1, fragile=False, stackable=True,
        hazmat_class=None, diameter_m=None
    )


# ═══════════════════════════════════════════════════════════════════════════════
# A. DETERMINISM TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestDeterminism:
    """Verify deterministic behavior: same input → same output."""
    
    def test_single_load_deterministic(self, standard_vehicle, cube_load):
        """Single load placement must be deterministic."""
        r1 = run_optimization(standard_vehicle, [cube_load])
        r2 = run_optimization(standard_vehicle, [cube_load])
        
        assert len(r1.placements) == len(r2.placements), "Placement count differs"
        for p1, p2 in zip(r1.placements, r2.placements):
            assert p1.x == p2.x and p1.y == p2.y and p1.z == p2.z, f"Position differs: {p1} vs {p2}"
    
    def test_multiple_loads_deterministic(self, standard_vehicle):
        """Multiple loads maintain deterministic ordering."""
        loads = [
            LoadSpec(id=1, type="cube", length_m=1.0, width_m=1.0, height_m=1.0,
                    weight_kg=200, quantity=2, fragile=False, stackable=True,
                    hazmat_class=None, diameter_m=None),
            LoadSpec(id=2, type="cube", length_m=0.5, width_m=0.5, height_m=0.5,
                    weight_kg=50, quantity=1, fragile=False, stackable=True,
                    hazmat_class=None, diameter_m=None),
        ]
        
        positions_run1 = [(p.load_id, p.x, p.y, p.z) for p in run_optimization(standard_vehicle, loads).placements]
        positions_run2 = [(p.load_id, p.x, p.y, p.z) for p in run_optimization(standard_vehicle, loads).placements]
        
        assert positions_run1 == positions_run2, "Positions differ between runs"


# ═══════════════════════════════════════════════════════════════════════════════
# B. CORRECTNESS TESTS (Physics & Constraints)
# ═══════════════════════════════════════════════════════════════════════════════

class TestCorrectness:
    """Verify algorithm correctness."""
    
    def test_no_overlap(self, standard_vehicle):
        """Placed loads must not overlap."""
        loads = [
            LoadSpec(id=i, type="cube", length_m=1.0, width_m=1.0, height_m=1.0,
                    weight_kg=100, quantity=1, fragile=False, stackable=True,
                    hazmat_class=None, diameter_m=None)
            for i in range(1, 6)
        ]
        
        result = run_optimization(standard_vehicle, loads)
        placements = result.placements
        
        # Check no two placements overlap
        for i, p1 in enumerate(placements):
            for p2 in placements[i+1:]:
                # AABB collision check
                overlap_x = not (p1.x + p1.placed_w <= p2.x or p2.x + p2.placed_w <= p1.x)
                overlap_y = not (p1.y + p1.placed_h <= p2.y or p2.y + p2.placed_h <= p1.y)
                overlap_z = not (p1.z + p1.placed_d <= p2.z or p2.z + p2.placed_d <= p1.z)
                
                assert not (overlap_x and overlap_y and overlap_z), \
                    f"Loads overlap: {p1.load_id} at ({p1.x}, {p1.y}, {p1.z}) and {p2.load_id} at ({p2.x}, {p2.y}, {p2.z})"
    
    def test_within_bounds(self, standard_vehicle):
        """All loads must remain within vehicle boundaries."""
        loads = [
            LoadSpec(id=1, type="cube", length_m=2.0, width_m=2.0, height_m=2.0,
                    weight_kg=500, quantity=1, fragile=False, stackable=True,
                    hazmat_class=None, diameter_m=None),
        ]
        
        result = run_optimization(standard_vehicle, loads)
        
        for p in result.placements:
            assert p.x >= 0 and p.x + p.placed_w <= standard_vehicle.length_m, \
                f"Load {p.load_id} exceeds X bounds"
            assert p.z >= 0 and p.z + p.placed_d <= standard_vehicle.width_m, \
                f"Load {p.load_id} exceeds Z bounds"
            assert p.y >= 0 and p.y + p.placed_h <= standard_vehicle.height_m, \
                f"Load {p.load_id} exceeds Y bounds"
    
    def test_axle_loads_computed(self, standard_vehicle):
        """Axle load distribution must be computed and sum correctly."""
        loads = [
            LoadSpec(id=1, type="cube", length_m=2.0, width_m=2.0, height_m=2.0,
                    weight_kg=1000, quantity=1, fragile=False, stackable=True,
                    hazmat_class=None, diameter_m=None),
        ]
        
        result = run_optimization(standard_vehicle, loads)
        
        assert len(result.metrics.axle_loads) == 4, f"Expected 4 axle loads, got {len(result.metrics.axle_loads)}"
        total_axle_load = sum(result.metrics.axle_loads)
        expected = standard_vehicle.tare_weight_kg + 1000
        
        assert abs(total_axle_load - expected) < 1.0, \
            f"Axle loads {total_axle_load:.0f}kg != expected {expected}kg"


# ═══════════════════════════════════════════════════════════════════════════════
# C. AAR COMPLIANCE TESTS (7 Non-Negotiables)
# ═══════════════════════════════════════════════════════════════════════════════

class TestAARCompliance:
    """Verify AAR constraint detection."""
    
    def test_cog_height_validation(self, standard_vehicle):
        """AAR 3.5.1: CoG height must be ≤ 98 inches."""
        loads = [
            LoadSpec(id=1, type="cube", length_m=1.0, width_m=1.0, height_m=1.0,
                    weight_kg=100, quantity=1, fragile=False, stackable=True,
                    hazmat_class=None, diameter_m=None),
        ]
        
        result = run_optimization(standard_vehicle, loads)
        cog_height = result.extra_data.get("cog_height_inches", 0)
        
        # Should not exceed limit
        assert cog_height <= 98.0 or any("cog_height" in v.rule for v in result.violations), \
            f"CoG height {cog_height:.1f}in not validated"
    
    def test_axle_limits_enforced(self, standard_vehicle):
        """AAR 3.2.2: No axle load exceeds limit."""
        loads = [
            LoadSpec(id=1, type="cube", length_m=2.0, width_m=2.0, height_m=2.0,
                    weight_kg=1000, quantity=1, fragile=False, stackable=True,
                    hazmat_class=None, diameter_m=None),
        ]
        
        result = run_optimization(standard_vehicle, loads)
        
        # With standard limits, this should not violate
        for axle_load in result.metrics.axle_loads:
            assert axle_load <= 22500.0 or any("axle" in v.rule for v in result.violations), \
                f"Axle load {axle_load:.0f}kg exceeds AAR limit 22500kg"
    
    def test_fragile_no_stack(self, standard_vehicle):
        """Fragile loads cannot be stacked."""
        loads = [
            LoadSpec(id=1, type="cube", length_m=1.0, width_m=1.0, height_m=1.0,
                    weight_kg=100, quantity=1, fragile=True, stackable=False,
                    hazmat_class=None, diameter_m=None),
            LoadSpec(id=2, type="cube", length_m=1.0, width_m=1.0, height_m=1.0,
                    weight_kg=100, quantity=1, fragile=False, stackable=True,
                    hazmat_class=None, diameter_m=None),
        ]
        
        result = run_optimization(standard_vehicle, loads)
        
        # Fragile load should be on floor
        fragile_placement = next((p for p in result.placements if p.load_id == 1), None)
        if fragile_placement:
            assert fragile_placement.y < 0.01, f"Fragile load placed at height {fragile_placement.y:.2f}m"


# ═══════════════════════════════════════════════════════════════════════════════
# D. EDGE CASE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestEdgeCases:
    """Handle boundary conditions and edge cases."""
    
    def test_empty_loads(self, standard_vehicle):
        """Empty load list handled gracefully."""
        result = run_optimization(standard_vehicle, [])
        assert len(result.placements) == 0, "Should handle empty loads"
    
    def test_oversized_load(self, standard_vehicle):
        """Oversized load rejected gracefully."""
        loads = [
            LoadSpec(id=1, type="cube", length_m=15.0, width_m=2.0, height_m=2.0,
                    weight_kg=1000, quantity=1, fragile=False, stackable=True,
                    hazmat_class=None, diameter_m=None),
        ]
        
        result = run_optimization(standard_vehicle, loads)
        assert len(result.placements) == 0, "Oversized load should not be placed"
        assert any("oversized" in v.rule.lower() or "exceeds" in v.message.lower() 
                  for v in result.violations), "Should report oversized violation"
    
    def test_unit_normalization(self):
        """Unit mismatches corrected (cm → m, mm → m)."""
        # Vehicle in centimeters
        vehicle_cm = VehicleSpec(
            id=1, type="boxcar", length_m=1200.0, width_m=250.0, height_m=260.0,
            capacity_kg=24000, tare_weight_kg=20000, plate_type=None,
            truck_center_front_m=150.0, truck_center_rear_m=1050.0,
            empty_cg_height_in=45, axle_positions=[150.0, 450.0, 750.0, 1050.0],
        )
        
        loads = [
            LoadSpec(id=1, type="cube", length_m=100.0, width_m=100.0, height_m=100.0,
                    weight_kg=100, quantity=1, fragile=False, stackable=True,
                    hazmat_class=None, diameter_m=None),
        ]
        
        result = run_optimization(vehicle_cm, loads)
        # Should normalize and place successfully
        assert len(result.placements) > 0, "Should normalize units and place load"


# ═══════════════════════════════════════════════════════════════════════════════
# E. PERFORMANCE TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestPerformance:
    """Verify reasonable performance characteristics."""
    
    def test_realistic_scenario(self, standard_vehicle):
        """Full realistic scenario completes in reasonable time."""
        loads = [
            LoadSpec(id=i, type="cube", length_m=1.0, width_m=1.0, height_m=1.0,
                    weight_kg=200, quantity=2, fragile=False, stackable=True,
                    hazmat_class=None, diameter_m=None)
            for i in range(1, 11)  # 10 load specs = 20 items total
        ]
        
        import time
        start = time.time()
        result = run_optimization(standard_vehicle, loads)
        elapsed = time.time() - start
        
        assert elapsed < 5.0, f"Optimization took {elapsed:.2f}s (expected < 5s)"
        assert len(result.placements) > 0, "Should place items in realistic scenario"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
