"""
Demo Mode Integration - Bridges demo templates with optimization service.
"""

import json
from typing import Optional, Dict, Any
from app.core.optimization.types import LoadPlacement, VehicleSpec, LoadSpec


# ─── DEMO LOAD METADATA ────────────────────────────────────────────────
DEMO_LOAD_META = {
    1: {
        "name": "Cyan Cylindrical Roll",
        "type": "cylinder",
        "material_type": "paper_roll",
        "color": "cyan",
        "weight_kg": 577.28,
        "dimensions": {
            "diameter_m": 1.27,
            "width_m": 1.6129,
        },
        "orientation": "vertical",
        "stackable": True,
        "fragile": False,
        "hazmat_class": None,
        "texture_url": None,
        "model_url": None,
    },
    2: {
        "name": "Yellow Cylindrical Roll",
        "type": "cylinder",
        "material_type": "paper_roll",
        "color": "yellow",
        "weight_kg": 414.48,
        "dimensions": {
            "diameter_m": 1.27,
            "width_m": 1.1621,
        },
        "orientation": "vertical",
        "stackable": True,
        "fragile": False,
        "hazmat_class": None,
        "texture_url": None,
        "model_url": None,
    }
}


def is_demo_mode_enabled(demo_header: str | None = None) -> bool:
    return (demo_header or "").lower() == "true"


def detect_railcar_type(vehicle_spec: VehicleSpec) -> str:
    if vehicle_spec.length_m < 17:
        return "50ft"
    else:
        return "60ft"


def get_demo_placements(railcar_type: str) -> list:
    from app.core.optimization.demo_templates import (
        generate_50ft_demo_placements,
        generate_60ft_demo_placements
    )
    if "60" in str(railcar_type).lower():
        return generate_60ft_demo_placements()
    return generate_50ft_demo_placements()


def get_demo_metrics(railcar_type: str) -> Dict[str, Any]:
    if "60" in str(railcar_type).lower():
        return {
            "floor_spots": 29,
            "cg_height_in": 93.88,
            "max_void_space_in": 7.47,
            "num_risers": 2,
            "num_spacers": 1,
            "total_weight_kg": 84236,
            "total_volume_m3": 119.6,
        }
    return {
        "floor_spots": 24,
        "cg_height_in": 92.10,
        "max_void_space_in": 9.31,
        "num_risers": 2,
        "num_spacers": 1,
        "total_weight_kg": 70320,
        "total_volume_m3": 99.7,
    }


def generate_demo_result_json(
    vehicle_spec: VehicleSpec,
    placements: list,
    load_meta: Dict[int, Dict],
    railcar_type: str,
) -> Dict[str, Any]:
    metrics = get_demo_metrics(railcar_type)

    result_json = {
        "vehicle": {
            "type": vehicle_spec.type,
            "length_m": vehicle_spec.length_m,
            "width_m": vehicle_spec.width_m,
            "height_m": vehicle_spec.height_m,
            "capacity_kg": vehicle_spec.capacity_kg,
            "tare_weight_kg": vehicle_spec.tare_weight_kg,
            "axle_positions": vehicle_spec.axle_positions or [],
        },
        "placements": [
            {
                "load_id": p.load_id,
                "x": p.x, "y": p.y, "z": p.z,
                "orientation": p.orientation,
                "placed_w": p.placed_w,
                "placed_h": p.placed_h,
                "placed_d": p.placed_d,
                "cog_x": p.cog_x, "cog_y": p.cog_y, "cog_z": p.cog_z,
                "contact_type": p.contact_type,
                "contact_surface_area": p.contact_surface_area,
                "is_stable": p.is_stable,
                "load": DEMO_LOAD_META.get(p.load_id, {}),
            }
            for p in placements
        ],
        "metrics": {
            "floor_spots": metrics["floor_spots"],
            "cg_height_in": metrics["cg_height_in"],
            "max_void_space_in": metrics["max_void_space_in"],
            "num_risers": metrics["num_risers"],
            "num_spacers": metrics["num_spacers"],
            "total_weight_kg": metrics["total_weight_kg"],
            "total_volume_m3": metrics["total_volume_m3"],
        },
        "securements": [
            {
                "type": "block",
                "x_m": 7.11,
                "y_m": 1.092,
                "z_m": 1.448,
                "dimensions_m": {"length": 0.4, "width": 2.896, "height": 0.3},
            }
        ] if railcar_type == "50ft" else [
            {
                "type": "block",
                "x_m": 9.0,
                "y_m": 1.118,
                "z_m": 1.448,
                "dimensions_m": {"length": 0.4, "width": 2.896, "height": 0.3},
            }
        ],
        "is_demo": True,
        "demo_note": f"Demo result for {railcar_type} High Cube railcar.",
    }

    return result_json
