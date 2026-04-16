"""Physics engine: CoG calculation, stability validation, contact analysis."""

from typing import Tuple, List
from app.core.optimization.types import (
    VehicleSpec, LoadPlacement, LoadSpec, CenterOfGravity, ContactSurface, Axle, AARViolation
)

# Physical constants
PLATFORM_HEIGHT_M = 1.1  # Standard rail height above actual rail
CG_HEIGHT_LIMIT_INCHES = 98  # AAR 3.5.1
LATERAL_IMBALANCE_ERROR = 0.10  # 10%
LATERAL_IMBALANCE_WARN = 0.05  # 5%
LONG_IMBALANCE_ERROR = 0.20
LONG_IMBALANCE_WARN = 0.10
MIN_CONTACT_AREA_M2 = 0.01  # Minimum contact area for stable placement
STABILITY_BALANCE_FACTOR = 3.0  # CoG height / lateral distance to edge


class PhysicsEngine:
    """Calculate and validate physical properties of loaded vehicle."""
    
    eps = 0.001
    
    def __init__(self):
        pass
    
    def compute_combined_cog(self, vehicle: VehicleSpec, placements: List[LoadPlacement],
                             load_specs: List[LoadSpec]) -> CenterOfGravity:
        """Compute combined center of gravity of vehicle + all loads."""
        load_map = {l.id: l for l in load_specs}
        load_weights = {l.id: l.weight_kg for l in load_specs}
        
        tare_weight = vehicle.tare_weight_kg or 0
        empty_cg_height_m = (vehicle.empty_cg_height_in or 45) * 0.0254
        
        total_weight = tare_weight + sum(load_weights.values())
        if total_weight == 0:
            return CenterOfGravity(x_m=vehicle.length_m/2, y_m=0, z_m=vehicle.width_m/2)
        
        # Weighted sum of all load positions
        weighted_x = tare_weight * vehicle.length_m / 2  # Assume tare center is mid-truck
        weighted_y = tare_weight * empty_cg_height_m
        weighted_z = tare_weight * vehicle.width_m / 2
        
        for p in placements:
            w = load_weights.get(p.load_id, 0)
            weighted_x += w * p.cog_x
            weighted_y += w * (p.cog_y + PLATFORM_HEIGHT_M)  # Add platform height to load CoG
            weighted_z += w * p.cog_z
        
        cog_x = weighted_x / total_weight
        cog_y = weighted_y / total_weight
        cog_z = weighted_z / total_weight
        
        cog_height_inches = cog_y * 39.37  # meters to inches
        
        return CenterOfGravity(
            x_m=cog_x, y_m=cog_y, z_m=cog_z,
            height_inches=cog_height_inches
        )
    
    def compute_axle_loads(self, vehicle: VehicleSpec, placements: List[LoadPlacement],
                          load_specs: List[LoadSpec]) -> Tuple[List[float], List[Axle]]:
        """
        Distribute load weight to axles based on longitudinal position.
        Returns (axle_loads, updated_axles).
        """
        axles = vehicle.get_axles()
        load_weights = {l.id: l.weight_kg for l in load_specs}
        
        if not axles:
            return [], []
        
        tare_weight = vehicle.tare_weight_kg or 0
        tare_per_axle = tare_weight / len(axles)
        
        axle_loads = [tare_per_axle] * len(axles)
        
        # Distribution: linear interpolation between nearest axles
        for p in placements:
            w = load_weights.get(p.load_id, 0)
            if w <= 0:
                continue
                
            load_center_x = p.x + (p.placed_w or 0) / 2
            
            # Compute factors for each axle, normalized to sum = 1
            factors = []
            for axle in axles:
                distance_from_axle = abs(load_center_x - axle.position_m)
                max_distance = max(vehicle.length_m / 2, 1.0)  # Avoid division by zero
                factor = max(0.0, 1 - distance_from_axle / max_distance)
                factors.append(factor)
            
            # Normalize factors to sum to 1.0
            total_factor = sum(factors)
            if total_factor > 0:
                factors = [f / total_factor for f in factors]
            else:
                # Fallback: distribute evenly
                factors = [1.0 / len(axles)] * len(axles)
            
            # Add weighted load to each axle
            for i, factor in enumerate(factors):
                axle_loads[i] += w * factor
        
        # Update axles with computed loads
        for i, axle in enumerate(axles):
            axle.current_load_kg = axle_loads[i]
        
        return axle_loads, axles
    
    def validate_cog_height(self, cog: CenterOfGravity, limit_inches: float = CG_HEIGHT_LIMIT_INCHES) -> AARViolation | None:
        """Check AAR 3.5.1: Combined CG must not exceed 98 inches."""
        if cog.height_inches > limit_inches:
            return AARViolation(
                rule="aar_3_5_1_cg_height",
                message=f"Combined CG height {cog.height_inches:.1f}in exceeds AAR limit {limit_inches:.0f}in",
                severity="error",
                details={"cg_height_inches": cog.height_inches, "limit_inches": limit_inches}
            )
        return None
    
    def validate_axle_loads(self, axles: List[Axle], axle_limit_kg: float = 22500) -> List[AARViolation]:
        """Check AAR 3.2.2: No axle exceeds weight limit."""
        violations = []
        for i, axle in enumerate(axles):
            if axle.is_overloaded():
                violations.append(AARViolation(
                    rule="aar_3_2_2_axle_load",
                    message=f"Axle {i+1} load {axle.current_load_kg:.0f}kg exceeds limit {axle.weight_limit_kg:.0f}kg",
                    severity="error",
                    details={"axle": i, "load_kg": axle.current_load_kg, "limit_kg": axle.weight_limit_kg}
                ))
        return violations
    
    def validate_lateral_balance(self, vehicle: VehicleSpec, placements: List[LoadPlacement],
                                load_specs: List[LoadSpec]) -> List[AARViolation]:
        """Check AAR 3.3: Lateral balance within limits."""
        load_weights = {l.id: l.weight_kg for l in load_specs}
        total_weight = sum(load_weights.values())
        if total_weight == 0:
            return []
        
        half_width = vehicle.width_m / 2
        left_weight = 0.0
        right_weight = 0.0
        
        for p in placements:
            w = load_weights.get(p.load_id, 0)
            load_center = p.z + (p.placed_d or 0) / 2
            
            # Split weight if near centerline
            if abs(load_center - half_width) < 0.05:
                left_weight += w * 0.5
                right_weight += w * 0.5
            elif load_center < half_width:
                left_weight += w
            else:
                right_weight += w
        
        imbalance = abs(left_weight - right_weight) / total_weight if total_weight > 0 else 0
        violations = []
        
        if imbalance > LATERAL_IMBALANCE_ERROR:
            violations.append(AARViolation(
                rule="aar_3_3_lateral_balance",
                message=f"Lateral imbalance {imbalance:.1%} exceeds error threshold {LATERAL_IMBALANCE_ERROR:.0%}",
                severity="error",
                details={"imbalance_pct": imbalance * 100}
            ))
        elif imbalance > LATERAL_IMBALANCE_WARN:
            violations.append(AARViolation(
                rule="aar_3_3_lateral_balance",
                message=f"Lateral imbalance {imbalance:.1%} exceeds warning threshold {LATERAL_IMBALANCE_WARN:.0%}",
                severity="warning",
                details={"imbalance_pct": imbalance * 100}
            ))
        
        return violations
    
    def validate_longitudinal_balance(self, vehicle: VehicleSpec, placements: List[LoadPlacement],
                                     load_specs: List[LoadSpec]) -> List[AARViolation]:
        """Check AAR longitudinal balance (front-to-back)."""
        load_weights = {l.id: l.weight_kg for l in load_specs}
        total_weight = sum(load_weights.values())
        if total_weight == 0:
            return []
        
        half_length = vehicle.length_m / 2
        front_weight = 0.0
        rear_weight = 0.0
        
        for p in placements:
            w = load_weights.get(p.load_id, 0)
            load_center = p.x + (p.placed_w or 0) / 2
            
            if abs(load_center - half_length) < 0.05:
                front_weight += w * 0.5
                rear_weight += w * 0.5
            elif load_center < half_length:
                front_weight += w
            else:
                rear_weight += w
        
        imbalance = abs(front_weight - rear_weight) / total_weight if total_weight > 0 else 0
        violations = []
        
        if imbalance > LONG_IMBALANCE_ERROR:
            violations.append(AARViolation(
                rule="aar_longitudinal_balance",
                message=f"Longitudinal imbalance {imbalance:.1%} exceeds error threshold {LONG_IMBALANCE_ERROR:.0%}",
                severity="error",
                details={"imbalance_pct": imbalance * 100}
            ))
        elif imbalance > LONG_IMBALANCE_WARN:
            violations.append(AARViolation(
                rule="aar_longitudinal_balance",
                message=f"Longitudinal imbalance {imbalance:.1%} exceeds warning threshold {LONG_IMBALANCE_WARN:.0%}",
                severity="warning",
                details={"imbalance_pct": imbalance * 100}
            ))
        
        return violations
    
    def compute_contact_surfaces(self, placement: LoadPlacement, vehicle: VehicleSpec,
                                existing_placements: List[LoadPlacement]) -> List[ContactSurface]:
        """Compute contact surfaces for a load placement."""
        contacts = []
        
        # Floor contact
        if placement.y < self.eps:
            contacts.append(ContactSurface(
                type="floor",
                area_m2=placement.placed_w * placement.placed_d,
                is_valid=True
            ))
        
        # Contact with existing loads (stacking)
        for existing in existing_placements:
            # Check if placement sits on top of existing
            if (abs(placement.y - (existing.y + existing.placed_h)) < self.eps and
                self._overlaps_xy(placement, existing)):
                overlap_w = min(placement.x + placement.placed_w, existing.x + existing.placed_w) - max(placement.x, existing.x)
                overlap_d = min(placement.z + placement.placed_d, existing.z + existing.placed_d) - max(placement.z, existing.z)
                if overlap_w > 0 and overlap_d > 0:
                    contacts.append(ContactSurface(
                        type="load",
                        area_m2=overlap_w * overlap_d,
                        is_valid=True
                    ))
        
        return contacts
    
    def _overlaps_xy(self, p1: LoadPlacement, p2: LoadPlacement) -> bool:
        """Check if two placements overlap in X-Z plane."""
        return not (p1.x + p1.placed_w < p2.x or p2.x + p2.placed_w < p1.x or
                   p1.z + p1.placed_d < p2.z or p2.z + p2.placed_d < p1.z)
    
    def is_stable(self, placement: LoadPlacement, vehicle: VehicleSpec, 
                 existing_placements: List[LoadPlacement], load: LoadSpec) -> bool:
        """Determine if a placement is physically stable."""
        # Rule 1: Load must have contact
        if placement.y > self.eps:
            has_contact = False
            for existing in existing_placements:
                if (abs(placement.y - (existing.y + existing.placed_h)) < self.eps and
                    self._overlaps_xy(placement, existing)):
                    has_contact = True
                    break
            if not has_contact:
                return False
        
        # Rule 2: Fragile loads cannot be stacked
        if load.fragile and placement.y > self.eps:
            return False
        
        # Rule 3: Non-stackable loads cannot be stacked
        if not load.stackable and placement.y > self.eps:
            return False
        
        # Rule 4: Cylinders must have adjacent support
        if load.type in ("cylinder", "paper_roll", "coil"):
            if placement.y < self.eps:
                # Must have at least one adjacent cylinder
                has_adjacent = False
                for existing in existing_placements:
                    if existing.load and existing.load.type in ("cylinder", "paper_roll", "coil"):
                        # Check if touching
                        if (abs(placement.y - existing.y) < self.eps and
                            abs(placement.z + placement.placed_d - existing.z) < 0.05 or
                            abs(placement.z - (existing.z + existing.placed_d)) < 0.05):
                            has_adjacent = True
                            break
                if not has_adjacent and len(existing_placements) > 0:
                    return False
        
        # Rule 5: Stability check - CoG must be within base
        if placement.y > self.eps:
            # CoG lateral position must be within load footprint
            cog_z = placement.cog_z
            if cog_z < placement.z or cog_z > placement.z + placement.placed_d:
                return False
        
        return True
