"""Void detection and filler placement system."""

from dataclasses import dataclass


@dataclass
class FillerSpec:
    type: str
    length_m: float
    width_m: float
    height_m: float
    crush_strength_pa: float
    min_gap_m: float
    max_gap_m: float


FILLER_TYPES = {
    "airbag": FillerSpec("airbag", 1.0, 0.5, 0.3, 107730, 0.05, 0.5),
    "foam_panel": FillerSpec("foam_panel", 1.0, 0.5, 0.1, 15000, 0.02, 0.15),
    "honeycomb": FillerSpec("honeycomb", 1.0, 0.5, 0.2, 20000, 0.05, 0.3),
}


def detect_voids(placements, vehicle, max_gap=0.3):
    """Find all void spaces between placed loads using gap analysis."""
    voids = []
    v_len, v_wid, v_ht = vehicle.length_m, vehicle.width_m, vehicle.height_m

    # Sort placements by x position
    sorted_x = sorted(placements, key=lambda p: p.x)
    sorted_z = sorted(placements, key=lambda p: p.z)
    sorted_y = sorted(placements, key=lambda p: p.y)

    # Check gaps between loads along X axis
    for i in range(len(sorted_x) - 1):
        a = sorted_x[i]
        b = sorted_x[i + 1]
        gap_start = a.x + (a.placed_w or 0)
        gap_end = b.x
        gap_size = gap_end - gap_start
        if 0.02 < gap_size <= max_gap:
            # Check if this gap spans across y and z
            y_min = min(a.y, b.y)
            y_max = max(a.y + (a.placed_h or 0), b.y + (b.placed_h or 0))
            z_min = min(a.z, b.z)
            z_max = max(a.z + (a.placed_d or 0), b.z + (b.placed_d or 0))
            voids.append({
                "x": gap_start, "y": y_min, "z": z_min,
                "length": gap_size, "width": z_max - z_min, "height": y_max - y_min,
                "volume": gap_size * (z_max - z_min) * (y_max - y_min),
                "is_doorway": gap_start > vehicle.length_m * 0.85,
            })

    # Check gaps along Z axis
    for i in range(len(sorted_z) - 1):
        a = sorted_z[i]
        b = sorted_z[i + 1]
        gap_start = a.z + (a.placed_d or 0)
        gap_end = b.z
        gap_size = gap_end - gap_start
        if 0.02 < gap_size <= max_gap:
            x_min = min(a.x, b.x)
            x_max = max(a.x + (a.placed_w or 0), b.x + (b.placed_w or 0))
            y_min = min(a.y, b.y)
            y_max = max(a.y + (a.placed_h or 0), b.y + (b.placed_h or 0))
            voids.append({
                "x": x_min, "y": y_min, "z": gap_start,
                "length": x_max - x_min, "width": gap_size, "height": y_max - y_min,
                "volume": (x_max - x_min) * gap_size * (y_max - y_min),
                "is_doorway": x_min > vehicle.length_m * 0.85,
            })

    # Check gaps above loads (vertical voids)
    for p in placements:
        top_y = p.y + (p.placed_h or 0)
        remaining_h = v_ht - top_y
        if remaining_h > 0.02 and remaining_h <= max_gap:
            voids.append({
                "x": p.x, "y": top_y, "z": p.z,
                "length": p.placed_w or 0, "width": p.placed_d or 0, "height": remaining_h,
                "volume": (p.placed_w or 0) * (p.placed_d or 0) * remaining_h,
                "is_doorway": p.x > vehicle.length_m * 0.85,
            })

    # Check front/back voids
    if sorted_x:
        first_x = sorted_x[0].x
        if first_x > 0.02:
            voids.append({
                "x": 0, "y": 0, "z": 0,
                "length": first_x, "width": v_wid, "height": v_ht,
                "volume": first_x * v_wid * v_ht,
                "is_doorway": False,
            })
        last_x_end = sorted_x[-1].x + (sorted_x[-1].placed_w or 0)
        rear_gap = v_len - last_x_end
        if rear_gap > 0.02:
            voids.append({
                "x": last_x_end, "y": 0, "z": 0,
                "length": rear_gap, "width": v_wid, "height": v_ht,
                "volume": rear_gap * v_wid * v_ht,
                "is_doorway": last_x_end > vehicle.length_m * 0.85,
            })

    return voids


def _is_occupied(x, y, z, placements, resolution):
    half = resolution / 2
    for p in placements:
        px1 = p.x - half
        px2 = p.x + (p.placed_w or 0) + half
        py1 = p.y - half
        py2 = p.y + (p.placed_h or 0) + half
        pz1 = p.z - half
        pz2 = p.z + (p.placed_d or 0) + half
        if px1 <= x <= px2 and py1 <= y <= py2 and pz1 <= z <= pz2:
            return True
    return False


def _expand_void(cx, cy, cz, placements, vehicle, resolution):
    """Expand from an empty cell to find the full void volume."""
    x_min, x_max = cx, cx + resolution
    y_min, y_max = cy, cy + resolution
    z_min, z_max = cz, cz + resolution

    # Expand in +X
    while x_max + resolution <= vehicle.length_m:
        if _is_occupied((x_max + resolution / 2), (y_min + y_max) / 2, (z_min + z_max) / 2, placements, resolution):
            break
        x_max += resolution

    # Expand in +Y
    while y_max + resolution <= vehicle.height_m:
        if _is_occupied((x_min + x_max) / 2, (y_max + resolution / 2), (z_min + z_max) / 2, placements, resolution):
            break
        y_max += resolution

    # Expand in +Z
    while z_max + resolution <= vehicle.width_m:
        if _is_occupied((x_min + x_max) / 2, (y_min + y_max) / 2, (z_max + resolution / 2), placements, resolution):
            break
        z_max += resolution

    length = x_max - x_min
    width = z_max - z_min
    height = y_max - y_min

    return {
        "x": x_min, "y": y_min, "z": z_min,
        "length": length, "width": width, "height": height,
        "volume": length * width * height,
        "is_doorway": x_min > vehicle.length_m * 0.85,
    }


def _deduplicate_voids(voids):
    """Remove overlapping voids, keeping the largest."""
    if not voids:
        return []
    sorted_voids = sorted(voids, key=lambda v: v["volume"], reverse=True)
    result = []
    for v in sorted_voids:
        overlaps = False
        for existing in result:
            if (_box_overlap(v, existing)):
                overlaps = True
                break
        if not overlaps:
            result.append(v)
    return result


def _box_overlap(a, b):
    return (a["x"] < b["x"] + b["length"] and a["x"] + a["length"] > b["x"] and
            a["y"] < b["y"] + b["height"] and a["y"] + a["height"] > b["y"] and
            a["z"] < b["z"] + b["width"] and a["z"] + a["width"] > b["z"])


def fill_voids(voids, placements, vehicle, filler_types=None):
    """Optimally fill voids with appropriate fillers."""
    filler_types = filler_types or FILLER_TYPES
    filler_placements = []

    sorted_voids = sorted(voids, key=lambda v: v["volume"], reverse=True)

    for void in sorted_voids:
        if void["length"] < 0.05 or void["width"] < 0.05 or void["height"] < 0.02:
            continue

        if void["is_doorway"]:
            continue

        best_filler = None
        best_score = -1
        for ftype, fspec in filler_types.items():
            if fspec.min_gap_m <= void["height"] <= fspec.max_gap_m:
                score = void["volume"] / max(fspec.length_m * fspec.width_m * fspec.height_m, 0.001)
                if score > best_score:
                    best_filler = ftype
                    best_score = score

        if best_filler:
            fspec = filler_types[best_filler]
            filler_placements.append({
                "type": best_filler,
                "x": round(void["x"], 3),
                "y": round(void["y"], 3),
                "z": round(void["z"], 3),
                "length": round(min(fspec.length_m, void["length"]), 3),
                "width": round(min(fspec.width_m, void["width"]), 3),
                "height": round(min(fspec.height_m, void["height"]), 3),
                "pressure_pa": round(_compute_filler_pressure(void, fspec), 1),
            })

    return filler_placements


def _compute_filler_pressure(void, fspec):
    contact_area = fspec.length_m * fspec.width_m
    return void["volume"] * 800 * 9.81 / max(contact_area, 0.001)
