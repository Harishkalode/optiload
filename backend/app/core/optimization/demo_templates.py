"""
Demo Mode Templates - Exact replica layouts from reference images.

Coordinate System:
- Origin (0, 0, 0): Front-left corner of railcar at floor level
- X-axis: Front (0) → Rear (IL), runs along railcar length in meters
- Y-axis: Floor (0) → Ceiling, runs vertically in meters
- Z-axis: Left (0) → Right (IW), runs across railcar width in meters
"""

from typing import Dict, List, Optional
from app.core.optimization.types import LoadPlacement


def inches_to_meters(inches: float) -> float:
    return inches * 0.0254


# ─── ROW X-CENTRE HELPERS (hex packing @ 43.3") ───────────────────────

def _row_x_50ft(row_idx: int) -> float:
    R = inches_to_meters(25)
    SPACING = inches_to_meters(43.3)
    FRONT_MARGIN = inches_to_meters(35.2)
    GAP = inches_to_meters(9.31)
    SPLIT = 7
    if row_idx <= SPLIT:
        return FRONT_MARGIN + R + row_idx * SPACING
    x_last = FRONT_MARGIN + R + SPLIT * SPACING
    return x_last + R + GAP + R + (row_idx - SPLIT - 1) * SPACING


def _row_x_60ft(row_idx: int) -> float:
    R = inches_to_meters(25)
    SPACING = inches_to_meters(43.3)
    FRONT_MARGIN = inches_to_meters(32.7)
    GAP = inches_to_meters(7.47)
    SPLIT = 7
    if row_idx <= SPLIT:
        return FRONT_MARGIN + R + row_idx * SPACING
    x_last = FRONT_MARGIN + R + SPLIT * SPACING
    return x_last + R + GAP + R + (row_idx - SPLIT - 1) * SPACING


# ─── PLACEMENT BUILDER ────────────────────────────────────────────────

def _make_placement(load_id, x, y, z, layer, D, w1, w2):
    h = w1 if load_id == 1 else w2
    return LoadPlacement(
        load_id=load_id, x=x, y=y, z=z,
        orientation="vertical", rotation_y=0.0,
        placed_w=D, placed_h=h, placed_d=D,
        cog_x=x, cog_y=y, cog_z=z,
        contact_type="floor" if layer == 0 else "load",
        contact_surface_area=D * D,
        is_stable=True,
    )


def _generate_placements(rows, y_cyan, y_yellow, z1, z2, row_x_fn):
    """
    Generate vertical placements (standing upright, axis along Y).
    rows: list of (row_idx, [(color, n_layers), (color, n_layers)])
    """
    D = inches_to_meters(50)
    W1 = inches_to_meters(63.5)
    W2 = inches_to_meters(45.75)
    placements = []

    for (row_idx, col_specs) in rows:
        x_pos = row_x_fn(row_idx)
        for ci, (color, n_layers) in enumerate(col_specs):
            if n_layers == 0:
                continue
            zc = z1 if ci == 0 else z2
            for layer in range(n_layers):
                y_center = y_cyan[layer] if color == 1 else y_yellow[layer]
                placements.append(_make_placement(
                    load_id=color, x=x_pos, y=y_center, z=zc,
                    layer=layer, D=D, w1=W1, w2=W2,
                ))
    return placements


# ─── 50ft: 54 rolls (36 cyan 2-high + 18 yellow 3-high) ──────────────

def generate_50ft_demo_placements() -> List[LoadPlacement]:
    """
    50ft HC: IL=606", IW=114", IH=150", FH=43"

    Layout:
      Row 0-2:   Yellow (3-high, both cols)  18 rolls
      Row 3-7:   Cyan   (2-high, both cols)  20 rolls  (5 spots)
      [spacer 9.31"]
      Row 8-11:  Cyan   (2-high, both cols)  16 rolls  (4 spots)
                               Total: 24 spots, 54 rolls

    Hex-packed @ 43.3" row spacing.
    Z columns: 27.5", 86.5" from left wall.
    """
    y_cyan = [inches_to_meters(31.75), inches_to_meters(95.25)]
    y_yellow = [inches_to_meters(22.875), inches_to_meters(68.625), inches_to_meters(114.375)]
    z1, z2 = inches_to_meters(27.5), inches_to_meters(86.5)

    rows = [
        (0,  [(2,3), (2,3)]),
        (1,  [(2,3), (2,3)]),
        (2,  [(2,3), (2,3)]),
        (3,  [(1,2), (1,2)]),
        (4,  [(1,2), (1,2)]),
        (5,  [(1,2), (1,2)]),
        (6,  [(1,2), (1,2)]),
        (7,  [(1,2), (1,2)]),
        (8,  [(1,2), (1,2)]),
        (9,  [(1,2), (1,2)]),
        (10, [(1,2), (1,2)]),
        (11, [(1,2), (1,2)]),
    ]
    return _generate_placements(rows, y_cyan, y_yellow, z1, z2, _row_x_50ft)


# ─── 60ft: 64 rolls (44 cyan 2-high + 20 yellow 3/2-high) ────────────

def generate_60ft_demo_placements() -> List[LoadPlacement]:
    """
    60ft HC: IL=729", IW=114", IH=156", FH=44"

    Layout:
      Row 0-1:   Yellow (3-high, both cols)   12 rolls  (4 spots)
      Row 2-7:   Cyan   (2-high, both cols)   24 rolls  (12 spots)
      [spacer 7.47"]
      Row 8-12:  Cyan   (2-high, both cols)   20 rolls  (10 spots)
      Row 13:    Yellow (3-high, both cols)    6 rolls  (2 spots)
      Row 14:    Yellow (2-high, left only)    2 rolls  (1 spot)
                                Total: 29 spots, 64 rolls

    Hex-packed @ 43.3" row spacing.
    Z columns: 27.5", 86.5" from left wall.
    """
    y_cyan = [inches_to_meters(31.75), inches_to_meters(95.25)]
    y_yellow = [inches_to_meters(22.875), inches_to_meters(68.625), inches_to_meters(114.375)]
    z1, z2 = inches_to_meters(27.5), inches_to_meters(86.5)

    rows = [
        (0,  [(2,3), (2,3)]),
        (1,  [(2,3), (2,3)]),
        (2,  [(1,2), (1,2)]),
        (3,  [(1,2), (1,2)]),
        (4,  [(1,2), (1,2)]),
        (5,  [(1,2), (1,2)]),
        (6,  [(1,2), (1,2)]),
        (7,  [(1,2), (1,2)]),
        (8,  [(1,2), (1,2)]),
        (9,  [(1,2), (1,2)]),
        (10, [(1,2), (1,2)]),
        (11, [(1,2), (1,2)]),
        (12, [(1,2), (1,2)]),
        (13, [(2,3), (2,3)]),
        (14, [(2,2), (2,0)]),
    ]
    return _generate_placements(rows, y_cyan, y_yellow, z1, z2, _row_x_60ft)


# ─── TEMPLATE METADATA ────────────────────────────────────────────────

def get_demo_template_50ft() -> Dict:
    placements = generate_50ft_demo_placements()
    return {
        "railcar_id": "sample_50ft_hc",
        "railcar_name": "Sample High Cube 50ft",
        "vehicle_specs": {
            "interior_length_m": 15.37,
            "interior_width_m": 2.896,
            "interior_height_m": 3.81,
            "floor_height_m": 1.092,
            "door_height_m": 3.683,
            "door_width_m": 3.048,
            "wheelbase_m": 11.68,
            "empty_cg_height_m": 1.549,
            "load_limit_kg": 96070,
        },
        "loads": [
            {
                "load_id": 1,
                "sku": "50Inch-01",
                "type": "cylinder",
                "diameter_m": 1.27,
                "width_m": 1.6129,
                "weight_kg": 1452.73,
                "quantity": 36,
                "color": "cyan",
                "placements": [p for p in placements if p.load_id == 1],
            },
            {
                "load_id": 2,
                "sku": "50Inch-02",
                "type": "cylinder",
                "diameter_m": 1.27,
                "width_m": 1.1615,
                "weight_kg": 1011.73,
                "quantity": 18,
                "color": "yellow",
                "placements": [p for p in placements if p.load_id == 2],
            },
        ],
        "securements": [
            {
                "type": "block",
                "x_m": 7.11, "y_m": 1.092, "z_m": 1.448,
                "dimensions_m": {"length": 0.4, "width": 2.896, "height": 0.3},
            }
        ],
        "metrics": {
            "floor_spots": 24,
            "cg_height_in": 92.10,
            "max_void_space_in": 9.31,
            "num_risers": 2, "num_spacers": 1,
            "total_weight_kg": 70320,
            "total_volume_m3": 99.7,
        },
    }


def get_demo_template_60ft() -> Dict:
    placements = generate_60ft_demo_placements()
    return {
        "railcar_id": "sample_60ft_hc",
        "railcar_name": "Sample High Cube 60ft",
        "vehicle_specs": {
            "interior_length_m": 18.52,
            "interior_width_m": 2.896,
            "interior_height_m": 3.96,
            "floor_height_m": 1.118,
            "door_height_m": 3.759,
            "door_width_m": 3.658,
            "wheelbase_m": 15.24,
            "empty_cg_height_m": 1.600,
            "load_limit_kg": 92898,
        },
        "loads": [
            {
                "load_id": 1,
                "sku": "50Inch-01",
                "type": "cylinder",
                "diameter_m": 1.27,
                "width_m": 1.6129,
                "weight_kg": 1452.73,
                "quantity": 44,
                "color": "cyan",
                "placements": [p for p in placements if p.load_id == 1],
            },
            {
                "load_id": 2,
                "sku": "50Inch-02",
                "type": "cylinder",
                "diameter_m": 1.27,
                "width_m": 1.1615,
                "weight_kg": 1011.73,
                "quantity": 20,
                "color": "yellow",
                "placements": [p for p in placements if p.load_id == 2],
            },
        ],
        "securements": [
            {
                "type": "block",
                "x_m": 9.0, "y_m": 1.118, "z_m": 1.448,
                "dimensions_m": {"length": 0.4, "width": 2.896, "height": 0.3},
            }
        ],
        "metrics": {
            "floor_spots": 29,
            "cg_height_in": 93.88,
            "max_void_space_in": 7.47,
            "num_risers": 2, "num_spacers": 1,
            "total_weight_kg": 84236,
            "total_volume_m3": 119.6,
        },
    }


def get_demo_template(railcar_type: str) -> Dict:
    if "60" in str(railcar_type).lower():
        return get_demo_template_60ft()
        return get_demo_template_50ft()

