"""Tests for optimization engine determinism.
Ensures that identical inputs always produce identical placement outputs.
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

@pytest.fixture
def complex_loads():
    return [
        make_load(id=1, length=2.0, width=1.0, height=1.0, weight_kg=1000, quantity=2),
        make_load(id=2, type="cylinder", length=1.0, width=0.5, height=0.5, weight_kg=500, quantity=4, diameter=0.5),
        make_load(id=3, length=0.5, width=0.5, height=0.5, weight_kg=200, quantity=10),
    ]

def test_optimization_is_deterministic(standard_vehicle, complex_loads):
    """Run optimization twice with identical inputs and compare results."""
    result1 = run_optimization(standard_vehicle, complex_loads)
    result2 = run_optimization(standard_vehicle, complex_loads)
    
    # Compare placements
    assert len(result1.placements) == len(result2.placements)
    for p1, p2 in zip(result1.placements, result2.placements):
        assert p1.x == p2.x
        assert p1.y == p2.y
        assert p1.z == p2.z
        assert p1.load_id == p2.load_id
        assert p1.orientation == p2.orientation

    # Compare metrics
    assert result1.metrics.cg_x == result2.metrics.cg_x
    assert result1.metrics.cg_y == result2.metrics.cg_y
    assert result1.metrics.cg_z == result2.metrics.cg_z
    assert result1.metrics.axle_loads == result2.metrics.axle_loads

def test_load_order_does_not_affect_determinism(standard_vehicle):
    """Sorting loads before placement should ensure order-independence."""
    loads_set = [
        make_load(id=1, length=1.0, width=1.0, height=1.0, weight_kg=100, quantity=1),
        make_load(id=2, length=1.0, width=1.0, height=1.0, weight_kg=200, quantity=1),
    ]
    
    # Run with order [1, 2]
    res1 = run_optimization(standard_vehicle, loads_set)
    
    # Run with order [2, 1]
    res2 = run_optimization(standard_vehicle, loads_set[::-1])
    
    # The engine sorts by weight internally, so the final placements should be identical
    assert len(res1.placements) == len(res2.placements)
    for p1, p2 in zip(res1.placements, res2.placements):
        assert p1.x == p2.x
        assert p1.y == p2.y
        assert p1.z == p2.z
