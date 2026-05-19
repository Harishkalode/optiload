"""Advanced constraint validation and conflict resolution for optimization."""

from typing import List, Tuple, Optional, Dict, Any
from app.core.optimization.types import (
    LoadPlacement, LoadSpec, VehicleSpec, AARViolation, Axle
)
from app.core.optimization.physics_engine import PhysicsEngine

# Violation severity levels
SEVERITY_INFO = "info"
SEVERITY_WARNING = "warning"
SEVERITY_ERROR = "error"

# Violation categories
CATEGORY_BOUNDS = "bounds"
CATEGORY_COLLISION = "collision"
CATEGORY_PHYSICS = "physics"
CATEGORY_AAR_WEIGHT = "aar_weight"
CATEGORY_AAR_BALANCE = "aar_balance"
CATEGORY_AAR_COG = "aar_cog"


class ConstraintValidator:
    """Advanced constraint validation with detailed diagnostics."""
    
    def __init__(self, vehicle: VehicleSpec, load_specs: List[LoadSpec]):
        self.vehicle = vehicle
        self.load_specs = load_specs
        self.load_map = {l.id: l for l in load_specs}
        self.physics = PhysicsEngine()
    
    def validate_complete(self, placements: List[LoadPlacement]) -> Tuple[List[AARViolation], List[AARViolation]]:
        """
        Complete validation against all constraints.
        
        Returns:
            (violations: list of error-level violations, warnings: list of warning-level violations)
        """
        violations = []
        warnings = []
        
        # 1. Structural validation
        bounds_issues = self._validate_bounds(placements)
        violations.extend([v for v in bounds_issues if v.severity == "error"])
        warnings.extend([v for v in bounds_issues if v.severity == "warning"])
        
        # 2. Collision detection
        collision_issues = self._validate_collisions(placements)
        violations.extend([v for v in collision_issues if v.severity == "error"])
        warnings.extend([v for v in collision_issues if v.severity == "warning"])
        
        # 3. Physics validation
        physics_issues = self._validate_physics(placements)
        violations.extend([v for v in physics_issues if v.severity == "error"])
        warnings.extend([v for v in physics_issues if v.severity == "warning"])
        
        # 4. AAR weight/axle limits
        axle_issues = self._validate_axles(placements)
        violations.extend([v for v in axle_issues if v.severity == "error"])
        warnings.extend([v for v in axle_issues if v.severity == "warning"])
        
        # 5. AAR balance constraints
        balance_issues = self._validate_balance(placements)
        violations.extend([v for v in balance_issues if v.severity == "error"])
        warnings.extend([v for v in balance_issues if v.severity == "warning"])
        
        # 6. AAR CoG limits
        cog_issues = self._validate_cog(placements)
        violations.extend([v for v in cog_issues if v.severity == "error"])
        warnings.extend([v for v in cog_issues if v.severity == "warning"])
        
        return violations, warnings
    
    def _validate_bounds(self, placements: List[LoadPlacement]) -> List[AARViolation]:
        """Check all loads are within vehicle boundaries.
        
        Coordinate mapping:
        - X-axis: 0 to length_m (front to back), dimension = placed_d
        - Y-axis: 0 to height_m (floor to ceiling), dimension = placed_h
        - Z-axis: 0 to width_m (left to right), dimension = placed_w
        """
        issues = []
        for p in placements:
            # X-axis (longitudinal / depth)
            if p.x < 0 or p.x + p.placed_d > self.vehicle.length_m:
                issues.append(AARViolation(
                    rule="bounds_length",
                    message=f"Load {p.load_id}: X position {p.x:.2f}m + depth {p.placed_d:.2f}m exceeds vehicle length {self.vehicle.length_m:.2f}m",
                    severity="error",
                    details={"x": p.x, "d": p.placed_d, "limit": self.vehicle.length_m}
                ))
            # Z-axis (lateral / width)
            if p.z < 0 or p.z + p.placed_w > self.vehicle.width_m:
                issues.append(AARViolation(
                    rule="bounds_width",
                    message=f"Load {p.load_id}: Z position {p.z:.2f}m + width {p.placed_w:.2f}m exceeds vehicle width {self.vehicle.width_m:.2f}m",
                    severity="error",
                    details={"z": p.z, "w": p.placed_w, "limit": self.vehicle.width_m}
                ))
            # Y-axis (vertical / height)
            if p.y < 0 or p.y + p.placed_h > self.vehicle.height_m:
                issues.append(AARViolation(
                    rule="bounds_height",
                    message=f"Load {p.load_id}: Y position {p.y:.2f}m + height {p.placed_h:.2f}m exceeds vehicle height {self.vehicle.height_m:.2f}m",
                    severity="error",
                    details={"y": p.y, "h": p.placed_h, "limit": self.vehicle.height_m}
                ))
        return issues
    
    def _validate_collisions(self, placements: List[LoadPlacement]) -> List[AARViolation]:
        """Check no two loads overlap.
        
        AABB (Axis-Aligned Bounding Box) collision test:
        Two boxes overlap if they overlap on ALL three axes.
        """
        issues = []
        eps = 0.001  # 1mm tolerance for floating point
        for i, p1 in enumerate(placements):
            for p2 in placements[i+1:]:
                # Check overlap on all axes
                # X-axis: uses placed_d (depth)
                x_overlap = p1.x + p1.placed_d > p2.x + eps and p2.x + p2.placed_d > p1.x + eps
                # Y-axis: uses placed_h (height)
                y_overlap = p1.y + p1.placed_h > p2.y + eps and p2.y + p2.placed_h > p1.y + eps
                # Z-axis: uses placed_w (width)
                z_overlap = p1.z + p1.placed_w > p2.z + eps and p2.z + p2.placed_w > p1.z + eps
                
                # Collision if all three axes overlap
                if x_overlap and y_overlap and z_overlap:
                    issues.append(AARViolation(
                        rule="collision_overlap",
                        message=f"Load {p1.load_id} and Load {p2.load_id} overlap in 3D space",
                        severity="error",
                        details={
                            "load1": p1.load_id, "pos1": (p1.x, p1.y, p1.z),
                            "load2": p2.load_id, "pos2": (p2.x, p2.y, p2.z)
                        }
                    ))
        return issues
    
    def _validate_physics(self, placements: List[LoadPlacement]) -> List[AARViolation]:
        """Check physics stability (contact, stacking rules)."""
        issues = []
        for p in placements:
            # Floating load check (must have contact)
            if p.y > 0.001:  # Essentially above floor
                has_support = False
                
                # Check if any load supports this one
                for other in placements:
                    if other.load_id == p.load_id:
                        continue
                    
                    # Check if bottom of p is within 1cm of top of other
                    bottom_contact = abs(p.y - (other.y + other.placed_h)) <= 0.01
                    
                    if not bottom_contact:
                        continue
                    
                    # Check if footprints overlap in XZ plane
                    x_overlap = not (
                        (p.x + p.placed_d <= other.x + 0.001) or
                        (p.x >= other.x + other.placed_d - 0.001)
                    )
                    z_overlap = not (
                        (p.z + p.placed_w <= other.z + 0.001) or
                        (p.z >= other.z + other.placed_w - 0.001)
                    )
                    
                    if x_overlap and z_overlap:
                        has_support = True
                        break
                
                if not has_support:
                    issues.append(AARViolation(
                        rule="physics_floating",
                        message=f"Load {p.load_id} at height {p.y:.2f}m has no contact support",
                        severity="error",
                        details={"load_id": p.load_id, "height": p.y}
                    ))
            
            # Non-stackable constraint
            load = self.load_map.get(p.load_id)
            if load and not load.stackable and p.y > 0.001:
                issues.append(AARViolation(
                    rule="physics_no_stack",
                    message=f"Load {p.load_id} is non-stackable but placed at height {p.y:.2f}m",
                    severity="error",
                    details={"load_id": p.load_id, "height": p.y}
                ))
            
            # Fragile constraint
            if load and load.fragile and p.y > 0.001:
                issues.append(AARViolation(
                    rule="physics_fragile",
                    message=f"Load {p.load_id} is fragile but stacked at height {p.y:.2f}m",
                    severity="error",
                    details={"load_id": p.load_id, "height": p.y}
                ))
        
        return issues
    
    def _validate_axles(self, placements: List[LoadPlacement]) -> List[AARViolation]:
        """Check AAR 3.2.2: axle weight limits."""
        issues = []
        axle_loads, axles = self.physics.compute_axle_loads(self.vehicle, placements, self.load_specs)
        for i, axle in enumerate(axles):
            if axle.is_overloaded():
                issues.append(AARViolation(
                    rule="aar_3_2_2_axle_overload",
                    message=f"Axle {i+1} load {axle.current_load_kg:.0f}kg exceeds limit {axle.weight_limit_kg:.0f}kg",
                    severity="error",
                    details={"axle": i, "load_kg": axle.current_load_kg, "limit_kg": axle.weight_limit_kg}
                ))
        return issues
    
    def _validate_balance(self, placements: List[LoadPlacement]) -> List[AARViolation]:
        """Check AAR 3.3: lateral & longitudinal balance."""
        issues = []
        load_weights = {l.id: l.weight_kg for l in self.load_specs}
        total = sum(load_weights.values())
        
        if total == 0:
            return issues
        
        # Lateral balance
        half_width = self.vehicle.width_m / 2
        left, right = 0.0, 0.0
        for p in placements:
            w = load_weights.get(p.load_id, 0)
            center = p.z + p.placed_d / 2
            if abs(center - half_width) < 0.05:
                left += w * 0.5
                right += w * 0.5
            elif center < half_width:
                left += w
            else:
                right += w
        
        lat_imb = abs(left - right) / total if total > 0 else 0
        if lat_imb > 0.10:
            issues.append(AARViolation(
                rule="aar_3_3_lateral_imbalance",
                message=f"Lateral imbalance {lat_imb:.1%} exceeds error threshold 10%",
                severity="error",
                details={"imbalance_pct": lat_imb * 100}
            ))
        elif lat_imb > 0.05:
            issues.append(AARViolation(
                rule="aar_3_3_lateral_imbalance",
                message=f"Lateral imbalance {lat_imb:.1%} exceeds warning threshold 5%",
                severity="warning",
                details={"imbalance_pct": lat_imb * 100}
            ))
        
        # Longitudinal balance
        half_len = self.vehicle.length_m / 2
        front, rear = 0.0, 0.0
        for p in placements:
            w = load_weights.get(p.load_id, 0)
            center = p.x + p.placed_w / 2
            if abs(center - half_len) < 0.05:
                front += w * 0.5
                rear += w * 0.5
            elif center < half_len:
                front += w
            else:
                rear += w
        
        long_imb = abs(front - rear) / total if total > 0 else 0
        if long_imb > 0.20:
            issues.append(AARViolation(
                rule="aar_longitudinal_imbalance",
                message=f"Longitudinal imbalance {long_imb:.1%} exceeds error threshold 20%",
                severity="error",
                details={"imbalance_pct": long_imb * 100}
            ))
        elif long_imb > 0.10:
            issues.append(AARViolation(
                rule="aar_longitudinal_imbalance",
                message=f"Longitudinal imbalance {long_imb:.1%} exceeds warning threshold 10%",
                severity="warning",
                details={"imbalance_pct": long_imb * 100}
            ))
        
        return issues
    
    def _validate_cog(self, placements: List[LoadPlacement]) -> List[AARViolation]:
        """Check AAR 3.5.1: Combined CoG height limit."""
        issues = []
        cog = self.physics.compute_combined_cog(self.vehicle, placements, self.load_specs)
        if cog.height_inches > 98:
            issues.append(AARViolation(
                rule="aar_3_5_1_cog_height",
                message=f"Combined CoG height {cog.height_inches:.1f}in exceeds AAR limit 98in",
                severity="error",
                details={"cog_height_inches": cog.height_inches}
            ))
        return issues
    
    def diagnose_violation(self, violation: AARViolation) -> Dict[str, Any]:
        """Generate diagnostic info for a violation."""
        return {
            "rule": violation.rule,
            "message": violation.message,
            "severity": violation.severity,
            "details": violation.details or {},
            "category": self._categorize_rule(violation.rule),
            "actionable": self._is_actionable(violation.rule),
        }
    
    def _categorize_rule(self, rule: str) -> str:
        """Categorize a rule for diagnostics."""
        if "bounds" in rule:
            return CATEGORY_BOUNDS
        elif "collision" in rule:
            return CATEGORY_COLLISION
        elif "physics" in rule:
            return CATEGORY_PHYSICS
        elif "axle" in rule or "weight" in rule:
            return CATEGORY_AAR_WEIGHT
        elif "imbalance" in rule:
            return CATEGORY_AAR_BALANCE
        elif "cog" in rule:
            return CATEGORY_AAR_COG
        return "other"
    
    def _is_actionable(self, rule: str) -> bool:
        """Determine if a violation can be auto-resolved."""
        return rule in [
            "bounds_length", "bounds_width", "bounds_height",
            "collision_overlap", "physics_floating"
        ]
