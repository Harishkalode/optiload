"""3D bin packing optimization engine.

Deterministic algorithm: same input -> same output.
First-fit-decreasing with 3D grid scanning and constraint validation.
"""

from app.core.optimization.types import (
    LoadPlacement,
    LoadSpec,
    OptimizationResult,
    VehicleSpec,
)
from app.core.optimization.constraints import PackingConstraints
from app.core.optimization.aar_rules import (
    check_collisions,
    compute_metrics,
    validate_axle_loads,
    validate_combined_cg,
    validate_hazmat_separation,
    validate_lateral_balance,
    validate_load_bounds,
    validate_longitudinal_balance,
)


def expand_loads(loads: list[LoadSpec]) -> list[LoadSpec]:
    expanded = []
    for load in loads:
        for _ in range(load.quantity):
            expanded.append(LoadSpec(
                id=load.id, type=load.type,
                length_m=load.length_m, width_m=load.width_m, height_m=load.height_m,
                weight_kg=load.weight_kg, quantity=1,
                fragile=load.fragile, stackable=load.stackable,
                hazmat_class=load.hazmat_class, diameter_m=load.diameter_m,
            ))
    return expanded


def _get_dims(load: LoadSpec) -> tuple[float, float, float]:
    if load.type in ("cylinder", "paper_roll", "coil"):
        d = load.diameter_m or min(load.length_m, load.width_m)
        return (d, d, load.length_m)
    return (load.length_m, load.height_m, load.width_m)


def place_loads_3d(vehicle, loads, constraints=None):
    print(f"  [PLACE] Expanding {len(loads)} load specs...")
    if isinstance(constraints, dict):
        constraints = PackingConstraints(**{k: v for k, v in constraints.items() if k in PackingConstraints.__dataclass_fields__})
    constraints = constraints or PackingConstraints()
    expanded = expand_loads(loads)
    print(f"  [PLACE] Expanded to {len(expanded)} individual items")
    if constraints.priority_order:
        expanded.sort(key=lambda l: l.weight_kg, reverse=True)
    else:
        expanded.sort(key=lambda l: (l.weight_kg, l.length_m * l.width_m * l.height_m), reverse=True)

    placements = []
    occupied = []
    v_len, v_wid, v_ht = vehicle.length_m, vehicle.width_m, vehicle.height_m
    eps = 0.001
    doorway_start = v_len * (1 - constraints.doorway_zone_ratio)

    for idx, load in enumerate(expanded):
        w, h, d = _get_dims(load)
        placed = False
        forced_orientation = constraints.orientation_forced.get(load.id)

        orientations = [(False, (w, h, d)), (True, (d, h, w))]
        if forced_orientation == "vertical" and w != d:
            orientations = [(True, (d, h, w))]
        elif forced_orientation == "horizontal" and w != d:
            orientations = [(False, (w, h, d))]

        for rotated, (lw, lh, ld) in orientations:
            if lw > v_len + eps or ld > v_wid + eps or lh > v_ht + eps:
                continue

            y_candidates = sorted({0.0, *(
                round(ye, 3) for _, _, _, ye, _, _ in occupied if ye + lh <= v_ht + eps
            )})

            for y in y_candidates:
                # CONSTRAINT: Fragile no-stack
                if load.fragile and constraints.fragile_no_stack and y > eps:
                    break
                # CONSTRAINT: Non-stackable
                if not load.stackable and y > eps:
                    break
                # CONSTRAINT: Max stacking layers
                layer = int(y / max(h, 0.01))
                if layer >= constraints.max_stacking_layers:
                    break

                x_positions = _centered_positions_x(lw, v_len)
                for x in x_positions:
                    if x + lw > v_len + eps:
                        continue
                    # CONSTRAINT: Doorway single layer
                    if constraints.doorway_single_layer and x + lw > doorway_start:
                        if y > eps:
                            continue
                    # CONSTRAINT: Must not touch door
                    if constraints.must_not_touch_door and load.id in constraints.must_not_touch_door:
                        if x + lw > doorway_start - 0.1:
                            continue

                    z_positions = _centered_positions_z(ld, v_wid)
                    for z in z_positions:
                        if z + ld > v_wid + eps:
                            continue
                        if _fits(x, y, z, lw, lh, ld, occupied, eps):
                            # CONSTRAINT: Roll-to-roll contact
                            if load.type in ("cylinder", "paper_roll", "coil") and y < eps:
                                if not _has_roll_contact(x, z, lw, ld, occupied, constraints.min_roll_contact_m):
                                    continue
                            placements.append(LoadPlacement(
                                load_id=load.id,
                                x=round(x, 3), y=round(y, 3), z=round(z, 3),
                                rx=0, ry=0, rz=0, rotated=rotated,
                                placed_w=lw, placed_h=lh, placed_d=ld,
                            ))
                            occupied.append((x, x + lw, y, y + lh, z, z + ld))
                            placed = True
                            break
                    if placed:
                        break
                if placed:
                    break
            if placed:
                break

        if (idx + 1) % 10 == 0 or idx == len(expanded) - 1:
            print(f"  [PLACE] Placed {idx + 1}/{len(expanded)} items")

    print(f"  [PLACE] Final: {len(placements)}/{len(expanded)} items placed")
    return placements


def _has_roll_contact(x, z, lw, ld, occupied, min_contact):
    """Check if a roll has adjacent roll contact for force transfer."""
    if min_contact <= 0:
        return True
    for ox1, ox2, oy1, oy2, oz1, oz2 in occupied:
        if oy1 > 0.01:
            continue
        x_overlap = max(0, min(x + lw, ox2) - max(x, ox1))
        z_overlap = max(0, min(z + ld, oz2) - max(z, oz1))
        if x_overlap >= min_contact or z_overlap >= min_contact:
            return True
    return len(occupied) == 0

    print(f"  [PLACE] Final: {len(placements)}/{len(expanded)} items placed")
    return placements


def _centered_positions_x(load_len: float, vehicle_len: float) -> list[float]:
    """Generate x positions from center outward for longitudinal balance."""
    step = load_len
    center = (vehicle_len - load_len) / 2
    positions = [center]
    offset = step
    while center - offset >= -0.001 or center + offset + load_len <= vehicle_len + 0.001:
        if center + offset + load_len <= vehicle_len + 0.001:
            positions.append(center + offset)
        if center - offset >= -0.001:
            positions.append(center - offset)
        offset += step
    return [max(0, p) for p in positions]


def _centered_positions_z(load_depth: float, vehicle_width: float) -> list[float]:
    """Generate z positions from center outward for lateral balance."""
    step = load_depth
    center = (vehicle_width - load_depth) / 2
    positions = [center]
    offset = step
    while center - offset >= -0.001 or center + offset + load_depth <= vehicle_width + 0.001:
        if center + offset + load_depth <= vehicle_width + 0.001:
            positions.append(center + offset)
        if center - offset >= -0.001:
            positions.append(center - offset)
        offset += step
    return [max(0, p) for p in positions]


def _fits(x, y, z, w, h, d, occupied, eps):
    for ox1, ox2, oy1, oy2, oz1, oz2 in occupied:
        if x + w <= ox1 + eps or ox2 - eps <= x:
            continue
        if y + h <= oy1 + eps or oy2 - eps <= y:
            continue
        if z + d <= oz1 + eps or oz2 - eps <= z:
            continue
        return False
    return True


def balance_cg(vehicle, placements, load_weights):
    if not placements:
        return placements
    total = sum(load_weights.get(p.load_id, 0) for p in placements)
    if total == 0:
        return placements
    # Use center of each load for CG calculation
    cg_x = sum(
        load_weights.get(p.load_id, 0) * (p.x + (p.placed_w or 1.0) / 2)
        for p in placements
    ) / total
    offset = vehicle.length_m / 2 - cg_x
    if abs(offset) > 0.05:
        result = []
        for p in placements:
            pw = p.placed_w or 1.0
            new_x = max(0, min(vehicle.length_m - pw, p.x + offset))
            result.append(LoadPlacement(
                load_id=p.load_id, x=round(new_x, 3),
                y=p.y, z=p.z, rx=p.rx, ry=p.ry, rz=p.rz, rotated=p.rotated,
                placed_w=p.placed_w, placed_h=p.placed_h, placed_d=p.placed_d,
            ))
        print(f"  [BALANCE] CG shifted by {offset:.3f}m")
        return result
    print(f"  [BALANCE] CG already balanced (offset {offset:.3f}m)")
    return placements


def run_optimization(vehicle, loads, constraints=None):
    print(f"\n{'='*60}")
    print(f"  OPTIMIZATION START")
    print(f"  Vehicle: {vehicle.type} #{vehicle.id} ({vehicle.length_m}x{vehicle.width_m}x{vehicle.height_m}m, cap={vehicle.capacity_kg}kg)")
    print(f"  Loads: {len(loads)} specs, total qty={sum(l.quantity for l in loads)}")
    print(f"{'='*60}")
    if isinstance(constraints, dict):
        constraints = PackingConstraints(**{k: v for k, v in constraints.items() if k in PackingConstraints.__dataclass_fields__})
    constraints = constraints or PackingConstraints()

    print("\n[Phase 1] Placing loads...")
    placements = place_loads_3d(vehicle, loads, constraints)

    print("\n[Phase 2] Balancing CG...")
    load_weights = {l.id: l.weight_kg for l in loads}
    placements = balance_cg(vehicle, placements, load_weights)

    print("\n[Phase 3] Computing metrics...")
    load_dims = {l.id: _get_dims(l) for l in loads}
    metrics = compute_metrics(vehicle, placements, load_weights, load_dims)

    print("\n[Phase 4] Validating AAR rules...")
    violations, warnings = [], []
    for v in validate_combined_cg(vehicle, placements, load_weights):
        (violations if v.severity == "error" else warnings).append(v)
    for v in validate_axle_loads(vehicle, placements, load_weights):
        (violations if v.severity == "error" else warnings).append(v)
    for v in validate_lateral_balance(vehicle, placements, load_weights):
        (violations if v.severity == "error" else warnings).append(v)
    for v in validate_longitudinal_balance(vehicle, placements, load_weights):
        (violations if v.severity == "error" else warnings).append(v)
    for v in validate_load_bounds(vehicle, placements, load_dims):
        violations.append(v)
    for v in check_collisions(placements, load_dims):
        violations.append(v)
    for v in validate_hazmat_separation(placements, {l.id: l.hazmat_class for l in loads}):
        violations.append(v)

    print("\n[Phase 4b] Material stability analysis...")
    from app.core.optimization.materials import analyze_stability
    material_analysis = analyze_stability(placements, loads, vehicle)

    print("\n[Phase 4c] Compression analysis...")
    from app.core.optimization.compression import analyze_compression
    compression_analysis = analyze_compression(placements, load_weights, loads)

    print("\n[Phase 4d] Weight distribution analysis...")
    from app.core.optimization.aar_rules import analyze_weight_distribution
    weight_dist = analyze_weight_distribution(vehicle, placements, load_weights)

    print("\n[Phase 5] Filling voids...")
    from app.core.optimization.fillers import detect_voids, fill_voids
    voids = detect_voids(placements, vehicle, max_gap=constraints.max_void_gap_m)
    filler_placements = fill_voids(voids, placements, vehicle)

    print("\n[Phase 6] Generating loading sequence...")
    from app.core.optimization.sequencing import generate_loading_sequence
    loading_sequence = generate_loading_sequence(placements, vehicle)

    print(f"\n  [RESULT] {len(placements)} placements, {len(violations)} violations, {len(warnings)} warnings")
    print(f"  [METRICS] Vol: {metrics.volume_utilization:.1%}, Wt: {metrics.weight_utilization:.1%}")
    print(f"  [METRICS] CG: ({metrics.cg_x:.2f}, {metrics.cg_y:.2f}, {metrics.cg_z:.2f})")
    print(f"  [FILLERS] {len(filler_placements)} fillers placed, {len(voids)} voids detected")
    print(f"{'='*60}\n")

    return OptimizationResult(
        placements=placements, metrics=metrics, violations=violations, warnings=warnings,
        extra_data={
            "material_analysis": material_analysis,
            "compression_analysis": compression_analysis,
            "weight_distribution": weight_dist,
            "fillers": filler_placements,
            "void_count": len(voids),
            "void_volume": sum(v["volume"] for v in voids),
            "filled_volume": sum(f["length"] * f["width"] * f["height"] for f in filler_placements),
            "loading_sequence": loading_sequence,
        },
    )
