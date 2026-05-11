from app.core.optimization.types import VehicleSpec, LoadPlacement
from app.core.optimization.aar_rules import validate_combined_cg


def make_vehicle():
    return VehicleSpec(
        id=1, type="boxcar",
        length_m=20.0, width_m=3.2, height_m=2.4,
        capacity_kg=80000, tare_weight_kg=20000, plate_type=None,
        truck_center_front_m=2.5, truck_center_rear_m=17.5,
        empty_cg_height_in=45, axle_positions=[2.5, 7.5, 12.5, 17.5],
    )


def test_cg_center_balanced_basic():
    v = make_vehicle()
    p1 = LoadPlacement(load_id=1, x=4.0, y=0.0, z=0.0, orientation="vertical", placed_w=2, placed_h=1, placed_d=1)
    p2 = LoadPlacement(load_id=2, x=14.0, y=0.0, z=0.0, orientation="vertical", placed_w=2, placed_h=1, placed_d=1)
    weights = {1: 10000, 2: 10000}
    res = validate_combined_cg(v, [p1, p2], weights)
    assert isinstance(res, list)


def test_balance_cg_lateral_adjustment():
    from app.core.optimization.engine import balance_cg
    from app.core.optimization.types import VehicleSpec, LoadPlacement
    # Build a very simple vehicle
    v = VehicleSpec(
        id=1, type="boxcar", length_m=20.0, width_m=3.2, height_m=2.4,
        capacity_kg=80000, tare_weight_kg=20000, plate_type=None,
        truck_center_front_m=2.5, truck_center_rear_m=17.5,
        empty_cg_height_in=45, axle_positions=[2.5, 7.5, 12.5, 17.5],
    )
    # Two loads with same weight, placed on opposite sides of the centerline
    p1 = LoadPlacement(load_id=1, x=1.0, y=0.0, z=0.0, orientation="vertical", placed_w=2, placed_h=1, placed_d=1)
    p2 = LoadPlacement(load_id=2, x=9.0, y=0.0, z=2.0, orientation="vertical", placed_w=2, placed_h=1, placed_d=1)
    placements = [p1, p2]
    weights = {1: 5000, 2: 5000}
    out = balance_cg(v, placements, weights)
    assert isinstance(out, list)