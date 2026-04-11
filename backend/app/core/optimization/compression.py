"""Compression/deformation analysis for stacked loads."""

COMPRESSION_LIMITS = {
    "paper_roll": 50000,
    "cube": 15000,
    "cylinder": 80000,
    "pallet": 30000,
    "coil": 100000,
    "airbag": 107730,
    "honeycomb": 20000,
    "default": 25000,
}


def analyze_compression(placements, load_weights, load_specs, gravity=9.81):
    """Check if items are being crushed by weight above them."""
    results = []
    for p in placements:
        load = next((l for l in load_specs if l.id == p.load_id), None)
        if not load:
            continue

        pw = p.placed_w or 1.0
        ph = p.placed_h or 1.0
        pd = p.placed_d or 1.0

        above_loads = [
            other for other in placements
            if other.load_id != p.load_id
            and abs(other.x - p.x) < (pw + (other.placed_w or 0)) / 2
            and abs(other.z - p.z) < (pd + (other.placed_d or 0)) / 2
            and other.y > p.y + ph - 0.01
        ]

        weight_above = sum(load_weights.get(a.load_id, 0) for a in above_loads)
        contact_area = pw * pd
        pressure = (weight_above * gravity) / max(contact_area, 0.001)

        limit = COMPRESSION_LIMITS.get(load.type, COMPRESSION_LIMITS["default"])
        deformation_pct = min(100, (pressure / limit) * 100) if limit > 0 else 0
        risk = "safe" if deformation_pct < 50 else "warning" if deformation_pct < 80 else "critical"

        results.append({
            "load_id": p.load_id,
            "weight_above_kg": round(weight_above, 1),
            "pressure_pa": round(pressure, 1),
            "limit_pa": limit,
            "deformation_pct": round(deformation_pct, 1),
            "risk": risk,
        })
    return results
