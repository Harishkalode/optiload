"""
AAR Stack Validator: Stacking Rules per AAR 2019 - Phase 1.3

Validates:
- AAR 4.12: Roll patterns (paper rolls, coils)
- AAR 6.3: Blocking requirements for incomplete layers
- AAR 6.6: Fragile item stacking restrictions
"""

from typing import List, Tuple
from app.core.optimization.types import LoadPlacement, LoadSpec, AARViolation


class AARStackValidator:
    """
    Validates stacking rules per AAR 2019 standards.
    """
    
    # ========================================================================
    # AAR 4.12 - ROLL STACKING PATTERNS
    # ========================================================================
    
    def validate_roll_stacking(self, placements: List[LoadPlacement],
                               loads_dict: dict[int, LoadSpec]) -> List[AARViolation]:
        """
        AAR 4.12: Paper rolls and coils follow specific stacking patterns.
        
        - Single layer: Any arrangement
        - Two layers: Must be perpendicular (90° rotation)
        - Three layers: Must follow center blocking pattern
        - Incomplete layers: Must have blocking to prevent movement
        
        Returns list of violations (empty = compliant).
        """
        # Identify rolls (cylindrical loads)
        roll_placements = [
            p for p in placements 
            if loads_dict.get(p.load_id) and 
            loads_dict[p.load_id].type in ["roll", "coil", "paper_roll"]
        ]
        
        violations = []
        
        if len(roll_placements) < 2:
            return violations  # No stacking rules for single roll
        
        # Group rolls by layer (y coordinate, rounded to 2cm)
        layers = {}
        for p in roll_placements:
            layer_key = round(p.y, 2)
            if layer_key not in layers:
                layers[layer_key] = []
            layers[layer_key].append(p)
        
        layer_count = len(layers)
        
        # Maximum 3 layers per AAR 4.12
        if layer_count > 3:
            violations.append(AARViolation(
                rule="4.12",
                message=f"Too many roll layers: {layer_count} (max 3 per AAR 4.12)",
                severity="error",
                details={"layer_count": layer_count}
            ))
        
        # Validate perpendicularity between layers
        sorted_layers = sorted(layers.items())
        for layer_idx in range(1, len(sorted_layers)):
            prev_layer_items = sorted_layers[layer_idx - 1][1]
            curr_layer_items = sorted_layers[layer_idx][1]
            
            # Check if orientations are perpendicular (different)
            for prev_roll in prev_layer_items:
                for curr_roll in curr_layer_items:
                    if prev_roll.orientation == curr_roll.orientation:
                        violations.append(AARViolation(
                            rule="4.12",
                            message=f"Layer {layer_idx}: Rolls not perpendicular to layer {layer_idx-1} "
                                   f"(both {prev_roll.orientation})",
                            severity="error",
                            details={
                                "layer": layer_idx,
                                "prev_layer": layer_idx - 1,
                                "orientation": prev_roll.orientation,
                            }
                        ))
                        break
        
        return violations
    
    # ========================================================================
    # AAR 6.3 - BLOCKING FOR INCOMPLETE LAYERS
    # ========================================================================
    
    def validate_incomplete_layer_blocking(self, placements: List[LoadPlacement],
                                          vehicle_width: float) -> List[AARViolation]:
        """
        AAR 6.3: If a layer doesn't span the full vehicle width, 
        blocking/bracing must prevent transverse load movement.
        
        Returns list of violations (empty = compliant).
        """
        violations = []
        
        if not placements:
            return violations
        
        # Group placements by layer (y coordinate, rounded to 1cm)
        layers = {}
        for p in placements:
            layer_key = round(p.y, 2)
            if layer_key not in layers:
                layers[layer_key] = []
            layers[layer_key].append(p)
        
        # Validate each layer
        for layer_y, layer_items in layers.items():
            if not layer_items:
                continue
            
            # Calculate coverage width (Z axis)
            min_z = min(p.z for p in layer_items)
            max_z = max((p.z + p.placed_w) for p in layer_items)
            coverage_width = max_z - min_z
            
            # Check if incomplete
            coverage_pct = (coverage_width / vehicle_width * 100) if vehicle_width > 0 else 0
            
            if coverage_width < vehicle_width * 0.95:  # Allow 5% margin
                violations.append(AARViolation(
                    rule="6.3",
                    message=f"Layer {layer_y:.2f}m: Incomplete coverage ({coverage_pct:.1f}%) "
                           f"- requires blocking per AAR 6.3",
                    severity="warning",
                    details={
                        "layer_y_m": layer_y,
                        "coverage_width_m": coverage_width,
                        "vehicle_width_m": vehicle_width,
                        "coverage_pct": coverage_pct,
                        "load_count": len(layer_items),
                    }
                ))
        
        return violations
    
    # ========================================================================
    # AAR 6.6 - FRAGILE ITEM STACKING
    # ========================================================================
    
    def validate_fragile_stacking(self, placements: List[LoadPlacement],
                                  loads_dict: dict[int, LoadSpec]) -> List[AARViolation]:
        """
        AAR 6.6: Fragile items cannot have other loads on top.
        
        Fragile items must be on top layer or have clearance above.
        
        Returns list of violations (empty = compliant).
        """
        violations = []
        
        # Identify fragile items
        fragile_placements = [
            p for p in placements 
            if loads_dict.get(p.load_id) and loads_dict[p.load_id].fragile
        ]
        
        if not fragile_placements:
            return violations
        
        # For each fragile item, check if anything is above it
        for fragile_p in fragile_placements:
            fragile_load = loads_dict.get(fragile_p.load_id)
            
            # Check all other placements
            for other_p in placements:
                if other_p.load_id == fragile_p.load_id:
                    continue  # Same load
                
                # Check if other load is positioned above fragile item
                fragile_top = fragile_p.y + fragile_p.placed_h
                other_bottom = other_p.y
                
                # If other load is above (more than 1cm clearance needed)
                if other_bottom < fragile_top + 0.01:  # Less than 1cm clearance
                    # Check if loads overlap in X-Z plane
                    x_overlap = not (
                        (other_p.x + other_p.placed_d <= fragile_p.x) or
                        (other_p.x >= fragile_p.x + fragile_p.placed_d)
                    )
                    z_overlap = not (
                        (other_p.z + other_p.placed_w <= fragile_p.z) or
                        (other_p.z >= fragile_p.z + fragile_p.placed_w)
                    )
                    
                    if x_overlap and z_overlap:
                        other_load = loads_dict.get(other_p.load_id)
                        violations.append(AARViolation(
                            rule="6.6",
                            message=f"Fragile load {fragile_load.id} has load on top "
                                   f"(load {other_load.id if other_load else other_p.load_id}) "
                                   f"- violates AAR 6.6",
                            severity="error",
                            details={
                                "fragile_load_id": fragile_p.load_id,
                                "load_on_top_id": other_p.load_id,
                                "fragile_top_m": fragile_top,
                                "load_on_top_bottom_m": other_bottom,
                                "clearance_m": other_bottom - fragile_top,
                            }
                        ))
        
        return violations
    
    # ========================================================================
    # LOAD COMPATIBILITY CHECKING
    # ========================================================================
    
    def can_stack(self, load_below: LoadSpec, load_above: LoadSpec) -> Tuple[bool, str]:
        """
        Determine if two loads can be stacked (one on top of the other).
        
        Returns tuple of (can_stack, reason).
        """
        reason = ""
        
        # Rule 1: Fragile items cannot have other loads on top
        if load_below.fragile:
            return False, "Load below is fragile - cannot have loads on top (AAR 6.6)"
        
        # Rule 2: Non-stackable items cannot have loads on top
        if not load_below.stackable:
            return False, "Load below is marked non-stackable"
        
        # Rule 3: Some hazmat classes are incompatible
        if load_below.hazmat_class and load_above.hazmat_class:
            incompatible = [
                ("3", "1"),  # Flammable + explosives
                ("4", "1"),  # Flammable solids + explosives
                ("5.1", "3"),  # Oxidizers + flammables
            ]
            
            for (class_a, class_b) in incompatible:
                if (load_below.hazmat_class == class_a and load_above.hazmat_class == class_b) or \
                   (load_below.hazmat_class == class_b and load_above.hazmat_class == class_a):
                    return False, f"Incompatible hazmat: {load_below.hazmat_class} and {load_above.hazmat_class}"
        
        return True, "Can stack"
    
    # ========================================================================
    # COMPREHENSIVE STACKING VALIDATION
    # ========================================================================
    
    def validate_all_stacking(self, placements: List[LoadPlacement],
                             loads_dict: dict[int, LoadSpec],
                             vehicle_width: float) -> List[AARViolation]:
        """
        Comprehensive stacking validation combining all rules.
        
        Returns list of all violations found.
        """
        violations = []
        
        # AAR 4.12: Roll patterns
        violations.extend(self.validate_roll_stacking(placements, loads_dict))
        
        # AAR 6.3: Blocking for incomplete layers
        violations.extend(self.validate_incomplete_layer_blocking(placements, vehicle_width))
        
        # AAR 6.6: Fragile items
        violations.extend(self.validate_fragile_stacking(placements, loads_dict))
        
        return violations
