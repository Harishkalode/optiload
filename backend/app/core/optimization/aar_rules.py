"""AAR compliance rules for railcar load optimization.

Based on AAR Open Top Loading Rules and Field Guide.
All distances in meters, weights in kg unless noted.
"""

from app.core.optimization.types import (
    AARViolation,
    LoadPlacement,
    OptimizationMetrics,
    VehicleSpec,
)


# ── Constants ────────────────────────────────────────────────────────────────
# AAR CG limit: combined CG height must not exceed 98 inches (2.489 m) above rail
CG_HEIGHT_LIMIT_IN = 98
CG_HEIGHT_LIMIT_M = CG_HEIGHT_LIMIT_IN * 0.0254

# Standard rail height: platform ~1.1 m above rail
PLATFORM_HEIGHT_M = 1.1

# Axle load limits (typical, varies by class)
DEFAULT_AXLE_LIMIT_KG = 22500  # ~50,000 lbs per axle

# Lateral imbalance thresholds
LATERAL_IMBALANCE_WARN = 0.05   # 5%
LATERAL_IMBALANCE_ERROR = 0.10  # 10%

# Longitudinal imbalance thresholds
LONG_IMBALANCE_WARN = 0.10
LONG_IMBALANCE_ERROR = 0.20

# Endwall force limit (simplified)
ENDWALL_FORCE_LIMIT_N = 100000

# Shock G-force for switching impact
SHOCK_G = 4.0

# Minimum gap between loads (m)
MIN_GAP_M = 0.05


def validate_combined_cg(
    vehicle: VehicleSpec,
    placements: list[LoadPlacement],
    load_weights: dict[int, float],
) -> list[AARViolation]:
    """Validate combined CG height does not exceed AAR limit."""
    total_weight = sum(load_weights.get(p.load_id, 0) for p in placements)
    if total_weight == 0:
        return []

    tare = vehicle.tare_weight_kg or 0
    empty_cg = (vehicle.empty_cg_height_in or 45) * 0.0254  # inches to meters

    weighted_cg = sum(
        load_weights.get(p.load_id, 0) * (p.y + PLATFORM_HEIGHT_M)
        for p in placements
    )
    combined_cg = (weighted_cg + tare * empty_cg) / (total_weight + tare)

    violations: list[AARViolation] = []
    if combined_cg > CG_HEIGHT_LIMIT_M:
        violations.append(AARViolation(
            rule="aar_combined_cg",
            message=f"Combined CG height {combined_cg:.3f}m exceeds AAR limit {CG_HEIGHT_LIMIT_M:.3f}m ({CG_HEIGHT_LIMIT_IN}in)",
            severity="error",
            details={"cg_m": combined_cg, "limit_m": CG_HEIGHT_LIMIT_M},
        ))
    return violations


def validate_axle_loads(
    vehicle: VehicleSpec,
    placements: list[LoadPlacement],
    load_weights: dict[int, float],
    axle_limit: float | None = None,
) -> list[AARViolation]:
    """Validate individual axle loads do not exceed limits."""
    limit = axle_limit or DEFAULT_AXLE_LIMIT_KG
    axles = vehicle.axle_positions or []
    if not axles or not placements:
        return []

    axle_loads = [0.0] * len(axles)
    total_weight = sum(load_weights.get(p.load_id, 0) for p in placements)
    tare = vehicle.tare_weight_kg or 0
    tare_per_axle = tare / len(axles) if axles else 0

    for p in placements:
        w = load_weights.get(p.load_id, 0)
        load_center_x = p.x + (p.placed_w or 0) / 2
        factors = [max(0, 1 - abs(load_center_x - a) / (vehicle.length_m / 2)) for a in axles]
        denom = sum(factors)
        if denom > 0:
            for i, f in enumerate(factors):
                axle_loads[i] += w * f / denom

    violations: list[AARViolation] = []
    for i, load in enumerate(axle_loads):
        total = load + tare_per_axle
        if total > limit:
            violations.append(AARViolation(
                rule="aar_axle_load",
                message=f"Axle {i+1} load {total:.0f}kg exceeds limit {limit:.0f}kg",
                severity="error",
                details={"axle": i, "load_kg": total, "limit_kg": limit},
            ))
    return violations


def validate_lateral_balance(
    vehicle: VehicleSpec,
    placements: list[LoadPlacement],
    load_weights: dict[int, float],
) -> list[AARViolation]:
    """Validate lateral (side-to-side) weight distribution."""
    total_weight = sum(load_weights.get(p.load_id, 0) for p in placements)
    if total_weight == 0:
        return []

    half_width = vehicle.width_m / 2
    left_weight = 0.0
    right_weight = 0.0
    for p in placements:
        w = load_weights.get(p.load_id, 0)
        load_center = p.z + (p.placed_d or 0) / 2
        if abs(load_center - half_width) < 0.01:
            left_weight += w / 2
            right_weight += w / 2
        elif load_center < half_width:
            left_weight += w
        else:
            right_weight += w
    imbalance = abs(left_weight - right_weight) / total_weight if total_weight > 0 else 0

    violations: list[AARViolation] = []
    if imbalance > LATERAL_IMBALANCE_ERROR:
        violations.append(AARViolation(
            rule="aar_lateral_balance",
            message=f"Lateral imbalance {imbalance:.1%} exceeds error threshold {LATERAL_IMBALANCE_ERROR:.0%}",
            severity="error",
            details={"imbalance_pct": imbalance},
        ))
    elif imbalance > LATERAL_IMBALANCE_WARN:
        violations.append(AARViolation(
            rule="aar_lateral_balance",
            message=f"Lateral imbalance {imbalance:.1%} exceeds warning threshold {LATERAL_IMBALANCE_WARN:.0%}",
            severity="warning",
            details={"imbalance_pct": imbalance},
        ))
    return violations


def validate_longitudinal_balance(
    vehicle: VehicleSpec,
    placements: list[LoadPlacement],
    load_weights: dict[int, float],
) -> list[AARViolation]:
    """Validate longitudinal (front-to-back) weight distribution."""
    total_weight = sum(load_weights.get(p.load_id, 0) for p in placements)
    if total_weight == 0:
        return []

    half_length = vehicle.length_m / 2
    front_weight = 0.0
    rear_weight = 0.0
    for p in placements:
        w = load_weights.get(p.load_id, 0)
        load_center = p.x + (p.placed_w or 0) / 2
        if abs(load_center - half_length) < 0.01:
            # Load centered on centerline — split weight
            front_weight += w / 2
            rear_weight += w / 2
        elif load_center < half_length:
            front_weight += w
        else:
            rear_weight += w
    imbalance = abs(front_weight - rear_weight) / total_weight if total_weight > 0 else 0

    violations: list[AARViolation] = []
    if imbalance > LONG_IMBALANCE_ERROR:
        violations.append(AARViolation(
            rule="aar_longitudinal_balance",
            message=f"Longitudinal imbalance {imbalance:.1%} exceeds error threshold {LONG_IMBALANCE_ERROR:.0%}",
            severity="error",
            details={"imbalance_pct": imbalance},
        ))
    elif imbalance > LONG_IMBALANCE_WARN:
        violations.append(AARViolation(
            rule="aar_longitudinal_balance",
            message=f"Longitudinal imbalance {imbalance:.1%} exceeds warning threshold {LONG_IMBALANCE_WARN:.0%}",
            severity="warning",
            details={"imbalance_pct": imbalance},
        ))
    return violations


def validate_load_bounds(
    vehicle: VehicleSpec,
    placements: list[LoadPlacement],
    load_dims: dict[int, tuple[float, float, float]] | None = None,
) -> list[AARViolation]:
    """Validate all loads are within vehicle bounds."""
    violations: list[AARViolation] = []
    for p in placements:
        lw = p.placed_w or (load_dims.get(p.load_id, (2.0, 2.0, 1.0))[0] if load_dims else 2.0)
        lh = p.placed_h or (load_dims.get(p.load_id, (2.0, 2.0, 1.0))[1] if load_dims else 2.0)
        ld = p.placed_d or (load_dims.get(p.load_id, (2.0, 2.0, 1.0))[2] if load_dims else 1.0)
        if p.x < 0 or p.x + lw > vehicle.length_m:
            violations.append(AARViolation(
                rule="load_bounds",
                message=f"Load {p.load_id} exceeds vehicle length bounds",
                severity="error",
            ))
        if p.z < 0 or p.z + ld > vehicle.width_m:
            violations.append(AARViolation(
                rule="load_bounds",
                message=f"Load {p.load_id} exceeds vehicle width bounds",
                severity="error",
            ))
        if p.y < 0 or p.y + lh > vehicle.height_m:
            violations.append(AARViolation(
                rule="load_bounds",
                message=f"Load {p.load_id} exceeds vehicle height bounds",
                severity="error",
            ))
    return violations


def check_collisions(
    placements: list[LoadPlacement],
    load_dims: dict[int, tuple[float, float, float]],
    gap: float = 0.0,
) -> list[AARViolation]:
    """Check for overlapping loads (AABB collision)."""
    violations: list[AARViolation] = []
    eps = 1e-6
    for i, a in enumerate(placements):
        aw = a.placed_w or load_dims.get(a.load_id, (1, 1, 1))[0]
        ah = a.placed_h or load_dims.get(a.load_id, (1, 1, 1))[1]
        ad = a.placed_d or load_dims.get(a.load_id, (1, 1, 1))[2]
        for j in range(i + 1, len(placements)):
            b = placements[j]
            bw = b.placed_w or load_dims.get(b.load_id, (1, 1, 1))[0]
            bh = b.placed_h or load_dims.get(b.load_id, (1, 1, 1))[1]
            bd = b.placed_d or load_dims.get(b.load_id, (1, 1, 1))[2]
            overlap_x = (a.x + aw + gap > b.x + eps) and (b.x + bw + gap > a.x + eps)
            overlap_y = (a.y + ah + gap > b.y + eps) and (b.y + bh + gap > a.y + eps)
            overlap_z = (a.z + ad + gap > b.z + eps) and (b.z + bd + gap > a.z + eps)
            if overlap_x and overlap_y and overlap_z:
                violations.append(AARViolation(
                    rule="collision",
                    message=f"Placement {i} collides with placement {j}",
                    severity="error",
                ))
    return violations


def validate_hazmat_separation(
    placements: list[LoadPlacement],
    load_hazmat: dict[int, str | None],
) -> list[AARViolation]:
    """Validate HAZMAT loads are properly separated."""
    violations: list[AARViolation] = []
    hazmat_loads = [p for p in placements if load_hazmat.get(p.load_id)]
    for i, a in enumerate(hazmat_loads):
        for j, b in enumerate(hazmat_loads):
            if j <= i:
                continue
            dist = ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2) ** 0.5
            if dist < 3.0:
                violations.append(AARViolation(
                    rule="hazmat_separation",
                    message=f"HAZMAT loads {a.load_id} and {b.load_id} too close ({dist:.1f}m)",
                    severity="error",
                ))
    return violations


def compute_metrics(
    vehicle: VehicleSpec,
    placements: list[LoadPlacement],
    load_weights: dict[int, float],
    load_dims: dict[int, tuple[float, float, float]],
) -> OptimizationMetrics:
    """Compute optimization metrics."""
    total_weight = sum(load_weights.get(p.load_id, 0) for p in placements)
    tare = vehicle.tare_weight_kg or 0

    if total_weight > 0:
        cg_x = sum(load_weights.get(p.load_id, 0) * p.x for p in placements) / total_weight
        cg_y = sum(load_weights.get(p.load_id, 0) * (p.y + PLATFORM_HEIGHT_M) for p in placements) / total_weight
        cg_z = sum(load_weights.get(p.load_id, 0) * p.z for p in placements) / total_weight
    else:
        cg_x = cg_y = cg_z = 0

    # Axle loads
    axles = vehicle.axle_positions or []
    axle_loads = []
    if axles and total_weight > 0:
        for ax in axles:
            load = sum(
                load_weights.get(p.load_id, 0) * max(0, 1 - abs(p.x - ax) / (vehicle.length_m / 2))
                for p in placements
            )
            axle_loads.append(load + (tare / len(axles) if axles else 0))

    # Imbalances
    half_length = vehicle.length_m / 2
    half_width = vehicle.width_m / 2
    front_w = 0.0
    rear_w = 0.0
    left_w = 0.0
    right_w = 0.0
    for p in placements:
        w = load_weights.get(p.load_id, 0)
        cx = p.x + (p.placed_w or 0) / 2
        cz = p.z + (p.placed_d or 0) / 2
        if abs(cx - half_length) < 0.01:
            front_w += w / 2; rear_w += w / 2
        elif cx < half_length:
            front_w += w
        else:
            rear_w += w
        if abs(cz - half_width) < 0.01:
            left_w += w / 2; right_w += w / 2
        elif cz < half_width:
            left_w += w
        else:
            right_w += w
    long_imb = abs(front_w - rear_w) / total_weight if total_weight > 0 else 0
    lat_imb = abs(left_w - right_w) / total_weight if total_weight > 0 else 0

    # Utilization
    vehicle_vol = vehicle.length_m * vehicle.width_m * vehicle.height_m
    load_vol = sum(
        (p.placed_w or load_dims.get(p.load_id, (0, 0, 0))[0]) *
        (p.placed_h or load_dims.get(p.load_id, (0, 0, 0))[1]) *
        (p.placed_d or load_dims.get(p.load_id, (0, 0, 0))[2])
        for p in placements
    )
    vol_util = load_vol / vehicle_vol if vehicle_vol > 0 else 0
    wt_util = total_weight / vehicle.capacity_kg if vehicle.capacity_kg > 0 else 0

    return OptimizationMetrics(
        cg_x=cg_x, cg_y=cg_y, cg_z=cg_z,
        axle_loads=axle_loads,
        lateral_imbalance_pct=lat_imb,
        longitudinal_imbalance_pct=long_imb,
        volume_utilization=vol_util,
        weight_utilization=wt_util,
    )


def analyze_weight_distribution(vehicle, placements, load_weights):
    """Return detailed weight distribution analysis."""
    total = sum(load_weights.get(p.load_id, 0) for p in placements)
    half_l, half_w = vehicle.length_m / 2, vehicle.width_m / 2

    left_w = right_w = front_w = rear_w = 0.0
    for p in placements:
        w = load_weights.get(p.load_id, 0)
        cx = p.x + (p.placed_w or 0) / 2
        cz = p.z + (p.placed_d or 0) / 2
        if abs(cx - half_l) < 0.01:
            front_w += w / 2; rear_w += w / 2
        elif cx < half_l:
            front_w += w
        else:
            rear_w += w
        if abs(cz - half_w) < 0.01:
            left_w += w / 2; right_w += w / 2
        elif cz < half_w:
            left_w += w
        else:
            right_w += w

    cg_x = sum(load_weights.get(p.load_id, 0) * (p.x + (p.placed_w or 0) / 2) for p in placements) / max(total, 0.001)
    cg_y = sum(load_weights.get(p.load_id, 0) * (p.y + (p.placed_h or 0) / 2) for p in placements) / max(total, 0.001)
    cg_z = sum(load_weights.get(p.load_id, 0) * (p.z + (p.placed_d or 0) / 2) for p in placements) / max(total, 0.001)

    return {
        "cg_x": round(cg_x, 3), "cg_y": round(cg_y, 3), "cg_z": round(cg_z, 3),
        "left_pct": round(left_w / max(total, 0.001) * 100, 1),
        "right_pct": round(right_w / max(total, 0.001) * 100, 1),
        "front_pct": round(front_w / max(total, 0.001) * 100, 1),
        "rear_pct": round(rear_w / max(total, 0.001) * 100, 1),
        "total_weight": round(total, 1),
    }
