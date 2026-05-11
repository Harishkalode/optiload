"""
OptimiLoad Core Optimization Engine
AAR 2019 compliant deterministic placement engine with strict rule enforcement.
"""

from app.core.optimization.types import (
    VehicleSpec,
    LoadSpec,
    LoadPlacement,
    CenterOfGravity,
    OptimizationMetrics,
    OptimizationResult,
    AARViolation,
    AARValidation,
    AARValidationResult,
)

from app.core.optimization.aar_engine_v3 import AARRuleEngine, AARRuleEvaluationResult

from app.core.optimization.physics_engine import PhysicsEngine

from app.core.optimization.aar_stack_validator import AARStackValidator

from app.core.optimization.engine_v3 import PlacementEngine, PackingConstraints

from app.core.optimization.securement import SecurementEngine, SecurementSuggestion

__all__ = [
    # Types
    "VehicleSpec",
    "LoadSpec", 
    "LoadPlacement",
    "CenterOfGravity",
    "OptimizationMetrics",
    "OptimizationResult",
    "AARViolation",
    "AARValidation",
    "AARValidationResult",
    # Engine
    "AARRuleEngine",
    "AARRuleEvaluationResult",
    "PhysicsEngine",
    "AARStackValidator",
    "PlacementEngine",
    "PackingConstraints",
    "SecurementEngine",
    "SecurementSuggestion",
]

__version__ = "3.0.0"
__engine__ = "aar-deterministic-v3"