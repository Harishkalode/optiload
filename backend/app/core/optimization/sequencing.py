"""Loading sequence generation for feasible physical loading."""


def generate_loading_sequence(placements, vehicle, door_position="rear"):
    """Generate feasible loading order. Farthest from door first, heaviest first."""
    door_x = vehicle.length_m if door_position == "rear" else 0

    sequenced = sorted(placements, key=lambda p: (
        -abs(p.x + (p.placed_w or 0) / 2 - door_x),
        -(p.placed_w or 0) * (p.placed_h or 0) * (p.placed_d or 0),
    ))

    steps = []
    for i, p in enumerate(sequenced):
        obstruction = _check_obstruction(p, sequenced[:i], vehicle)
        steps.append({
            "step": i + 1,
            "load_id": p.load_id,
            "position": {"x": p.x, "y": p.y, "z": p.z},
            "orientation": "rotated" if p.rotated else "normal",
            "dimensions": {"w": p.placed_w, "h": p.placed_h, "d": p.placed_d},
            "obstruction": obstruction,
            "estimated_time_seconds": 30 + i * 5,
        })

    return {
        "steps": steps,
        "total_time_seconds": sum(s["estimated_time_seconds"] for s in steps),
        "total_loads": len(steps),
    }


def _check_obstruction(load, already_placed, vehicle):
    """Check if load can be placed without hitting already-placed loads."""
    load_x_end = load.x + (load.placed_w or 0)
    load_x_start = load.x
    load_z_end = load.z + (load.placed_d or 0)
    load_z_start = load.z

    for existing in already_placed:
        ex_start = existing.x
        ex_end = existing.x + (existing.placed_w or 0)
        ez_start = existing.z
        ez_end = existing.z + (existing.placed_d or 0)

        x_overlap = load_x_end > ex_start and load_x_start < ex_end
        z_overlap = load_z_end > ez_start and load_z_start < ez_end

        if x_overlap and z_overlap and existing.y > load.y:
            return f"Blocked by load {existing.load_id} at y={existing.y:.2f}m"

    return None
