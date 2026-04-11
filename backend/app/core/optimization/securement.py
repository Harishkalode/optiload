"""Securement suggestion engine based on AAR rules 5.x and 6.x."""

from typing import Dict, List
from app.core.optimization.types import LoadPlacement, LoadSpec, VehicleSpec
from app.core.optimization.rule_registry import get_rule_registry


class SecurementSuggester:
    """Generate securement suggestions based on placement and load specs."""

    def __init__(self):
        self.registry = get_rule_registry()

    def suggest_securements(self, 
        placements: List[LoadPlacement],
        load_specs: List[LoadSpec],
        vehicle: VehicleSpec
    ) -> List[Dict]:
        """Suggest securements: airbags, straps, fillers, risers."""
        load_map = {l.id: l for l in load_specs}
        securements = []

        # Rule 6.1-6.2: Airbag sizing
        securements.extend(self._suggest_airbags(placements, load_map, vehicle))

        # Rule 7.3-7.4: Doorway straps
        securements.extend(self._suggest_doorway_straps(placements, load_map, vehicle))

        # Rule 5.7: Risers for incomplete layers
        securements.extend(self._suggest_risers(placements, load_map, vehicle))

        # Rule 5.5: Rubber mat placement
        securements.extend(self._suggest_rubber_mats(placements, load_map, vehicle))

        return securements

    def _suggest_airbags(self, placements: List[LoadPlacement],
                        load_map: Dict, vehicle: VehicleSpec) -> List[Dict]:
        """Suggest airbags per rule 5.4.1 and 6.1-6.2."""
        airbags = []

        # Rule 5.4.1: Airbag levels by weight
        def get_airbag_level(weight_kg: float) -> int:
            if weight_kg <= 75000:
                return 2  # Level 2: ≤75k lb
            elif weight_kg <= 160000:
                return 3  # Level 3: ≤160k lb
            elif weight_kg <= 216000:
                return 4  # Level 4: ≤216k lb (horizontal ≤190k)
            else:
                return 5  # Level 5: ≤216k lb

        for placement in placements:
            load = load_map.get(placement.load_id)
            if not load:
                continue

            level = get_airbag_level(load.weight_kg)

            # Rule 6.1: Vertical airbags for lateral voids
            # Suggest if gap between load and wall > 0.3m
            if placement.z > 0.5:  # Gap from left wall
                airbags.append({
                    "type": f"airbag_level_{level}",
                    "variant": "vertical",
                    "position": [
                        placement.x + placement.placed_w / 2,
                        placement.y + placement.placed_h / 2,
                        placement.z - 0.2
                    ],
                    "load_id": placement.load_id,
                    "min_width_m": max(placement.placed_w - 0.25, 0.3),
                    "reason": f"Fill void beside load (level {level})"
                })

            # Rule 6.2: Horizontal airbags for lengthwise voids
            if placement.x > 0.5:
                airbags.append({
                    "type": f"airbag_level_{level}",
                    "variant": "horizontal",
                    "position": [
                        placement.x - 0.2,
                        placement.y + placement.placed_h / 2,
                        placement.z + placement.placed_d / 2
                    ],
                    "load_id": placement.load_id,
                    "min_width_m": 0.36,
                    "min_height_m": max(placement.placed_h * 0.67, 0.5),
                    "reason": f"Fill void in front of load (level {level})"
                })

        return airbags

    def _suggest_doorway_straps(self, placements: List[LoadPlacement],
                               load_map: Dict, vehicle: VehicleSpec) -> List[Dict]:
        """Suggest straps per rule 7.3-7.4."""
        straps = []
        doorway_zone_start = vehicle.length_m * 0.8

        for placement in placements:
            # Rule 7.1: Doorway protection required if load extends into doorway
            if placement.x + placement.placed_w > doorway_zone_start:
                load = load_map.get(placement.load_id)
                if not load:
                    continue

                # Rule 7.3.2-7.3.3: Steel strap count by width
                strap_count = 1 if placement.placed_w < 0.635 else 2  # 25 inches
                strap_type = "steel_strap"

                straps.append({
                    "type": strap_type,
                    "count": strap_count,
                    "per_layer": True,
                    "position": [placement.x + placement.placed_w / 2, placement.y, placement.z],
                    "load_id": placement.load_id,
                    "reason": f"Doorway protection ({strap_count} strap{'s' if strap_count > 1 else ''})"
                })

        return straps

    def _suggest_risers(self, placements: List[LoadPlacement],
                       load_map: Dict, vehicle: VehicleSpec) -> List[Dict]:
        """Suggest risers per rule 5.7."""
        risers = []

        # Detect incomplete layers (where some positions are empty)
        by_layer = {}
        for p in placements:
            layer = int(p.y / max(p.placed_h, 0.1))
            if layer not in by_layer:
                by_layer[layer] = []
            by_layer[layer].append(p)

        for layer_idx, layer_placements in by_layer.items():
            if layer_idx == 0:
                continue  # Skip floor layer

            # Rule 5.7: If layer is incomplete, suggest risers for next layer
            total_positions_possible = int(vehicle.length_m / max(p.placed_w for p in layer_placements))
            if len(layer_placements) < total_positions_possible * 0.8:  # <80% full
                for placement in layer_placements:
                    load = load_map.get(placement.load_id)
                    if not load:
                        continue

                    # Rule 5.7.7: Riser crush strength
                    crush_strength = 9000 if len(layer_placements) < 3 else 6000

                    risers.append({
                        "type": "riser",
                        "crush_strength_psf": crush_strength,
                        "position": [placement.x, placement.y, placement.z],
                        "load_id": placement.load_id,
                        "reason": f"Support incomplete layer {layer_idx} (crush ≥{crush_strength} psf)"
                    })

        return risers

    def _suggest_rubber_mats(self, placements: List[LoadPlacement],
                            load_map: Dict, vehicle: VehicleSpec) -> List[Dict]:
        """Suggest rubber mats per rule 5.5."""
        mats = []

        # Rule 5.5.3: Rubber mats under doorway rolls
        doorway_zone_start = vehicle.length_m * 0.8
        for placement in placements:
            if placement.x + placement.placed_w > doorway_zone_start and placement.y < 0.1:
                mats.append({
                    "type": "rubber_mat",
                    "thickness_mm": 2,
                    "coverage_pct": 50,  # Rule 5.5.2: ≥50%
                    "position": [placement.x, 0, placement.z],
                    "load_id": placement.load_id,
                    "reason": "Doorway floor protection (≥2mm thick)"
                })
                # Rule 5.5.4: Don't reuse mats (noted in description)

        return mats


def suggest_securements(placements: List[LoadPlacement],
                       load_specs: List[LoadSpec],
                       vehicle: VehicleSpec) -> List[Dict]:
    """Wrapper function."""
    suggester = SecurementSuggester()
    return suggester.suggest_securements(placements, load_specs, vehicle)
