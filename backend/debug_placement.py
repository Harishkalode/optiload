#!/usr/bin/env python
"""Debug script: investigate multi-load placement issue."""

from app.core.optimization.engine_v2 import run_optimization
from app.core.optimization.types import LoadSpec, VehicleSpec

# Create test vehicle
v = VehicleSpec(
    id=1, type="container", length_m=12.0, width_m=2.5, height_m=2.6,
    capacity_kg=24000, tare_weight_kg=20000, plate_type=None,
    truck_center_front_m=None, truck_center_rear_m=None,
    empty_cg_height_in=None, axle_positions=[1.5, 4.5, 7.5, 10.5],
)

# Test 1: Multiple small loads (should place all 5)
print("=" * 60)
print("Test 1: 5 small loads (1m x 1m x 1m each, 100kg each)")
print("=" * 60)
loads = [LoadSpec(
    id=1, type="cube", length_m=1.0, width_m=1.0, height_m=1.0,
    weight_kg=100, quantity=5, fragile=False, stackable=True,
    hazmat_class=None, diameter_m=None,
)]

result = run_optimization(v, loads)
print(f"Result: {len(result.placements)}/{5} loads placed")
print(f"Violations: {len(result.violations)}")
for violation in result.violations:
    print(f"  - {violation.rule}: {violation.message[:80]}")

if len(result.placements) < 5:
    print("\nPlacement details:")
    for i, p in enumerate(result.placements):
        print(f"  Placement {i+1}: pos=({p.x:.2f}, {p.y:.2f}, {p.z:.2f}), size=({p.placed_w:.2f}, {p.placed_h:.2f}, {p.placed_d:.2f})")

# Test 2: Larger loads (should place at least some)
print("\n" + "=" * 60)
print("Test 2: 3 large loads (2m x 2m x 2m each, 500kg each)")
print("=" * 60)
loads2 = [LoadSpec(
    id=2, type="cube", length_m=2.0, width_m=2.0, height_m=2.0,
    weight_kg=500, quantity=3, fragile=False, stackable=True,
    hazmat_class=None, diameter_m=None,
)]

result2 = run_optimization(v, loads2)
print(f"Result: {len(result2.placements)}/{3} loads placed")
print(f"Violations: {len(result2.violations)}")
for violation in result2.violations[:5]:  # Show first 5 violations
    print(f"  - {violation.rule}: {violation.message[:80]}")

if len(result2.placements) < 3:
    print("\nPlacement details:")
    for i, p in enumerate(result2.placements):
        print(f"  Placement {i+1}: pos=({p.x:.2f}, {p.y:.2f}, {p.z:.2f}), size=({p.placed_w:.2f}, {p.placed_h:.2f}, {p.placed_d:.2f})")

# Test 3: Very small loads
print("\n" + "=" * 60)
print("Test 3: 10 tiny loads (0.5m x 0.5m x 0.5m each, 50kg each)")
print("=" * 60)
loads3 = [LoadSpec(
    id=3, type="cube", length_m=0.5, width_m=0.5, height_m=0.5,
    weight_kg=50, quantity=10, fragile=False, stackable=True,
    hazmat_class=None, diameter_m=None,
)]

result3 = run_optimization(v, loads3)
print(f"Result: {len(result3.placements)}/{10} loads placed")
print(f"Violations: {len(result3.violations)}")
