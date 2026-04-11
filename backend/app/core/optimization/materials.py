"""Material properties and stability analysis."""

MATERIALS = {
    "paper_roll": {"friction_floor": 0.4, "friction_object": 0.3, "rolling_resistance": 0.02, "density_kg_m3": 800},
    "cube": {"friction_floor": 0.5, "friction_object": 0.4, "rolling_resistance": 0.0, "density_kg_m3": 200},
    "cylinder": {"friction_floor": 0.3, "friction_object": 0.2, "rolling_resistance": 0.02, "density_kg_m3": 7800},
    "pallet": {"friction_floor": 0.6, "friction_object": 0.5, "rolling_resistance": 0.0, "density_kg_m3": 600},
    "coil": {"friction_floor": 0.3, "friction_object": 0.2, "rolling_resistance": 0.015, "density_kg_m3": 7800},
    "default": {"friction_floor": 0.5, "friction_object": 0.4, "rolling_resistance": 0.0, "density_kg_m3": 500},
}


def analyze_stability(placements, load_specs, vehicle, gravity=9.81):
    """Per-object stability analysis based on material properties."""
    results = []
    for p in placements:
        load = next((l for l in load_specs if l.id == p.load_id), None)
        if not load:
            continue

        mat = MATERIALS.get(load.type, MATERIALS.get("default"))
        pw = p.placed_w or 1.0
        ph = p.placed_h or 1.0
        pd = p.placed_d or 1.0

        # Sliding risk: based on friction coefficient
        sliding_risk = max(0, min(100, (1 - mat["friction_floor"]) * 100))

        # Rolling risk (cylinders/coils only)
        rolling_risk = 0.0
        if load.type in ("cylinder", "paper_roll", "coil"):
            rolling_risk = min(100, mat["rolling_resistance"] * 1000)

        # Tipping risk: height-to-base ratio
        base_area = pw * pd
        tipping_risk = max(0, min(100, (ph / max(base_area, 0.01) - 1) * 30))

        # Stack stability: loads above this one
        loads_above = [
            other for other in placements
            if other.load_id != p.load_id
            and abs(other.x - p.x) < (pw + (other.placed_w or 0)) / 2
            and abs(other.z - p.z) < (pd + (other.placed_d or 0)) / 2
            and other.y > p.y + ph - 0.01
        ]
        stack_risk = min(100, len(loads_above) * 15)

        stability_score = max(0, 100 - sliding_risk * 0.2 - rolling_risk * 0.3 - tipping_risk * 0.3 - stack_risk * 0.2)

        results.append({
            "load_id": p.load_id,
            "type": load.type,
            "sliding_risk": round(sliding_risk, 1),
            "rolling_risk": round(rolling_risk, 1),
            "tipping_risk": round(tipping_risk, 1),
            "stack_risk": round(stack_risk, 1),
            "stability_score": round(stability_score, 1),
            "friction_floor": mat["friction_floor"],
            "friction_object": mat["friction_object"],
        })
    return results
