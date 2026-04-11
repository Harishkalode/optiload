"""Smart auto-correction engine for fixing invalid layouts."""

from dataclasses import dataclass
from copy import deepcopy


@dataclass
class CorrectionResult:
    original_placements: list
    corrected_placements: list
    moves: list[dict]
    improvement_score: float
    violations_before: int
    violations_after: int


def auto_correct(vehicle, placements, load_weights, load_specs, max_iterations=50):
    """Fix violations with minimal movement."""
    from app.core.optimization.aar_rules import (
        validate_lateral_balance, validate_longitudinal_balance,
        validate_combined_cg, check_collisions, validate_load_bounds,
    )

    def get_violations(pls):
        v = []
        v.extend(validate_lateral_balance(vehicle, pls, load_weights))
        v.extend(validate_longitudinal_balance(vehicle, pls, load_weights))
        v.extend(validate_combined_cg(vehicle, pls, load_weights))
        v.extend(check_collisions(pls, {}))
        v.extend(validate_load_bounds(vehicle, pls, {}))
        return v

    initial_violations = get_violations(placements)
    if not initial_violations:
        return CorrectionResult(placements, placements, [], 1.0, 0, 0)

    corrected = deepcopy(placements)
    moves = []
    v_len, v_wid, v_ht = vehicle.length_m, vehicle.width_m, vehicle.height_m

    for iteration in range(max_iterations):
        violations = get_violations(corrected)
        if not violations:
            break

        for v in violations:
            if "balance" in v.rule:
                corrected, new_moves = _fix_balance(vehicle, corrected, load_weights, v, v_len, v_wid)
                moves.extend(new_moves)
            elif v.rule == "collision":
                corrected, new_moves = _fix_collision(vehicle, corrected, load_weights, v)
                moves.extend(new_moves)
            elif v.rule == "load_bounds":
                corrected, new_moves = _fix_bounds(vehicle, corrected, v)
                moves.extend(new_moves)

    final_violations = get_violations(corrected)
    improvement = 1.0 - len(final_violations) / max(len(initial_violations), 1)

    return CorrectionResult(
        placements, corrected, moves, round(improvement, 3),
        len(initial_violations), len(final_violations),
    )


def _fix_balance(vehicle, placements, load_weights, violation, v_len, v_wid):
    """Shift loads toward center to fix balance."""
    moves = []
    total = sum(load_weights.get(p.load_id, 0) for p in placements)
    if total == 0:
        return placements, moves

    half_l = v_len / 2
    half_w = v_wid / 2

    for p in placements:
        w = load_weights.get(p.load_id, 0)
        if w == 0:
            continue
        pw = p.placed_w or 1.0
        pd = p.placed_d or 1.0
        cx = p.x + pw / 2
        cz = p.z + pd / 2

        dx = 0.0
        dz = 0.0
        if "longitudinal" in violation.rule:
            dx = (half_l - cx) * 0.3
        elif "lateral" in violation.rule:
            dz = (half_w - cz) * 0.3

        if abs(dx) > 0.01 or abs(dz) > 0.01:
            new_x = max(0, min(v_len - pw, p.x + dx))
            new_z = max(0, min(v_wid - pd, p.z + dz))
            if abs(new_x - p.x) > 0.001 or abs(new_z - p.z) > 0.001:
                moves.append({
                    "load_id": p.load_id,
                    "from": {"x": p.x, "y": p.y, "z": p.z},
                    "to": {"x": new_x, "y": p.y, "z": new_z},
                })
                p.x = new_x
                p.z = new_z

    return placements, moves


def _fix_collision(vehicle, placements, load_weights, violation):
    """Move colliding loads apart."""
    moves = []
    # Parse which placements collide from the message
    parts = violation.message.split()
    try:
        idx_a = int(parts[1])
        idx_b = int(parts[4])
        if idx_a < len(placements) and idx_b < len(placements):
            a = placements[idx_a]
            b = placements[idx_b]
            # Move the lighter one
            wa = load_weights.get(a.load_id, 0)
            wb = load_weights.get(b.load_id, 0)
            target = a if wa <= wb else b
            pw = target.placed_w or 1.0
            pd = target.placed_d or 1.0
            new_x = max(0, min(vehicle.length_m - pw, target.x - 0.5))
            if abs(new_x - target.x) > 0.001:
                moves.append({
                    "load_id": target.load_id,
                    "from": {"x": target.x, "y": target.y, "z": target.z},
                    "to": {"x": new_x, "y": target.y, "z": target.z},
                })
                target.x = new_x
    except (ValueError, IndexError):
        pass
    return placements, moves


def _fix_bounds(vehicle, placements, violation):
    """Move loads back within vehicle bounds."""
    moves = []
    parts = violation.message.split()
    try:
        load_id = int(parts[1])
        for p in placements:
            if p.load_id == load_id:
                pw = p.placed_w or 1.0
                pd = p.placed_d or 1.0
                ph = p.placed_h or 1.0
                new_x = max(0, min(vehicle.length_m - pw, p.x))
                new_z = max(0, min(vehicle.width_m - pd, p.z))
                new_y = max(0, min(vehicle.height_m - ph, p.y))
                if abs(new_x - p.x) > 0.001 or abs(new_z - p.z) > 0.001 or abs(new_y - p.y) > 0.001:
                    moves.append({
                        "load_id": p.load_id,
                        "from": {"x": p.x, "y": p.y, "z": p.z},
                        "to": {"x": new_x, "y": new_y, "z": new_z},
                    })
                    p.x = new_x
                    p.y = new_y
                    p.z = new_z
                break
    except (ValueError, IndexError):
        pass
    return placements, moves
