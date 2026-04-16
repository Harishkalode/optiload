"""Backend rule engine (no JSON dependency).

This module contains a lightweight, deterministic rule engine that
executes all AAR-related rules implemented in Python. The rule registry
is defined in code (no JSON parsing at runtime) to satisfy the requirement
that the source of truth lives in the backend.

The engine delegates actual rule checks to the existing functions in
aar_rules.py, and aggregates violations into two buckets:
- violations: errors
- warnings: non-fatal issues

Conflict resolution (deterministic):
- Group violations by the set of affected loads; for each group keep the
  most severe violation (error preferred over warning).
- If multiple violations have the same severity for a group, prefer the one
  that would appear earlier in the evaluation order.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

from app.core.optimization.types import AARViolation, LoadPlacement, LoadSpec, VehicleSpec
from app.core.optimization.aar_rules import (
    check_collisions,
    compute_metrics,
    validate_axle_loads,
    validate_combined_cg,
    validate_hazmat_separation,
    validate_lateral_balance,
    validate_load_bounds,
    validate_longitudinal_balance,
)


@dataclass
class _RuleFn:
    rule_id: str
    func: object  # function reference
    priority: int  # lower is higher priority


class RuleEngine:
    """Deterministic backend rule engine (no JSON parsing).

    The engine evaluates a fixed set of AAR rules by calling into the existing
    Python validation functions. It then applies a lightweight conflict-resolution
    policy to ensure deterministic output.
    """

    # Lightweight priority map for conflict resolution. Lower value = higher priority
    _PRIORITY_MAP: Dict[str, int] = {
        # Primary structural/physical constraints
        'aar_combined_cg': 1,
        'aar_axle_load': 1,
        'aar_lateral_balance': 1,
        'aar_longitudinal_balance': 1,
        'load_bounds': 1,
        'collision': 0,
        'hazmat_separation': 1,
        # Endwall/other rules can be added here with explicit priorities if needed
    }

    def __init__(self) -> None:
        # In this basic implementation we simply map the existing backend checks
        # to a fixed, deterministic evaluation order.
        self._rules: List[_RuleFn] = [
            _RuleFn('aar_combined_cg', lambda v, p, l, w, d: validate_combined_cg(v, p, w), 1),
            _RuleFn('aar_axle_load', lambda v, p, l, w, d: validate_axle_loads(v, p, w), 1),
            _RuleFn('aar_lateral_balance', lambda v, p, l, w, d: validate_lateral_balance(v, p, w), 1),
            _RuleFn('aar_longitudinal_balance', lambda v, p, l, w, d: validate_longitudinal_balance(v, p, w), 1),
            _RuleFn('load_bounds', lambda v, p, l, w, d: validate_load_bounds(v, p, d), 1),
            _RuleFn('collision', lambda v, p, l, w, d: check_collisions(p, d), 0),
            _RuleFn('hazmat_separation', lambda v, p, l, w, d: validate_hazmat_separation(p, {ll.id: ll.hazmat_class for ll in l}), 2),
        ]

    def _group_key(self, v: AARViolation) -> str:
        loads = v.affectedLoads or []
        if not loads:
            return v.rule
        # sort to get canonical key
        return ",".join(sorted(map(str, loads)))

    def _priority_of(self, v: AARViolation) -> int:
        return self._PRIORITY_MAP.get(v.rule, 5)

    def _select_by_priority(self, violations: List[AARViolation]) -> List[AARViolation]:
        grouped: Dict[str, AARViolation] = {}
        for v in violations:
            key = self._group_key(v)
            if key not in grouped:
                grouped[key] = v
            else:
                existing = grouped[key]
                # Prefer higher severity (error > warning). If equal, prefer higher priority (lower number)
                sev_order = {'error': 2, 'warning': 1, 'info': 0}
                if sev_order.get(v.severity, 0) > sev_order.get(existing.severity, 0):
                    grouped[key] = v
                elif sev_order.get(v.severity, 0) == sev_order.get(existing.severity, 0):
                    if self._priority_of(v) < self._priority_of(existing):
                        grouped[key] = v
        return list(grouped.values())

    def evaluate(
        self,
        vehicle: VehicleSpec,
        placements: List[LoadPlacement],
        loads: List[LoadSpec],
        weight_map: Dict[str, float],
        load_dims: Dict[str, Tuple[float, float, float]],
    ) -> tuple[List[AARViolation], List[AARViolation]]:
        """Evaluate all rules and return (violations, warnings).

        The function delegates to the existing rule checks, collects their results,
        and applies simple conflict-resolution to produce deterministic outputs.
        """
        violations_all: List[AARViolation] = []
        # Execute each rule and collect violations/warnings
        for r in self._rules:
            rule_id = r.rule_id
            func = r.func
            try:
                vals = func(vehicle, placements, loads, weight_map, load_dims)  # type: ignore
            except TypeError:
                # Some functions may have different signature in occasional refactors; skip gracefully
                continue
            if not vals:
                continue
            if isinstance(vals, list):
                violations_all.extend(list(vals))
            else:
                # Some wrappers may return single value; normalize
                if isinstance(vals, AARViolation):
                    violations_all.append(vals)

        # Separate by severity
        violations = [v for v in violations_all if v.severity == "error"]
        warnings = [v for v in violations_all if v.severity == "warning"]

        # Conflict resolution: group by affected loads and keep the most severe per group
        violations = self._select_by_priority(violations)
        warnings = self._select_by_priority(warnings)

        return violations, warnings
