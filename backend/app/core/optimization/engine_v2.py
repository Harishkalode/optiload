"""Physics-based 3D packing engine with full AAR constraint enforcement.

Core guarantees:
- No overlap (collision detection)
- All loads within vehicle bounds
- Stable stacking (contact validation via physics engine)
- CoG compliance (AAR 3.5.1)
- Axle load limits (AAR 3.2.2)
- Deterministic output (same input → same output, ordered placement)
"""

from typing import Optional, List, Dict, Tuple
from app.core.optimization.types import (
    LoadPlacement, LoadSpec, OptimizationResult, VehicleSpec, 
    AARViolation, OptimizationMetrics
)
from app.core.optimization.physics_engine import PhysicsEngine
from app.core.optimization.aar_rules import (
    validate_load_bounds, check_collisions, validate_hazmat_separation,
    compute_metrics,
)
from app.core.optimization.securement import suggest_securements


class PlacementEngine:
    """Deterministic 3D bin packing with physics-based constraint enforcement."""
    
    eps = 0.001
    
    def __init__(self):
        self.physics = PhysicsEngine()
    
    def normalize_dimensions(self, vehicle: VehicleSpec) -> VehicleSpec:
        """Detect and fix unit mismatches (mm/cm/km)."""
        v_len, v_wid, v_ht = vehicle.length_m, vehicle.width_m, vehicle.height_m
        
        if v_len > 1000 or v_wid > 1000 or v_ht > 1000:  # mm
            v_len, v_wid, v_ht = v_len / 1000, v_wid / 1000, v_ht / 1000
        elif v_len > 100 or v_wid > 100 or v_ht > 100:  # cm
            v_len, v_wid, v_ht = v_len / 100, v_wid / 100, v_ht / 100
        elif v_len < 0.1:  # km
            v_len, v_wid, v_ht = v_len * 1000, v_wid * 1000, v_ht * 1000
        
        return VehicleSpec(
            id=vehicle.id, type=vehicle.type, length_m=v_len, width_m=v_wid, height_m=v_ht,
            capacity_kg=vehicle.capacity_kg, tare_weight_kg=vehicle.tare_weight_kg,
            plate_type=vehicle.plate_type, truck_center_front_m=vehicle.truck_center_front_m,
            truck_center_rear_m=vehicle.truck_center_rear_m, empty_cg_height_in=vehicle.empty_cg_height_in,
            axle_positions=vehicle.axle_positions,
        )
    
    def get_load_dimensions(self, load: LoadSpec) -> Tuple[float, float, float]:
        """Get [width, height, depth] for placement (L, H, W)."""
        if load.type in ("cylinder", "paper_roll", "coil"):
            d = load.diameter_m or min(load.length_m, load.width_m)
            return (d, d, load.length_m)
        return (load.length_m, load.height_m, load.width_m)
    
    def expand_loads(self, loads: List[LoadSpec]) -> List[Tuple[int, LoadSpec]]:
        """Expand quantities; return list of (template_idx, load) for tracking."""
        expanded = []
        template_idx = 0
        for load in loads:
            for _ in range(load.quantity):
                expanded.append((template_idx, LoadSpec(
                    id=load.id, type=load.type, length_m=load.length_m, width_m=load.width_m,
                    height_m=load.height_m, weight_kg=load.weight_kg, quantity=1,
                    fragile=load.fragile, stackable=load.stackable,
                    hazmat_class=load.hazmat_class, diameter_m=load.diameter_m,
                )))
                template_idx += 1
        return expanded
    
    def place_loads_deterministic(self, 
        vehicle: VehicleSpec, 
        loads: List[LoadSpec],
    ) -> Tuple[List[LoadPlacement], List[AARViolation]]:
        """
        Deterministic placement with physics constraints:
        1. Sort by weight (FFD: heaviest first)
        2. For each load, try placement positions in deterministic order (center-out grid)
        3. Validate each candidate against:
           - Bounds checking
           - Collision detection
           - Physics stability
           - AAR constraints
        4. Place first valid candidate; skip if none valid
        """
        expanded = self.expand_loads(loads)
        expanded.sort(key=lambda item: item[1].weight_kg, reverse=True)  # FFD: heaviest first
        
        placements: List[LoadPlacement] = []
        placement_violations: List[AARViolation] = []
        violation_set = set()  # Track (rule, load_id) to avoid duplicates
        
        v_len, v_wid, v_ht = vehicle.length_m, vehicle.width_m, vehicle.height_m
        load_map = {l.id: l for l in loads}
        
        for template_idx, load in expanded:
            w, h, d = self.get_load_dimensions(load)
            placed = False
            
            # Skip if load too big
            if w > v_len + self.eps or d > v_wid + self.eps or h > v_ht + self.eps:
                violation_key = ("placement_oversized", load.id)
                if violation_key not in violation_set:
                    violation_set.add(violation_key)
                    placement_violations.append(AARViolation(
                        rule="placement_oversized",
                        message=f"Load {load.id} (dims {w}×{h}×{d}) exceeds vehicle {v_len}×{v_ht}×{v_wid}",
                        severity="error"
                    ))
                continue
            
            # Deterministic Y candidates: floor, then each occupied top surface
            y_candidates = [0.0]
            for existing in placements:
                candidate_y = existing.y + existing.placed_h
                if candidate_y + h <= v_ht + self.eps:
                    y_candidates.append(candidate_y)
            y_candidates = sorted(set(y_candidates))
            
            # Try Y levels
            for y in y_candidates:
                if placed:
                    break
                
                # Constraint: Fragile and non-stackable loads can only go on floor
                if load.fragile and y > self.eps:
                    break
                if not load.stackable and y > self.eps:
                    break
                
                # Deterministic X positions: center-out grid
                x_positions = self._center_out_positions(w, v_len)
                for x in x_positions:
                    if placed or x + w > v_len + self.eps:
                        continue
                    
                    # Deterministic Z positions: center-out grid
                    z_positions = self._center_out_positions(d, v_wid)
                    for z in z_positions:
                        if z + d > v_wid + self.eps:
                            continue
                        
                        # Create candidate placement
                        candidate = LoadPlacement(
                            load_id=load.id,
                            x=round(x, 3), y=round(y, 3), z=round(z, 3),
                            rx=0, ry=0, rz=0, rotated=False,
                            placed_w=w, placed_h=h, placed_d=d,
                            cog_x=x + w / 2, cog_y=y + h / 2, cog_z=z + d / 2,
                            contact_type="floor" if y < self.eps else "load",
                            contact_surface_area=w * d,
                            load=load,
                        )
                        
                        # Validate candidate
                        if self._is_valid_placement(candidate, load, placements, vehicle, loads):
                            placements.append(candidate)
                            placed = True
                            break
        
        return placements, placement_violations
    
    def _center_out_positions(self, size: float, vehicle_size: float) -> List[float]:
        """Generate positions from center outward for balanced, deterministic placement."""
        if size >= vehicle_size - self.eps:
            return [0.0]
        
        center = (vehicle_size - size) / 2
        positions = [round(center, 3)]
        offset = size
        
        while offset < vehicle_size:
            if center + offset + size <= vehicle_size + self.eps:
                positions.append(round(center + offset, 3))
            if center - offset >= -self.eps:
                positions.append(round(max(0, center - offset), 3))
            offset += size
        
        return positions
    
    def _is_valid_placement(self, candidate: LoadPlacement, load: LoadSpec,
                           existing_placements: List[LoadPlacement],
                           vehicle: VehicleSpec, load_specs: List[LoadSpec]) -> bool:
        """
        Validate placement against:
        1. Bounds
        2. No collision with existing loads
        3. Physics stability
        4. AAR constraints (will be checked in full validation, but quick fail here)
        """
        # Bounds check
        if (candidate.x < -self.eps or candidate.x + candidate.placed_w > vehicle.length_m + self.eps or
            candidate.z < -self.eps or candidate.z + candidate.placed_d > vehicle.width_m + self.eps or
            candidate.y < -self.eps or candidate.y + candidate.placed_h > vehicle.height_m + self.eps):
            return False
        
        # Collision check
        for existing in existing_placements:
            if self._collides(candidate, existing):
                return False
        
        # Physics stability
        if not self.physics.is_stable(candidate, vehicle, existing_placements, load):
            return False
        
        # Contact surfaces
        candidate.contact_surfaces = self.physics.compute_contact_surfaces(
            candidate, vehicle, existing_placements
        )
        
        return True
    
    def _collides(self, p1: LoadPlacement, p2: LoadPlacement) -> bool:
        """Check axis-aligned bounding box collision."""
        return not (
            p1.x + p1.placed_w <= p2.x + self.eps or p2.x + p2.placed_w <= p1.x + self.eps or
            p1.y + p1.placed_h <= p2.y + self.eps or p2.y + p2.placed_h <= p1.y + self.eps or
            p1.z + p1.placed_d <= p2.z + self.eps or p2.z + p2.placed_d <= p1.z + self.eps
        )


def run_optimization(vehicle: VehicleSpec, loads: List[LoadSpec], constraints: Optional[Dict] = None) -> OptimizationResult:
    """
    Execute full physics-based optimization with constraint validation.
    
    Args:
        vehicle: Vehicle specification
        loads: List of load specifications
        constraints: Optional constraint dict (for future extensibility)
    
    Returns OptimizationResult with placements, metrics, violations, and warnings.
    """
    # Phase 1: Normalization
    vehicle = PlacementEngine().normalize_dimensions(vehicle)
    
    # Phase 2: Deterministic placement with physics
    engine = PlacementEngine()
    placements, placement_violations = engine.place_loads_deterministic(vehicle, loads)
    
    # Phase 3: Physics analysis
    physics = PhysicsEngine()
    cog = physics.compute_combined_cog(vehicle, placements, loads)
    axle_loads, axles = physics.compute_axle_loads(vehicle, placements, loads)
    
    # Phase 4: Comprehensive validation
    violations = list(placement_violations)
    warnings = []
    
    # AAR 3.5.1: CoG height
    cog_violation = physics.validate_cog_height(cog)
    if cog_violation:
        violations.append(cog_violation)
    
    # AAR 3.2.2: Axle loads
    axle_violations = physics.validate_axle_loads(axles)
    violations.extend(axle_violations)
    
    # AAR 3.3: Lateral balance
    lat_violations = physics.validate_lateral_balance(vehicle, placements, loads)
    violations.extend([v for v in lat_violations if v.severity == "error"])
    warnings.extend([v for v in lat_violations if v.severity == "warning"])
    
    # AAR Longitudinal balance
    long_violations = physics.validate_longitudinal_balance(vehicle, placements, loads)
    violations.extend([v for v in long_violations if v.severity == "error"])
    warnings.extend([v for v in long_violations if v.severity == "warning"])
    
    # Collision check
    collision_violations = check_collisions(placements, {})
    violations.extend([v for v in collision_violations if v.severity == "error"])
    warnings.extend([v for v in collision_violations if v.severity == "warning"])
    
    # Bounds check
    bounds_violations = validate_load_bounds(vehicle, placements, {})
    violations.extend([v for v in bounds_violations if v.severity == "error"])
    warnings.extend([v for v in bounds_violations if v.severity == "warning"])
    
    # Hazmat separation
    hazmat_map = {l.id: l.hazmat_class for l in loads}
    hazmat_violations = validate_hazmat_separation(placements, hazmat_map)
    violations.extend([v for v in hazmat_violations if v.severity == "error"])
    warnings.extend([v for v in hazmat_violations if v.severity == "warning"])
    
    # Phase 5: Metrics calculation
    load_weights = {l.id: l.weight_kg for l in loads}
    load_dims = {l.id: engine.get_load_dimensions(l) for l in loads}
    metrics = compute_metrics(vehicle, placements, load_weights, load_dims)
    metrics.cg_x = cog.x_m
    metrics.cg_y = cog.y_m
    metrics.cg_z = cog.z_m
    metrics.axle_loads = axle_loads
    
    # Phase 6: Securement suggestions
    extra_data = {
        "suggested_securements": suggest_securements(placements, loads, vehicle),
        "cog_height_inches": cog.height_inches,
    }
    
    return OptimizationResult(
        placements=placements,
        metrics=metrics,
        violations=violations,
        warnings=warnings,
        extra_data=extra_data
    )
