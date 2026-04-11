"""AAR Rule Registry - parsed from JSON into structured rule objects.

All 130+ rules from rule_registry_optimized.json are loaded at startup.
Enables: Rule-driven validation, securement suggestions, conflict resolution.
"""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class Rule:
    """Structured representation of an AAR rule."""
    rule_id: str
    category: str
    description: str
    formula_or_algorithm: Optional[str]
    limits_or_values: Optional[str]
    priority: str  # "High" or "Medium"
    depends_on: List[str] = None

    def __post_init__(self):
        if self.depends_on is None:
            self.depends_on = []


class RuleRegistry:
    """Singleton registry for all AAR rules with lookup utilities."""

    _instance: Optional["RuleRegistry"] = None
    _rules_by_id: Dict[str, Rule] = {}
    _rules_by_category: Dict[str, List[Rule]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._load_rules()
        self._initialized = True

    def _load_rules(self):
        """Load and parse rule_registry_optimized.json."""
        json_path = Path(__file__).parent.parent.parent.parent / "backend" / "rule_registry_optimized.json"
        
        # Fallback: try relative to this file
        if not json_path.exists():
            json_path = Path(__file__).parent.parent.parent / "rule_registry_optimized.json"
        
        # Fallback: search from workspace root
        if not json_path.exists():
            json_path = Path("/workspaces/optiload/backend/rule_registry_optimized.json")

        if not json_path.exists():
            raise FileNotFoundError(f"rule_registry_optimized.json not found at {json_path}")

        with open(json_path) as f:
            raw_rules = json.load(f)

        for raw in raw_rules:
            rule = Rule(
                rule_id=raw.get("rule_id"),
                category=raw.get("category"),
                description=raw.get("description"),
                formula_or_algorithm=raw.get("formula_or_algorithm"),
                limits_or_values=raw.get("limits_or_values"),
                priority=raw.get("priority", "Medium"),
            )
            self._rules_by_id[rule.rule_id] = rule
            if rule.category not in self._rules_by_category:
                self._rules_by_category[rule.category] = []
            self._rules_by_category[rule.category].append(rule)

        print(f"[RULE REGISTRY] Loaded {len(self._rules_by_id)} rules from JSON")
        print(f"[RULE REGISTRY] Categories: {list(self._rules_by_category.keys())}")

    def rule(self, rule_id: str) -> Optional[Rule]:
        """Get rule by ID."""
        return self._rules_by_id.get(rule_id)

    def rules_by_category(self, category: str) -> List[Rule]:
        """Get all rules in a category."""
        return self._rules_by_category.get(category, [])

    def all_rules(self) -> List[Rule]:
        """Get all rules."""
        return list(self._rules_by_id.values())

    def high_priority_rules(self) -> List[Rule]:
        """Get High priority rules only."""
        return [r for r in self.all_rules() if r.priority == "High"]

    def rules_for_load_type(self, load_type: str) -> List[Rule]:
        """Get applicable rules for a load type (e.g., 'paper_roll' → rules about roll diameter)."""
        # Map load types to relevant rule categories
        type_categories = {
            "paper_roll": ["loading patterns", "securement", "doorway protection", "materials"],
            "cylinder": ["loading patterns", "securement", "doorway protection"],
            "coil": ["loading patterns", "securement", "doorway protection"],
            "pallet": ["loading patterns", "weight limits"],
            "drum": ["loading patterns", "weight limits"],
            "carton": ["weight limits", "stacking"],
        }
        categories = type_categories.get(load_type, ["weight limits"])
        rules = []
        for cat in categories:
            rules.extend(self.rules_by_category(cat))
        return rules

    def rules_for_vehicle_type(self, vehicle_type: str) -> List[Rule]:
        """Get applicable rules for a vehicle type."""
        # All structural/doorway rules apply
        return self.rules_by_category("structural limits") + \
               self.rules_by_category("doorway protection")

    def get_rule_info(self, rule_id: str) -> Optional[Dict[str, Any]]:
        """Get rule as dict for API responses."""
        rule = self.rule(rule_id)
        if not rule:
            return None
        return {
            "rule_id": rule.rule_id,
            "category": rule.category,
            "description": rule.description,
            "formula": rule.formula_or_algorithm,
            "limits": rule.limits_or_values,
            "priority": rule.priority,
        }


# Global singleton instance
def get_rule_registry() -> RuleRegistry:
    """Get the global rule registry instance."""
    return RuleRegistry()
