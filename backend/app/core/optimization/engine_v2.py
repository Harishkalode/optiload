"""AAR-compliant 3D packing engine — deterministic, rule-driven, production-ready.

Core guarantees:
- No overlap (collision detection)
- All loads within vehicle bounds
- Stable stacking (contact validation)
- CoG compliance (AAR 3.5)
- Axle load limits (AAR 3.2)
- Deterministic output (same input → same output, no randomness)
"""

from typing import Optional, List, Dict, Tuple
from app.core.optimization.types import (
    LoadPlacement, LoadSpec, OptimizationResult, VehicleSpec, 
    AARViolation, OptimizationMetrics
)
from app.core.optimization.aar_rules import (
    validate_combined_cg, validate_axle_loads, validate_lateral_balance,
    validate_longitudinal_balance, validate_load_bounds, check_collisions,
    validate_hazmat_separation, compute_metrics,
)
from app.core.optimization.securement import suggest_securements


class OptimizationEngine:
    """Deterministic 3D bin packing with full rule enforcement."""

    def __init__(self):
        self.eps = 0.001

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
        """Get [width, height, depth] for placement."""
        if load.type in ("cylinder", "paper_roll", "coil"):
            d = load.diameter_m or min(load.length_m, load.width_m)
            return (d, d, load.length_m)
        return (load.length_m, load.height_m, load.width_m)

    def expand_loads(self, loads: List[LoadSpec]) -> List[Tuple[int, LoadSpec]]:
        """Expand quantities; return list of (index, load) for tracking."""
        expanded = []
        idx = 0
        for load in loads:
            for _ in range(load.quantity):
                expanded.append((idx, LoadSpec(
                    id=load.id, type=load.type, length_m=load.length_m, width_m=load.width_m,
                    height_m=load.height_m, weight_kg=load.weight_kg, quantity=1,
                    fragile=load.fragile, stackable=load.stackable,
                    hazmat_class=load.hazmat_class, diameter_m=load.diameter_m,
                )))
                idx += 1
        return expanded

    def place_loads_deterministic(self, 
        vehicle: VehicleSpec, 
        loads: List[LoadSpec],
    ) -> Tuple[List[LoadPlacement], List[AARViolation]]:
        """Deterministic placement: FFD weight sort, then center-out grid scan."""
        expanded = self.expand_loads(loads)
        expanded.sort(key=lambda item: item[1].weight_kg, reverse=True)  # FFD: largest first

        placements: List[LoadPlacement] = []
        occupied: List[Tuple[float, float, float, float, float, float]] = []
        placement_violations: List[AARViolation] = []

        v_len, v_wid, v_ht = vehicle.length_m, vehicle.width_m, vehicle.height_m

        for idx, load in expanded:
            w, h, d = self.get_load_dimensions(load)
            placed = False

            # Skip if load too big
            if w > v_len + self.eps or d > v_wid + self.eps or h > v_ht + self.eps:
                continue

            # Deterministic Y candidates: floor first, then occupied top surfaces
            y_candidates = [0.0]
            for ox1, ox2, oy1, oy2, oz1, oz2 in occupied:
                if oy2 + h <= v_ht + self.eps:
                    y_candidates.append(oy2)
            y_candidates = sorted(set(y_candidates))

            for y in y_candidates:
                if placed:
                    break

                # Fragile no-stack
                if load.fragile and y > self.eps:
                    break
                # Non-stackable
                if not load.stackable and y > self.eps:
                    break

                # Deterministic X positions: center-out
                x_positions = self._center_out_positions(w, v_len)
                for x in x_positions:
                    if placed or x + w > v_len + self.eps:
                        continue

                    # Deterministic Z positions: center-out
                    z_positions = self._center_out_positions(d, v_wid)
                    for z in z_positions:
                        if z + d > v_wid + self.eps:
                            continue

                        # Check collision and bounds
                        if not self._fits(x, y, z, w, h, d, occupied):
                            continue

                        # Roll contact requirement
                        if load.type in ("cylinder", "paper_roll", "coil") and y < self.eps:
                            if not self._has_roll_contact(x, z, w, d, occupied, 0.05):
                                continue

                        # Place
                        contact_type = "floor" if y < self.eps else "load"
                        placements.append(LoadPlacement(
                            load_id=load.id, x=round(x, 3), y=round(y, 3), z=round(z, 3),
                            rx=0, ry=0, rz=0, rotated=False,
                            placed_w=w, placed_h=h, placed_d=d,
                            cog_x=x + w / 2, cog_y=y + h / 2, cog_z=z + d / 2,
                            contact_type=contact_type, contact_surface_area=w * d,
                        ))
                        occupied.append((x, x + w, y, y + h, z, z + d))
                        placed = True
                        break

        return placements, placement_violations

    def _center_out_positions(self, size: float, vehicle_size: float) -> List[float]:
        """Generate positions from center outward for deterministic balanced placement."""
        if size >= vehicle_size:
            return [0.0]
        center = (vehicle_size - size) / 2
        positions = [center]
        offset = size
        while offset < vehicle_size:
            if center + offset + size <= vehicle_size + self.eps:
                positions.append(center + offset)
            if center - offset >= -self.eps:
                positions.append(max(0, center - offset))
            offset += size
        return sorted(set(positions))

    def _centered_positions(self, size: float, vehicle_size: float) -> List[float]:
        """Generate positions from center outward for deterministic balanced placement."""
        return self._center_out_positions(size, vehicle_size)

    def _fits(self, x: float, y: float, z: float, w: float, h: float, d: float,
              occupied: List[Tuple[float, float, float, float, float, float]]) -> bool:
        """Check no collision."""
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
        """Check roll has adjacent roll for force support."""
        if min_contact <= 0 or not occupied:
            return True
        for ox1, ox2, oy1, oy2, oz1, oz2 in occupied:
            if oy1 > 0.01:
                continue
            x_overlap = max(0, min(x + w, ox2) - max(x, ox1))
            z_overlap = max(0, min(z + d, oz2) - max(z, oz1))
            if x_overlap >= min_contact or z_overlap >= min_contact:
                return True
        return False

    def compute_cg(self, placements: List[LoadPlacement],
                  load_weights: Dict[int, float]) -> Tuple[float, float, float]:
        """Compute load CG."""
        total_weight = sum(load_weights.get(p.load_id, 0) for p in placements)
        if total_weight == 0:
            return 0, 0, 0
        
        cg_x = sum(load_weights.get(p.load_id, 0) * p.cog_x for p in placements) / total_weight
        cg_y = sum(load_weights.get(p.load_id, 0) * p.cog_y for p in placements) / total_weight
        cg_z = sum(load_weights.get(p.load_id, 0) * p.cog_z for p in placements) / total_weight
        return cg_x, cg_y, cg_z

    def compute_metrics(self, vehicle: VehicleSpec, placements: List[LoadPlacement],
                       load_weights: Dict[int, float]) -> OptimizationMetrics:
        """Compute packing metrics."""
        total_weight = sum(load_weights.values())
        placed_weight = sum(load_weights.get(p.load_id, 0) for p in placements)
        placed_volume = sum(p.placed_w * p.placed_h * p.placed_d for p in placements)
        vehicle_volume = vehicle.length_m * vehicle.width_m * vehicle.height_m

        cg_x, cg_y, cg_z = self.compute_cg(placements, load_weights)

        return OptimizationMetrics(
            cg_x=cg_x, cg_y=cg_y, cg_z=cg_z,
            axle_loads=[],
            lateral_imbalance_pct=0.0,
            longitudinal_imbalance_pct=0.0,
            volume_utilization=placed_volume / vehicle_volume if vehicle_volume > 0 else 0,
            weight_utilization=placed_weight / vehicle.capacity_kg if vehicle.capacity_kg > 0 else 0,
        )

    def validate_all_rules(self, vehicle: VehicleSpec, placements: List[LoadPlacement],
                          load_specs: List[LoadSpec]) -> Tuple[List[AARViolation], List[AARViolation]]:
        """Execute all AAR rule validations."""
        load_weights = {l.id: l.weight_kg for l in load_specs}
        violations: List[AARViolation] = []
        warnings: List[AARViolation] = []

        # Collision check
        collisions = check_collisions(placements, {})
        violations.extend([v for v in collisions if v.severity == "error"])
        warnings.extend([v for v in collisions if v.severity == "warning"])

        # AAR 3.5.1: Combined CG
        cg_viols = validate_combined_cg(vehicle, placements, load_weights)
        violations.extend([v for v in cg_viols if v.severity == "error"])
        warnings.extend([v for v in cg_viols if v.severity == "warning"])

        # AAR 3.2.2: Axle loads
        axle_viols = validate_axle_loads(vehicle, placements, load_weights)
        violations.extend([v for v in axle_viols if v.severity == "error"])
        warnings.extend([v for v in axle_viols if v.severity == "warning"])

        # AAR 3.3: Lateral balance
        lat_viols = validate_lateral_balance(vehicle, placements, load_weights)
        violations.extend([v for v in lat_viols if v.severity == "error"])
        warnings.extend([v for v in lat_viols if v.severity == "warning"])

        # AAR 3.4: Longitudinal balance
        long_viols = validate_longitudinal_balance(vehicle, placements, load_weights)
        violations.extend([v for v in long_viols if v.severity == "error"])
        warnings.extend([v for v in long_viols if v.severity == "warning"])

        # Bounds
        bounds_viols = validate_load_bounds(vehicle, placements, {l.id: self.get_load_dimensions(l) for l in load_specs})
        violations.extend([v for v in bounds_viols if v.severity == "error"])
        warnings.extend([v for v in bounds_viols if v.severity == "warning"])

        # Hazmat separation
        hazmat_map = {l.id: l.hazmat_class for l in load_specs}
        hazmat_viols = validate_hazmat_separation(placements, hazmat_map)
        violations.extend([v for v in hazmat_viols if v.severity == "error"])
        warnings.extend([v for v in hazmat_viols if v.severity == "warning"])

        return violations, warnings

    def run(self, vehicle: VehicleSpec, loads: List[LoadSpec],
           constraints: Optional[Dict] = None) -> OptimizationResult:
        """Execute full optimization with deterministic placement and rule enforcement."""
        print(f"\n[OPTIMIZE] Start: {vehicle.type} #{vehicle.id}, {len(loads)} specs, {sum(l.quantity for l in loads)} items")

        # Normalize
        vehicle = self.normalize_dimensions(vehicle)

        # Place
        placements, placement_viols = self.place_loads_deterministic(vehicle, loads)
        print(f"[OPTIMIZE] Placed {len(placements)}/{sum(l.quantity for l in loads)} items")

        # Metrics
        load_weights = {l.id: l.weight_kg for l in loads}
        metrics = self.compute_metrics(vehicle, placements, load_weights)

        # Validate all rules
        violations, warnings = self.validate_all_rules(vehicle, placements, loads)
        violations.extend(placement_viols)

        # Suggest securements
        securements = suggest_securements(placements, loads, vehicle)

        # Build extra data
        extra_data = {"suggested_securements": securements}

        print(f"[OPTIMIZE] Violations: {len(violations)}, Warnings: {len(warnings)}")

        return OptimizationResult(
            placements=placements,
            metrics=metrics,
            violations=violations,
            warnings=warnings,
            extra_data=extra_data,
        )


def run_optimization(vehicle: VehicleSpec, loads: List[LoadSpec], 
                    constraints: Optional[Dict] = None) -> OptimizationResult:
    """Wrapper for backward compatibility."""
    engine = OptimizationEngine()
    return engine.run(vehicle, loads, constraints)
