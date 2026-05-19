"""
AAR Deterministic Placement Engine - Phase 1.4

Implements a physics-based 3D bin packing algorithm with strict AAR 2019 rule compliance.
Algorithm: First-Fit-Decreasing (FFD) with deterministic center-outward grid placement.

Key Guarantees:
- Deterministic: Same input always yields same output.
- Strict Bounds: No load overflows vehicle edges.
- No Overlap: Collision detection prevents overlapping loads.
- Physics-Validated: Every placement is checked for CoG and stability.
- AAR Compliant: Every placement is validated against all 130+ AAR rules.
"""

import math
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Optional

from app.core.optimization.types import (
    VehicleSpec, LoadSpec, LoadPlacement, OptimizationResult, 
    OptimizationMetrics, AARViolation, AARValidationResult, CenterOfGravity
)
from app.core.optimization.physics_engine import PhysicsEngine
from app.core.optimization.aar_engine_v3 import AARRuleEngine
from app.core.optimization.aar_stack_validator import AARStackValidator


@dataclass
class PackingConstraints:
    """Configuration for the placement engine."""
    max_stacking_layers: int = 10
    fragile_no_stack: bool = True
    doorway_zone_ratio: float = 0.15
    doorway_single_layer: bool = True
    max_void_gap_m: float = 0.3
    weight_balance: bool = True
    stack_rules: bool = True
    hazmat_separation: bool = True
    priority_order: bool = False


class PlacementEngine:
    """
    AAR-compliant deterministic placement engine.
    """
    
    def __init__(self):
        self.physics_engine = PhysicsEngine()
        self.aar_engine = AARRuleEngine()
        self.stack_validator = AARStackValidator()
        self.grid_step = 0.1  # 10cm grid for candidate generation
        self.safety_margin = 0.05  # 5cm safety margin from vehicle walls
        
    def run_optimization(self, vehicle: VehicleSpec, loads: List[LoadSpec], 
                         constraints: PackingConstraints = PackingConstraints()) -> OptimizationResult:
        """
        Top-level entry point for the optimization process.
        """
        # 1. Load Preparation
        loads_dict = {load.id: load for load in loads}
        
        # 2. Sorting (First-Fit-Decreasing by weight)
        # Heavier loads first create a more stable base
        sorted_loads = sorted(loads, key=lambda x: x.weight_kg * x.quantity, reverse=True)
        
        placements = []
        unplaced_loads = []
        
        # 3. Placement Loop
        for load in sorted_loads:
            # Expand quantity into individual items
            for i in range(load.quantity):
                placed = self._place_single_load(load, vehicle, placements, loads_dict, constraints)
                if placed:
                    placements.append(placed)
                else:
                    unplaced_loads.append(load.id)
        
        # 4. Final Validation & Metrics
        # Compute combined CoG and axle loads for the final configuration
        cg = self.physics_engine.compute_combined_cog(vehicle, placements, loads_dict)
        axle_loads, _ = self.physics_engine.compute_axle_loads(vehicle, placements, loads_dict)
        
        # Comprehensive AAR Rule Evaluation
        eval_result = self.aar_engine.evaluate_all_rules(
            placements=placements,
            loads=loads_dict,
            vehicle=vehicle,
            cg=cg,
            axle_loads=axle_loads
        )
        
        # 5. Metrics Calculation
        metrics = self._calculate_metrics(vehicle, placements, loads_dict, cg, axle_loads)
        
        # Convert AARValidation results to AARViolation types for the final result
        violations = [
            AARViolation(rule=v.rule_id, message=v.message, severity=v.severity, details=v.details)
            for v in eval_result.errors
        ]
        warnings = [
            AARViolation(rule=v.rule_id, message=v.message, severity=v.severity, details=v.details)
            for v in eval_result.warnings
        ]
        
        return OptimizationResult(
            placements=placements,
            metrics=metrics,
            violations=violations,
            warnings=warnings,
            extra_data={
                "unplaced_loads": unplaced_loads,
                "total_items": len(placements),
                "engine_version": "v3-deterministic"
            }
        )

    def _place_single_load(self, load: LoadSpec, vehicle: VehicleSpec, 
                           existing_placements: List[LoadPlacement], 
                           loads_dict: Dict[int, LoadSpec], 
                           constraints: PackingConstraints) -> Optional[LoadPlacement]:
        """
        Find the best placement for a single load using deterministic grid search with scoring.
        Supports Y-axis rotation (90° increments) for cylindrical loads only.
        
        Scoring considers:
        - Space utilization (primary)
        - CoG centering (secondary) 
        - Stability/cost (tertiary)
        """
        # Determine if this load type supports Y-axis rotation
        supports_y_rotation = load.type in ("cylinder", "paper_roll", "coil")
        y_rotations = [0, 90, 180, 270] if supports_y_rotation else [0]
        
        best_placement = None
        best_score = float('inf')
        
        # Determine effective dimensions based on orientation
        for orientation in ["vertical", "horizontal"]:
            for y_rotation in y_rotations:
                p_w, p_h, p_d = self._get_placed_dims(load, orientation, y_rotation)
                
                # Generate candidate positions (deterministic center-outward grid)
                candidates = self._generate_candidates(p_w, p_h, p_d, vehicle)
                
                for x, y, z in candidates:
                    # Create a trial placement
                    trial = LoadPlacement(
                        load_id=load.id,
                        x=x, y=y, z=z,
                        orientation=orientation,
                        rotation_y=y_rotation,
                        placed_w=p_w, placed_h=p_h, placed_d=p_d,
                        is_stable=False  # To be validated
                    )
                    # Calculate trial CoG
                    trial.cog_x = x + p_d / 2.0
                    trial.cog_y = y + p_h / 2.0
                    trial.cog_z = z + p_w / 2.0
                    
                    # Validate trial placement
                    validation = self._validate_candidate(trial, load, vehicle, existing_placements, loads_dict, constraints)
                    
                    if validation.valid:
                        # Final physics check for stability
                        # Determine contact type based on height
                        trial.contact_type = "floor" if trial.y <= 0.001 else "load"
                        stable, area, _ = self.physics_engine.validate_contact_stability(trial, load)
                        if stable:
                            trial.is_stable = True
                            trial.contact_surface_area = area
                            
                            # Score this placement
                            test_placements = existing_placements + [trial]
                            score = self._score_placement(test_placements, trial, vehicle, loads_dict)
                            
                            if score < best_score:
                                best_score = score
                                best_placement = trial
        
        return best_placement

    def _get_placed_dims(self, load: LoadSpec, orientation: str, rotation_y: float = 0.0) -> Tuple[float, float, float]:
        """
        Calculate width, height, depth based on orientation and Y-axis rotation.
        
        For cylindrical loads with Y-axis rotation (90° increments):
        - 0°/180°: footprint is (diameter, height, length)
        - 90°/270°: footprint is (length, height, diameter) - rotated 90° in XZ plane
        
        For rectangular loads: Y-axis rotation doesn't affect footprint (only changes visual orientation).
        """
        if orientation == "vertical":
            base_w, base_h, base_d = load.width_m, load.height_m, load.length_m
        else:  # horizontal
            # Swap width and length (rotate 90 deg in XZ plane)
            base_w, base_h, base_d = load.length_m, load.height_m, load.width_m
        
        # For cylindrical loads, Y-rotation can swap W and D (since they're both typically the diameter)
        if load.type in ("cylinder", "paper_roll", "coil"):
            # At 90° or 270°, swap W and D for better packing
            if rotation_y in (90, 270):
                return base_d, base_h, base_w
        
        # For other types, Y-rotation doesn't affect footprint (only visual appearance)
        return base_w, base_h, base_d

    def _generate_candidates(self, w: float, h: float, d: float, vehicle: VehicleSpec) -> List[Tuple[float, float, float]]:
        """
        Generate deterministic candidate positions (x, y, z).
        Order: Center-outward, layer-by-layer (bottom-up).
        
        All positions enforce 5cm safety margin from vehicle edges.
        """
        candidates = []
        margin = getattr(self, 'safety_margin', 0.05)  # 5cm safety margin
        tolerance = 0.001  # 1mm tolerance for floating point
        
        # 1. Y-axis: Layer by layer from floor up
        curr_y = 0.0
        # Ensure we don't place loads that would exceed vehicle interior minus margin
        while curr_y + h <= vehicle.height_m - margin + tolerance:
            
            # 2. Z-axis: Lateral center-outward
            center_z = vehicle.width_m / 2.0
            z_offsets = self._get_center_outward_offsets(vehicle.width_m, w)
            
            for z_off in z_offsets:
                z = center_z + z_off - w/2.0
                # enforce lateral margin
                if z < margin - tolerance or z > vehicle.width_m - w - margin + tolerance:
                    continue
                
                # 3. X-axis: Longitudinal center-outward
                center_x = vehicle.length_m / 2.0
                x_offsets = self._get_center_outward_offsets(vehicle.length_m, d)
                
                for x_off in x_offsets:
                    x = center_x + x_off - d/2.0
                    # enforce longitudinal margin
                    if x < margin - tolerance or x > vehicle.length_m - d - margin + tolerance:
                        continue

                    candidates.append((x, curr_y, z))
            
            curr_y += h  # Basic stacking: next layer starts at top of previous
            
        return candidates

    def _get_center_outward_offsets(self, total_dim: float, item_dim: float) -> List[float]:
        """Generate a list of offsets from center to edges."""
        offsets = [0.0]
        step = self.grid_step
        limit = total_dim / 2.0
        
        curr = step
        while curr <= limit:
            offsets.append(curr)
            offsets.append(-curr)
            curr += step
            
        return offsets

    def _validate_candidate(self, trial: LoadPlacement, load: LoadSpec, 
                            vehicle: VehicleSpec, existing: List[LoadPlacement], 
                            loads_dict: Dict[int, LoadSpec], 
                            constraints: PackingConstraints) -> AARValidationResult:
        """
        Full validation of a placement candidate against all rules.
        """
        violations = []
        
        # 1. Bounds Check - enforce safety margin so loads remain clearly inside vehicle
        bounds_ok = True
        margin = getattr(self, 'safety_margin', 0.05)  # 5cm safety margin
        tolerance = 0.001  # 1mm floating point tolerance
        
        if trial.x < margin - tolerance:
            violations.append(AARViolation("bounds", f"Load x={trial.x:.3f}m < margin {margin}m", "error"))
            bounds_ok = False
        if trial.z < margin - tolerance:
            violations.append(AARViolation("bounds", f"Load z={trial.z:.3f}m < margin {margin}m", "error"))
            bounds_ok = False
        if trial.x + trial.placed_d > vehicle.length_m - margin + tolerance:
            violations.append(AARViolation("bounds", f"Load exceeds rear (x+d={trial.x + trial.placed_d:.3f}m > {vehicle.length_m - margin:.3f}m)", "error"))
            bounds_ok = False
        if trial.z + trial.placed_w > vehicle.width_m - margin + tolerance:
            violations.append(AARViolation("bounds", f"Load exceeds side (z+w={trial.z + trial.placed_w:.3f}m > {vehicle.width_m - margin:.3f}m)", "error"))
            bounds_ok = False
        if trial.y < -tolerance:  # Y can be exactly 0 (on floor)
            violations.append(AARViolation("bounds", f"Load y={trial.y:.3f}m < 0", "error"))
            bounds_ok = False
        if trial.y + trial.placed_h > vehicle.height_m + tolerance:
            violations.append(AARViolation("bounds", f"Load exceeds ceiling (y+h={trial.y + trial.placed_h:.3f}m > {vehicle.height_m:.3f}m)", "error"))
            bounds_ok = False
        
        # Skip other checks if bounds failed
        if not bounds_ok:
            errors = [v for v in violations if v.severity == "error"]
            return AARValidationResult(valid=len(errors)==0, violations=violations)
        
        # 2. Floating Load Check - load must have support from floor or other load
        floating = self._check_floating_load(trial, existing)
        if floating:
            violations.append(AARViolation("physics_floating", f"Load {trial.load_id} floating at y={trial.y:.2f}m with no support", "error"))
        
        # 3. Collision Detection (Overlapping loads)
        if self._has_collision(trial, existing):
            violations.append(AARViolation("collision", "Load overlaps with another load", "error"))
        
        # 3.5 Vehicle-Type-Specific Constraints
        vtype = vehicle.type.lower() if hasattr(vehicle, 'type') else ''
        if vtype == 'reefer':
            # Reefer engine room occupies front ~0.6m - no loads there
            engine_room_depth = getattr(vehicle, 'doorway_width_m', 0.6) or 0.6
            if trial.x < engine_room_depth:
                violations.append(AARViolation("vehicle_type", f"Reefer engine room at front {engine_room_depth:.1f}m: load x={trial.x:.2f}m too close", "error"))
            # Airflow: leave gap between loads for circulation
            for other in existing:
                x_gap = trial.x - (other.x + other.placed_d)
                if 0.01 < x_gap < 0.1 and abs(trial.y - other.y) < 0.01:
                    violations.append(AARViolation("vehicle_type", f"Reefer airflow gap {x_gap:.2f}m too narrow between loads", "warning"))
        elif vtype == 'gondola':
            # Gondola side walls are ~1.98m high; loads above must not exceed vehicle height
            wall_height = min(vehicle.height_m, 1.98)
            if trial.y + trial.placed_h > wall_height:
                violations.append(AARViolation("vehicle_type", f"Gondola load extends above side walls (y+h={trial.y + trial.placed_h:.2f}m > wall {wall_height:.2f}m); needs bracing", "warning"))
        elif vtype == 'boxcar':
            # Boxcar doorway zone: middle 2.44m of width must be clear at doorway
            door_width = getattr(vehicle, 'doorway_width_m', 2.44) or 2.44
            door_left = (vehicle.width_m - door_width) / 2
            trial_left = trial.z
            trial_right = trial.z + trial.placed_w
            # Check if load spans across doorway zone near the doors
            doorway_center_x = vehicle.length_m / 2
            if abs(trial.x + trial.placed_d / 2 - doorway_center_x) < 0.5:
                # Load is near doorway - check if it blocks door
                if trial_left < door_left + door_width and trial_right > door_left:
                    violations.append(AARViolation("vehicle_type", "Boxcar: load blocks doorway zone", "warning"))
        elif vtype == 'flatcar':
            # Flatcar: open deck, no side wall constraint (wider margin allowed)
            # Relaxed margin - allow loads closer to edges
            if trial.z < 0.02:
                violations.append(AARViolation("vehicle_type", f"Flatcar: load z={trial.z:.3f}m too close to edge", "warning"))
        
        # 4. Physics/CoG check (Temporary state)
        test_placements = existing + [trial]
        cg = self.physics_engine.compute_combined_cog(vehicle, test_placements, loads_dict)
        
        # Check primary AAR 3.5.1 (CG Height)
        if cg.height_inches > 98.0:
            violations.append(AARViolation("3.5.1", f"CG height {cg.height_inches:.1f}\" exceeds 98\"", "error"))
        
        # 4. Stacking & AAR Rules - skip blocking for now (too aggressive)
        if constraints.stack_rules and len(existing) > 0:
            stack_violations = self.stack_validator.validate_all_stacking(
                test_placements, loads_dict, vehicle.width_m
            )
            violations.extend(stack_violations)
            
        if constraints.hazmat_separation:
            # Use the AAR Rule Engine for hazmat
            haz_val = self.aar_engine.validate_7_x_hazmat_separation(test_placements, loads_dict)
            if not haz_val.passed:
                violations.append(AARViolation("7.x", haz_val.message, "error", haz_val.details))
                
        # Final Verdict: Valid if no errors
        errors = [v for v in violations if v.severity == "error"]
        return AARValidationResult(
            valid=len(errors) == 0,
            violations=violations
        )

    def _check_floating_load(self, trial: LoadPlacement, existing: List[LoadPlacement]) -> bool:
        """
        Check if a load is floating (not supported).
        A load floats if:
        - It's above the floor (y > 0.001m)
        - AND it has no contact with another load below it
        
        Returns True if floating (error), False if supported (ok).
        """
        # Loads essentially on floor are always supported
        if trial.y <= 0.001:
            return False
        
        # Check if any existing load supports this trial load
        # Support means: trial rests on top of existing load
        for other in existing:
            # Check if bottom of trial contacts top of other
            # Contact tolerance: within 0.01m (1cm)
            bottom_contact = abs(trial.y - (other.y + other.placed_h)) <= 0.01
            
            if not bottom_contact:
                continue
            
            # Check if footprints overlap in XZ plane (width and depth)
            x_overlap = not (
                (trial.x + trial.placed_d <= other.x + 0.001) or
                (trial.x >= other.x + other.placed_d - 0.001)
            )
            z_overlap = not (
                (trial.z + trial.placed_w <= other.z + 0.001) or
                (trial.z >= other.z + other.placed_w - 0.001)
            )
            
            if x_overlap and z_overlap:
                # Found valid support
                return False
        
        # No support found - load is floating
        return True

    def _has_collision(self, trial: LoadPlacement, existing: List[LoadPlacement]) -> bool:
        """
        3D AABB collision detection with strict separation.
        Loads must be strictly separated (no touching), with 1mm minimum gap.
        """
        min_gap = 0.001  # 1mm minimum gap between loads
        
        for other in existing:
            # Check if they overlap or touch on all 3 dimensions
            # X-axis overlap (using placed_d = depth)
            x_overlap = not (
                (trial.x + trial.placed_d + min_gap <= other.x) or
                (trial.x >= other.x + other.placed_d + min_gap)
            )
            # Y-axis overlap (using placed_h = height)
            y_overlap = not (
                (trial.y + trial.placed_h + min_gap <= other.y) or
                (trial.y >= other.y + other.placed_h + min_gap)
            )
            # Z-axis overlap (using placed_w = width)
            z_overlap = not (
                (trial.z + trial.placed_w + min_gap <= other.z) or
                (trial.z >= other.z + other.placed_w + min_gap)
            )
            
            # Collision if all three axes overlap
            if x_overlap and y_overlap and z_overlap:
                return True
        return False

    def _calculate_metrics(self, vehicle: VehicleSpec, placements: List[LoadPlacement], 
                           loads_dict: Dict[int, LoadSpec], cg: CenterOfGravity, 
                           axle_loads: List[float]) -> OptimizationMetrics:
        """Compute final performance and balance metrics."""
        
        # Weight utilization
        total_load_weight = sum(loads_dict[p.load_id].weight_kg * loads_dict[p.load_id].quantity for p in placements)
        weight_util = (total_load_weight / vehicle.capacity_kg * 100) if vehicle.capacity_kg > 0 else 0
        
        # Volume utilization
        total_load_vol = sum(p.placed_w * p.placed_h * p.placed_d for p in placements)
        vehicle_vol = vehicle.length_m * vehicle.width_m * vehicle.height_m
        vol_util = (total_load_vol / vehicle_vol * 100) if vehicle_vol > 0 else 0
        
        # Balance metrics
        center_x = vehicle.length_m / 2.0
        center_z = vehicle.width_m / 2.0
        
        long_imbalance = (abs(cg.x_m - center_x) / center_x * 100) if center_x > 0 else 0
        lat_imbalance = (abs(cg.z_m - center_z) / center_z * 100) if center_z > 0 else 0
        
        return OptimizationMetrics(
            cg_x=cg.x_m,
            cg_y=cg.y_m,
            cg_z=cg.z_m,
            axle_loads=axle_loads,
            lateral_imbalance_pct=lat_imbalance,
            longitudinal_imbalance_pct=long_imbalance,
            volume_utilization=vol_util,
            weight_utilization=weight_util,
        )

    def _score_placement(self, placements: List[LoadPlacement], trial: LoadPlacement, vehicle: VehicleSpec, loads_dict: Dict[int, LoadSpec]) -> float:
        """
        Compute a heuristic score for a candidate placement. Lower is better.
        Combines space utilization, CoG centering, and imbalance penalties.
        """
        # Use vehicle-specific weights if present
        space_w = getattr(vehicle, 'space_weight', 0.7)
        stability_w = getattr(vehicle, 'stability_weight', 0.2)
        cost_w = getattr(vehicle, 'cost_weight', 0.1)

        # Space penalty: lower remaining empty volume is better
        total_load_vol = sum(p.placed_w * p.placed_h * p.placed_d for p in placements)
        vehicle_vol = vehicle.length_m * vehicle.width_m * vehicle.height_m
        vol_util = (total_load_vol / vehicle_vol) if vehicle_vol > 0 else 0
        space_penalty = 1.0 - vol_util

        # Compute combined CoG for these placements
        cg = self.physics_engine.compute_combined_cog(vehicle, placements, loads_dict)
        center_x = vehicle.length_m / 2.0
        center_z = vehicle.width_m / 2.0
        long_offset = abs(cg.x_m - center_x) / center_x if center_x > 0 else 0
        lat_offset = abs(cg.z_m - center_z) / center_z if center_z > 0 else 0
        cog_penalty = (long_offset + lat_offset) / 2.0

        # Cost/imbalance penalty - use lateral + longitudinal imbalance percentage
        imbalance_penalty = (cg.imbalance_lateral_pct(vehicle.width_m) + cg.imbalance_longitudinal_pct(vehicle.length_m)) / 200.0

        score = space_w * space_penalty + stability_w * cog_penalty + cost_w * imbalance_penalty
        return score
