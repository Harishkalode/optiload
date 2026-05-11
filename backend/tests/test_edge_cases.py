"""Tests for optimization engine edge cases.
Covers extreme loads, empty sets, and vehicle boundary conditions.
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app.core.optimization.engine_v2 import run_optimization
from app.core.optimization.types import LoadSpec, VehicleSpec
from test_helpers import make_load

@pytest.fixture
def standard_vehicle():
    return VehicleSpec(
        id=1, type="container", length_m=12.0, width_m=2.5, height_m=2.6,
        capacity_kg=24000, tare_weight_kg=20000, plate_type=None,
        truck_center_front_m=None, truck_center_rear_m=None,
        empty_cg_height_in=None, axle_positions=[1.5, 4.5, 7.5, 10.5],
    )

def test_empty_loads(standard_vehicle):
    """Optimization with no loads should return empty placements."""
    result = run_optimization(standard_vehicle, [])
    assert len(result.placements) == 0
    assert result.metrics.weight_utilization == 0

def test_load_too_large_for_vehicle(standard_vehicle):
    """Loads larger than the vehicle dimensions should not be placed."""
    loads = [make_load(id=1, length=13.0, width=1.0, height=1.0, weight_kg=100, quantity=1)]
    result = run_optimization(standard_vehicle, loads)
    assert len(result.placements) == 0
    assert any(v.rule == "placement_oversized" for v in result.violations)

def test_massive_weight_over_capacity(standard_vehicle):
    """Loads exceeding vehicle capacity should still be placed if they fit spatially,
    but should trigger capacity violations (if implemented)."""
    loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight_kg=100000, quantity=1)]
    result = run_optimization(standard_vehicle, loads)
    assert len(result.placements) == 1
    # In current engine_v2, we don't strictly block placement on weight, but we compute metrics.
    assert result.metrics.weight_utilization > 1.0

def test_zero_weight_load(standard_vehicle):
    """Zero weight loads should be placed but not affect CoG."""
    loads = [make_load(id=1, length=1.0, width=1.0, height=1.0, weight_kg=0, quantity=1)]
    result = run_optimization(standard_vehicle, loads)
    assert len(result.placements) == 1

def test_extremely_small_load(standard_vehicle):
    """Micro-loads should be placed correctly."""
    loads = [make_load(id=1, length=0.001, width=0.001, height=0.001, weight_kg=0.001, quantity=1)]
    result = run_optimization(standard_vehicle, loads)
    assert len(result.placements) == 1

def test_exact_fit_dimensions(standard_vehicle):
    """Load that fits exactly to the millimeter should be placed."""
    loads = [make_load(id=1, length=12.0, width=2.5, height=2.6, weight_kg=100, quantity=1)]
    result = run_optimization(standard_vehicle, loads)
    assert len(result.placements) == 1

