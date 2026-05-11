"""Helper functions for legacy test suite compatibility."""

from typing import List, Tuple
from app.core.optimization.types import LoadSpec, LoadPlacement


def make_load(id=1, type="cube", length=1.0, width=1.0, height=1.0, weight_kg=100, 
              quantity=1, fragile=False, stackable=True, hazmat_class=None, diameter=None):
    """Helper to create a LoadSpec with defaults."""
    return LoadSpec(
        id=id, type=type, length_m=length, width_m=width, height_m=height,
        weight_kg=weight_kg, quantity=quantity, fragile=fragile, stackable=stackable,
        hazmat_class=hazmat_class, diameter_m=diameter,
    )

def expand_loads(loads: List[LoadSpec]) -> List[LoadSpec]:
    """Expand loads with quantity > 1 into individual loads with quantity=1."""
    expanded = []
    for load in loads:
        for _ in range(load.quantity):
            expanded.append(LoadSpec(
                id=load.id,
                type=load.type,
                length_m=load.length_m,
                width_m=load.width_m,
                height_m=load.height_m,
                weight_kg=load.weight_kg,
                quantity=1,
                fragile=load.fragile,
                stackable=load.stackable,
                hazmat_class=load.hazmat_class,
                diameter_m=load.diameter_m,
            ))
    return expanded


def _get_dims(load: LoadSpec) -> Tuple[float, float, float]:
    """Get [width, height, depth] dimensions for a load.
    
    For cylinders/paper_rolls/coils: (diameter, diameter, length)
    For cubes/other: (length, height, width)
    """
    if load.type in ("cylinder", "paper_roll", "coil"):
        d = load.diameter_m or min(load.length_m, load.width_m)
        return (d, d, load.length_m)
    return (load.length_m, load.height_m, load.width_m)


def make_load_placement(load_id: int, x: float, y: float, z: float,
                       placed_w: float, placed_h: float, placed_d: float,
                       rx: float = 0, ry: float = 0, rz: float = 0,
                       rotated: bool = False, orientation: str = "vertical") -> LoadPlacement:
    """Create a LoadPlacement object with legacy API compatibility.
    
    This wrapper allows tests to use rx/ry/rz parameters even though the current
    API uses orientation. The rotation parameters are accepted but not stored,
    as the orientation field now determines spatial orientation.
    """
    return LoadPlacement(
        load_id=load_id,
        x=x,
        y=y,
        z=z,
        orientation=orientation,
        placed_w=placed_w,
        placed_h=placed_h,
        placed_d=placed_d,
    )
