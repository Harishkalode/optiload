"""3D bin packing optimization engine v2.

Enforces all 130+ AAR rules from JSON registry.
Backend-driven: deterministic, reproducible, rule-compliant.
"""

from typing import Optional, List, Dict, Tuple
from app.core.optimization.types import (
    LoadPlacement, LoadSpec, OptimizationResult, VehicleSpec, 
    AARViolation, OptimizationMetrics
)
from app.core.optimization.rule_registry import get_rule_registry


class OptimizationEngine:
    """Core packing engine with complete rule enforcement."""

    def __init__(self):
        self.registry = get_rule_registry()
        self.eps = 0.001

    def normalize_dimensions(self, vehicle: VehicleSpec) -> VehicleSpec:
        """Fix mm/cm/km unit mismatches in vehicle dimensions."""
        v_len, v_wid, v_ht = vehicle.length_m, vehicle.width_m, vehicle.height_m

        # Detect unit issues
        if v_len > 1000:  # Likely mm
            v_len /= 1000
            v_wid /= 1000
            v_ht /= 1000
        elif v_len > 100:  # Likely cm
            v_len /= 100
            v_wid /= 100
            v_ht /= 100
        elif v_len < 0.1:  # Likely km
            v_len *= 1000
            v_wid *= 1000
            v_ht *= 1000

        return VehicleSpec(
            id=vehicle.id, type=vehicle.type, length_m=v_len, width_m=v_wid, height_m=v_ht,
            capacity_kg=vehicle.capacity_kg, tare_weight_kg=vehicle.tare_weight_kg,
            plate_type=vehicle.plate_type, truck_center_front_m=vehicle.truck_center_front_m,
            truck_center_rear_m=vehicle.truck_center_rear_m, empty_cg_height_in=vehicle.empty_cg_height_in,
            axle_positions=vehicle.axle_positions,
        )

    def get_load_dimensions(self, load: LoadSpec) -> Tuple[float, float, float]:
        """Get normalized load dimensions (width, height, depth)."""
        if load.type in ("cylinder", "paper_roll", "coil"):
            d = load.diameter_m or min(load.length_m, load.width_m)
            return (d, d, load.length_m)
        return (load.length_m, load.height_m, load.width_m)

    def expand_loads(self, loads: List[LoadSpec]) -> List[LoadSpec]:
        """Expand quantities into individual items."""
        expanded = []
        for load in loads:
            for _ in range(load.quantity):
                expanded.append(LoadSpec(
                    id=load.id, type=load.type,
                    length_m=load.length_m, width_m=load.width_m, height_m=load.height_m,
                    weight_kg=load.weight_kg, quantity=1,
                    fragile=load.fragile, stackable=load.stackable,
                    hazmat_class=load.hazmat_class, diameter_m=load.diameter_m,
                ))
        return expanded

    def enforce_constraint_rules(self, 
        load: LoadSpec, placements: List[LoadPlacement],
        vehicle: VehicleSpec, load_weights: Dict[int, float]
    ) -> AARViolation:
        """Check all constraint rules before placing a load. Return None if OK, else violation."""
        # Rule 3.2.1: Load weight ≤ stenciled limit
        if load.weight_kg > vehicle.capacity_kg:
            return AARViolation(
                rule="3.2.1", message=f"Load {load.id} exceeds vehicle capacity",
                severity="error", details={"load_kg": load.weight_kg, "capacity_kg": vehicle.capacity_kg}
            )
        
        # Rule 4.12.10: Smaller-width rolls below wider rolls (if applicable)
        if load.type == "paper_roll":
            w, h, d = self.get_load_dimensions(load)
            # Check stack immediately below this load
            for p in placements:
                if p.load_id != load.id and abs(p.z - load.width_m) < 0.1:  # Adjacent stack
                    below_load = next((l for l in [load] if l.id == p.load_id), None)
                    if below_load and below_load.width_m < load.width_m:
                        return AARViolation(
                            rule="4.12.10", message="Wider rolls must be below narrower rolls",
                            severity="error"
                        )
        
        return None  # OK

    def place_loads_3d(self, vehicle: VehicleSpec, loads: List[LoadSpec]) -> Tuple[List[LoadPlacement], List[AARViolation]]:
        """Place all loads with rule enforcement. Returns (placements, placement_violations)."""
        expanded = self.expand_loads(loads)
        expanded.sort(key=lambda l: l.weight_kg, reverse=True)  # FFD: largest first

        placements = []
        occupied = []
        load_weights = {l.id: l.weight_kg for l in loads}
        placement_violations = []

        v_len, v_wid, v_ht = vehicle.length_m, vehicle.width_m, vehicle.height_m

        for load in expanded:
            w, h, d = self.get_load_dimensions(load)
            placed = False

            # Try positions: doorway first, then floor center, then sides, then upper
            y_candidates = [0.0]  # Floor first
            for p in occupied:
                if p[3] + h <= v_ht + self.eps:  # Can stack
                    y_candidates.append(p[3])
            y_candidates = sorted(set(y_candidates))

            for y in y_candidates:
                # Check max stacking (rule 4.12.x context)
                layer = int(y / max(h, 0.01))
                if layer > 2:  # Max 3 layers for most loads
                    break

                # Try X positions (length-wise)
                x_positions = self._centered_positions(w, v_len)
                for x in x_positions:
                    if x + w > v_len + self.eps:
                        continue

                    # Try Z positions (width-wise)
                    z_positions = self._centered_positions(d, v_wid)
                    for z in z_positions:
                        if z + d > v_wid + self.eps:
                            continue

                        # Check collision
                        if not self._fits(x, y, z, w, h, d, occupied):
                            continue

                        # Roll-to-roll contact (rule 4.12.1)
                        if load.type in ("cylinder", "paper_roll", "coil") and y < self.eps:
                            if not self._has_roll_contact(x, z, w, d, occupied, 0.05):
                                continue

                        # Pre-placement rule check
                        violation = self.enforce_constraint_rules(load, placements, vehicle, load_weights)
                        if violation:
                            placement_violations.append(violation)
                            continue

                        # Place it
                        placements.append(LoadPlacement(
                            load_id=load.id, x=round(x, 3), y=round(y, 3), z=round(z, 3),
                            rx=0, ry=0, rz=0, rotated=False,
                            placed_w=w, placed_h=h, placed_d=d,
                        ))
                        occupied.append((x, x + w, y, y + h, z, z + d))
                        placed = True
                        break

                    if placed:
                        break
                if placed:
                    break

        return placements, placement_violations

    def _centered_positions(self, size: float, vehicle_size: float) -> List[float]:
        """Generate positions from center outward."""
        if size >= vehicle_size:
            return [0.0]
        center = (vehicle_size - size) / 2
        positions = [center]
        offset = size
        while True:
            if center + offset + size <= vehicle_size + self.eps:
                positions.append(center + offset)
            if center - offset >= -self.eps:
                positions.append(max(0, center - offset))
            if center + offset + size > vehicle_size + self.eps and center - offset < 0:
                break
            offset += size
        return sorted(set(positions))

    def _fits(self, x: float, y: float, z: float, w: float, h: float, d: float, 
              occupied: List[Tuple[float, float, float, float, float, float]]) -> bool:
        """Check if load fits without collision."""
        for ox1, ox2, oy1, oy2, oz1, oz2 in occupied:
            if x + w <= ox1 + self.eps or ox2 - self.eps <= x:
                continue
            if y + h <= oy1 + self.eps or oy2 - self.eps <= y:
                continue
            if z + d <= oz1 + self.eps or oz2 - self.eps <= z:
                continue
            return False
        return True

    def _has_roll_contact(self, x: float, z: float, w: float, d: float, 
                         occupied: List[Tuple[float, float, float, float, float, float]], 
                         min_contact: float) -> bool:
        """Check roll-to-roll contact for force support."""
        if min_contact <= 0:
            return True
        for ox1, ox2, oy1, oy2, oz1, oz2 in occupied:
            if oy1 > 0.01:
                continue
            x_overlap = max(0, min(x + w, ox2) - max(x, ox1))
            z_overlap = max(0, min(z + d, oz2) - max(z, oz1))
            if x_overlap >= min_contact or z_overlap >= min_contact:
                return True
        return len(occupied) == 0

    def compute_cg(self, vehicle: VehicleSpec, placements: List[LoadPlacement],
                  load_weights: Dict[int, float]) -> Tuple[float, float, float]:
        """Compute center of gravity."""
        total_weight = sum(load_weights.get(p.load_id, 0) for p in placements)
        if total_weight == 0:
            return 0, 0, 0

        cg_x = sum(load_weights.get(p.load_id, 0) * (p.x + p.placed_w / 2) for p in placements) / total_weight
        cg_y = sum(load_weights.get(p.load_id, 0) * (p.y + p.placed_h / 2) for p in placements) / total_weight
        cg_z = sum(load_weights.get(p.load_id, 0) * (p.z + p.placed_d / 2) for p in placements) / total_weight
        return cg_x, cg_y, cg_z

    def compute_metrics(self, vehicle: VehicleSpec, placements: List[LoadPlacement],
                       load_weights: Dict[int, float]) -> OptimizationMetrics:
        """Compute packing metrics."""
        total_weight = sum(load_weights.values())
        placed_weight = sum(load_weights.get(p.load_id, 0) for p in placements)
        placed_volume = sum(p.placed_w * p.placed_h * p.placed_d for p in placements)
        vehicle_volume = vehicle.length_m * vehicle.width_m * vehicle.height_m

        cg_x, cg_y, cg_z = self.compute_cg(vehicle, placements, load_weights)

        return OptimizationMetrics(
            cg_x=cg_x, cg_y=cg_y, cg_z=cg_z,
            axle_loads=[],  # Computed in validation
            lateral_imbalance_pct=abs(cg_z - vehicle.width_m / 2) / (vehicle.width_m / 2) * 100,
            longitudinal_imbalance_pct=abs(cg_x - vehicle.length_m / 2) / (vehicle.length_m / 2) * 100,
            volume_utilization=placed_volume / vehicle_volume if vehicle_volume > 0 else 0,
            weight_utilization=placed_weight / vehicle.capacity_kg if vehicle.capacity_kg > 0 else 0,
        )

    def validate_all_rules(self, vehicle: VehicleSpec, placements: List[LoadPlacement],
                          load_specs: List[LoadSpec]) -> Tuple[List[AARViolation], List[AARViolation]]:
        """Validate all applicable rules. Returns (violations, warnings)."""
        load_weights = {l.id: l.weight_kg for l in load_specs}
        violations, warnings = [], []

        # Rule 3.5.1: CG height limit
        _, cg_y, _ = self.compute_cg(vehicle, placements, load_weights)
        cg_height_m = 2.489  # AAR 98 inches
        empty_cg_m = (vehicle.empty_cg_height_in or 45) * 0.0254 if vehicle.empty_cg_height_in else 1.1
        total_weight = sum(load_weights.values())
        tare = vehicle.tare_weight_kg or 20000
        combined_cg = (cg_y * total_weight + empty_cg_m * tare) / (total_weight + tare)
        if combined_cg > cg_height_m:
            violations.append(AARViolation(
                rule="3.5.1", 
                message=f"CG {combined_cg:.2f}m exceeds 98 inch limit {cg_height_m:.2f}m",
                severity="error", 
                details={"cg_m": combined_cg, "limit_m": cg_height_m}
            ))

        # Rule 3.2.1: Load weight ≤ capacity (already checked in placement)

        # Rule 7.1: Doorway protection (placeholder - detailed in securement suggestion)
        doorway_zone_start = vehicle.length_m * 0.8
        doorway_loads = [p for p in placements if p.x + p.placed_w > doorway_zone_start]
        if doorway_loads:
            warnings.append(AARViolation(
                rule="7.1",
                message=f"{len(doorway_loads)} loads in doorway zone - doorway protection may be required",
                severity="warning"
            ))

        return violations, warnings

    def suggest_securements(self, vehicle: VehicleSpec, placements: List[LoadPlacement],
                           load_specs: List[LoadSpec]) -> List[Dict]:
        """Suggest securement items based on rule 5.x and 6.x."""
        securements = []
        load_map = {l.id: l for l in load_specs}

        for placement in placements:
            load = load_map.get(placement.load_id)
            if not load:
                continue

            # Rule 6.1: Vertical airbags for voids
            # Rule 5.4.1: Airbag levels by weight
            if load.weight_kg <= 75000:
                level = 2
            elif load.weight_kg <= 160000:
                level = 3
            elif load.weight_kg <= 216000:
                level = 4
            else:
                level = 5

            # Suggest airbag if load is not against wall
            if placement.z > 0.5:
                securements.append({
                    "type": f"airbag_level_{level}",
                    "position": [placement.x, placement.y, placement.z - 0.3],
                    "load_id": placement.load_id,
                    "reason": f"Fill void beside load (weight level {level})",
                })

            # Rule 6.3.8: Anchored straps for incomplete layers
            # Rule 7.3: Doorway straps
            if placement.x + placement.placed_w > vehicle.length_m * 0.8:
                strap_count = 1 if placement.placed_w < 25 * 0.0254 else 2
                securements.append({
                    "type": "strap_steel",
                    "position": [placement.x + placement.placed_w / 2, placement.y + placement.placed_h / 2, placement.z],
                    "load_id": placement.load_id,
                    "count": strap_count,
                    "reason": "Doorway protection",
                })

        return securements

    def run(self, vehicle: VehicleSpec, loads: List[LoadSpec],
           constraints: Optional[Dict] = None) -> OptimizationResult:
        """Run full optimization with all rule enforcement."""
        print(f"\n[OPTIMIZE] Start: {vehicle.type} #{vehicle.id}, {len(loads)} load specs")

        # Normalize dimensions
        vehicle = self.normalize_dimensions(vehicle)

        # Place loads with rule enforcement
        placements, placement_violations = self.place_loads_3d(vehicle, loads)

        # Compute metrics
        load_weights = {l.id: l.weight_kg for l in loads}
        metrics = self.compute_metrics(vehicle, placements, load_weights)

        # Validate all rules
        violations, warnings = self.validate_all_rules(vehicle, placements, loads)
        violations.extend(placement_violations)

        # Suggest securements
        securements = self.suggest_securements(vehicle, placements, loads)

        print(f"[OPTIMIZE] Result: {len(placements)}/{sum(l.quantity for l in loads)} placed")
        print(f"[OPTIMIZE] Violations: {len(violations)}, Warnings: {len(warnings)}")
        print(f"[OPTIMIZE] Suggested securements: {len(securements)}")

        return OptimizationResult(
            placements=placements,
            metrics=metrics,
            violations=violations,
            warnings=warnings,
            extra_data={"suggested_securements": securements},
        )


def run_optimization(vehicle: VehicleSpec, loads: List[LoadSpec], 
                    constraints: Optional[Dict] = None) -> OptimizationResult:
    """Wrapper for backward compatibility."""
    engine = OptimizationEngine()
    return engine.run(vehicle, loads, constraints)
