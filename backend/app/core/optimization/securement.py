"""
Securement Engine: AAR-Compliant Load Securement Suggestions - Phase 1.5

Suggests securement devices based on:
- AAR 6.1: Void fillers (airbags) to prevent movement
- AAR 6.3: Blocking and bracing for incomplete layers
- AAR 5.x: Straps and tie-downs for stability
- Hazmat requirements for securement

Goal: Provide actionable recommendations to the loader to ensure safety.
"""

from dataclasses import dataclass
from typing import List, Tuple
from app.core.optimization.types import LoadPlacement, LoadSpec, VehicleSpec


@dataclass
class SecurementSuggestion:
    """Recommendation for a specific securement device."""
    type: str  # "airbag", "strap", "block", "riser", "mat"
    location: Tuple[float, float, float]  # (x, y, z) position in vehicle
    quantity: int
    reason: str  # AAR rule reference and explanation
    severity: str  # "critical" (required), "recommended" (best practice)


class SecurementEngine:
    """
    Analyze placements and suggest securement devices per AAR 2019.
    """
    
    VOID_GAP_THRESHOLD_M = 0.3  # Gaps > 30cm require airbags (AAR 6.1)
    
    def suggest_securements(self, placements: List[LoadPlacement],
                           loads_dict: dict[int, LoadSpec],
                           vehicle: VehicleSpec) -> List[SecurementSuggestion]:
        """
        Analyze final placements and suggest necessary securements.
        """
        suggestions = []
        
        # 1. Analyze Longitudinal Void Gaps (AAR 6.1)
        # Identify gaps between loads along the length of the car
        suggestions.extend(self._analyze_longitudinal_gaps(placements, vehicle))
        
        # 2. Analyze Lateral Void Gaps (AAR 6.1)
        # Identify gaps between loads and car walls
        suggestions.extend(self._analyze_lateral_gaps(placements, vehicle))
        
        # 3. Analyze Incomplete Layers (AAR 6.3)
        # If a layer doesn't fill the width, suggest side blocking
        suggestions.extend(self._analyze_layer_blocking(placements, vehicle))
        
        # 4. Hazmat specific securements (AAR 7.x)
        suggestions.extend(self._analyze_hazmat_securement(placements, loads_dict))
        
        # 5. Fragile load padding (AAR 6.6)
        suggestions.extend(self._analyze_fragile_padding(placements, loads_dict))
        
        return suggestions

    def _analyze_longitudinal_gaps(self, placements: List[LoadPlacement], 
                                   vehicle: VehicleSpec) -> List[SecurementSuggestion]:
        """
        Detect gaps along the X-axis (length) between loads.
        If gap > 30cm, suggest airbags.
        """
        suggestions = []
        
        # Group loads by layer (y) and lane (z)
        # This is a simplified approximation
        for p in placements:
            # Check for loads "behind" this one in the same lane
            for other in placements:
                if p.load_id == other.load_id: continue
                
                # Same lane (approx)
                if abs(p.z - other.z) < 0.1 and abs(p.y - other.y) < 0.1:
                    # If other is in front of p
                    gap = other.x - (p.x + p.placed_d)
                    if 0.3 < gap < 2.0:  # Gap between 30cm and 2m
                        suggestions.append(SecurementSuggestion(
                            type="airbag",
                            location=((p.x + p.placed_d + gap/2), p.y, p.z),
                            quantity=1,
                            reason="AAR 6.1: Longitudinal void gap > 30cm. Airbag required to prevent shifting.",
                            severity="critical"
                        ))
        
        return suggestions

    def _analyze_lateral_gaps(self, placements: List[LoadPlacement], 
                               vehicle: VehicleSpec) -> List[SecurementSuggestion]:
        """
        Detect gaps between loads and car walls (Z-axis).
        """
        suggestions = []
        
        for p in placements:
            # Left gap
            left_gap = p.z
            if 0.3 < left_gap < 1.0:
                suggestions.append(SecurementSuggestion(
                    type="airbag",
                    location=(p.x + p.placed_d/2, p.y, left_gap/2),
                    quantity=1,
                    reason="AAR 6.1: Lateral void gap on left. Airbag recommended.",
                    severity="recommended"
                ))
            
            # Right gap
            right_gap = vehicle.width_m - (p.z + p.placed_w)
            if 0.3 < right_gap < 1.0:
                suggestions.append(SecurementSuggestion(
                    type="airbag",
                    location=(p.x + p.placed_d/2, p.y, p.z + p.placed_w + right_gap/2),
                    quantity=1,
                    reason="AAR 6.1: Lateral void gap on right. Airbag recommended.",
                    severity="recommended"
                ))
                
        return suggestions

    def _analyze_layer_blocking(self, placements: List[LoadPlacement], 
                               vehicle: VehicleSpec) -> List[SecurementSuggestion]:
        """
        Identify incomplete layers (AAR 6.3) and suggest blocking.
        """
        suggestions = []
        
        layers = {}
        for p in placements:
            layer_key = round(p.y, 2)
            if layer_key not in layers:
                layers[layer_key] = []
            layers[layer_key].append(p)
            
        for layer_y, layer_items in layers.items():
            min_z = min(p.z for p in layer_items)
            max_z = max((p.z + p.placed_w) for p in layer_items)
            coverage = max_z - min_z
            
            if coverage < vehicle.width_m * 0.95:
                # Suggest blocking on the sides of the layer
                suggestions.append(SecurementSuggestion(
                    type="block",
                    location=(vehicle.length_m/2, layer_y, min_z/2 if min_z > 0 else 0),
                    quantity=2,
                    reason="AAR 6.3: Incomplete layer. Side blocking required to prevent transverse movement.",
                    severity="critical"
                ))
                
        return suggestions

    def _analyze_hazmat_securement(self, placements: List[LoadPlacement], 
                                   loads_dict: dict[int, LoadSpec]) -> List[SecurementSuggestion]:
        """
        Suggest specific securements for hazardous materials.
        """
        suggestions = []
        
        for p in placements:
            load = loads_dict.get(p.load_id)
            if load and load.hazmat_class:
                # All hazmat loads must be secured with straps
                suggestions.append(SecurementSuggestion(
                    type="strap",
                    location=(p.x + p.placed_d/2, p.y + p.placed_h, p.z + p.placed_w/2),
                    quantity=2,
                    reason=f"AAR 7.x: Hazmat Class {load.hazmat_class} requires dedicated tie-down straps.",
                    severity="critical"
                ))
                
        return suggestions

    def _analyze_fragile_padding(self, placements: List[LoadPlacement], 
                                 loads_dict: dict[int, LoadSpec]) -> List[SecurementSuggestion]:
        """
        Suggest padding for fragile items.
        """
        suggestions = []
        
        for p in placements:
            load = loads_dict.get(p.load_id)
            if load and load.fragile:
                suggestions.append(SecurementSuggestion(
                    type="mat",
                    location=(p.x + p.placed_d/2, p.y, p.z + p.placed_w/2),
                    quantity=1,
                    reason="AAR 6.6: Fragile load detected. Rubber mat/padding recommended for base.",
                    severity="recommended"
                ))
                
        return suggestions


# Module-level function for compatibility with engine_v2
def suggest_securements(placements: List[LoadPlacement],
                       loads: List[LoadSpec],
                       vehicle: VehicleSpec) -> List[SecurementSuggestion]:
    """
    Convenience function to suggest securements for a set of placements.
    """
    engine = SecurementEngine()
    loads_dict = {l.id: l for l in loads}
    return engine.suggest_securements(placements, loads_dict, vehicle)
