from app.core.optimization.engine_v2 import run_optimization
from app.core.optimization.types import LoadSpec, VehicleSpec
from app.core.utils.errors import AppError
from app.modules.loads.repository import LoadRepository
from app.modules.notifications.model import Notification
from app.modules.notifications.repository import NotificationRepository
from app.modules.optimization.model import Optimization, OptimizationStatus
from app.modules.optimization.repository import OptimizationRepository
from app.modules.vehicles.repository import VehicleRepository


class OptimizationService:
    def __init__(self, repository: OptimizationRepository, vehicle_repository: VehicleRepository,
                 load_repository: LoadRepository):
        self.repository = repository
        self.vehicle_repository = vehicle_repository
        self.load_repository = load_repository

    def run(self, organization_id: int, payload: dict, *, actor_user_id: int) -> Optimization:
        print(f"\n[SERVICE] Optimization run requested by user {actor_user_id}, org {organization_id}")
        print(f"[SERVICE] Payload: vehicle_id={payload['vehicle_id']}, loads={payload.get('loads', [])}")

        vehicle = self.vehicle_repository.get_by_id(payload["vehicle_id"])
        if not vehicle or vehicle.organization_id != organization_id:
            raise AppError("INVALID_VEHICLE", "Vehicle does not belong to organization", status_code=400)

        load_specs: list[LoadSpec] = []
        total_weight = 0.0
        for item in payload.get("loads", []):
            load_id = item["load_id"]
            quantity = item.get("quantity", 1)
            load = self.load_repository.get_by_id(load_id)
            if not load or load.organization_id != organization_id:
                raise AppError("INVALID_LOAD", "Load does not belong to organization", status_code=400)
            dims = load.dimensions or {}
            load_specs.append(LoadSpec(
                id=load.id,
                type=load.type.value if hasattr(load.type, "value") else str(load.type),
                length_m=dims.get("length", 1.0),
                width_m=dims.get("width", 1.0),
                height_m=dims.get("height", 1.0),
                weight_kg=load.weight,
                quantity=quantity,
                fragile=getattr(load, "fragile", False),
                stackable=getattr(load, "stackable", True),
                hazmat_class=getattr(load, "hazmat_class", None),
                diameter_m=getattr(load, "diameter", None),
            ))
            total_weight += load.weight * quantity

        max_weight = vehicle.capacity or float(vehicle.dimensions.get("max_weight", 0))
        if max_weight <= 0:
            raise AppError("OPTIMIZATION_FAILED", "Vehicle has invalid capacity", status_code=422)
        if total_weight > max_weight:
            raise AppError("OVERWEIGHT_LOAD", "Load exceeds vehicle capacity", status_code=400)

        v_dims = vehicle.dimensions or {}
        v_len = v_dims.get("length", 12.0)
        v_wid = v_dims.get("width", 2.5)
        v_ht = v_dims.get("height", 2.6)
        # Detect and fix unit mismatches
        if v_len > 1000:
            # Values > 1000 are likely in mm (e.g. 12000mm → 12m)
            v_len /= 1000
            v_wid /= 1000
            v_ht /= 1000
            print(f"[SERVICE] Dimensions converted from mm to m: {v_len}x{v_wid}x{v_ht}")
        elif v_len > 100:
            # Values 100-1000 are likely in cm (e.g. 1200cm → 12m)
            v_len /= 100
            v_wid /= 100
            v_ht /= 100
            print(f"[SERVICE] Dimensions converted from cm to m: {v_len}x{v_wid}x{v_ht}")
        elif v_len < 0.1:
            # Values < 0.1 are likely in km (unlikely but handle it)
            v_len *= 1000
            v_wid *= 1000
            v_ht *= 1000
            print(f"[SERVICE] Dimensions converted from km to m: {v_len}x{v_wid}x{v_ht}")

        vehicle_spec = VehicleSpec(
            id=vehicle.id,
            type=vehicle.type.value if hasattr(vehicle.type, "value") else str(vehicle.type),
            length_m=v_len,
            width_m=v_wid,
            height_m=v_ht,
            capacity_kg=vehicle.capacity or max_weight,
            tare_weight_kg=vehicle.tare_weight_kg or 20000,
            plate_type=vehicle.plate_type,
            truck_center_front_m=vehicle.truck_center_front,
            truck_center_rear_m=vehicle.truck_center_rear,
            empty_cg_height_in=vehicle.empty_cg_height_in,
            axle_positions=vehicle.axle_positions,
        )

        constraints = payload.get("constraints", {})
        result = run_optimization(vehicle_spec, load_specs, constraints)

        load_meta: dict[int, dict] = {}
        for item in payload.get("loads", []):
            load = self.load_repository.get_by_id(item["load_id"])
            if load:
                load_meta[load.id] = {
                    "name": f"Load-{load.id}",
                    "type": load.type.value if hasattr(load.type, "value") else str(load.type),
                    "shape": (load.dimensions or {}).get("shape", load.type.value if hasattr(load.type, "value") else str(load.type)),
                    "load_type": (load.dimensions or {}).get("load_type"),
                    "weight": load.weight,
                    "dimensions": load.dimensions or {},
                    "material_type": (load.dimensions or {}).get("material_type"),
                    "texture_url": (load.dimensions or {}).get("texture_url"),
                    "model_url": (load.dimensions or {}).get("model_url"),
                    "orientation": (load.dimensions or {}).get("orientation"),
                    "fragile": getattr(load, "fragile", False),
                    "stackable": getattr(load, "stackable", True),
                    "hazmat_class": getattr(load, "hazmat_class", None),
                }

        result_json = {
            "vehicle": {
                "type": vehicle.type.value if hasattr(vehicle.type, "value") else str(vehicle.type),
                "length_m": v_len,
                "width_m": v_wid,
                "height_m": v_ht,
                "capacity_kg": vehicle.capacity or max_weight,
                "tare_weight_kg": vehicle.tare_weight_kg or 20000,
                "axle_positions": vehicle.axle_positions or [],
            },
            "placements": [
                {
                    "load_id": p.load_id,
                    "x": p.x, "y": p.y, "z": p.z,
                    "rx": p.rx, "ry": p.ry, "rz": p.rz,
                    "rotated": p.rotated,
                    "load": load_meta.get(p.load_id, {}),
                }
                for p in result.placements
            ],
            "metrics": {
                "cg_x": result.metrics.cg_x,
                "cg_y": result.metrics.cg_y,
                "cg_z": result.metrics.cg_z,
                "axle_loads": result.metrics.axle_loads,
                "lateral_imbalance_pct": result.metrics.lateral_imbalance_pct,
                "longitudinal_imbalance_pct": result.metrics.longitudinal_imbalance_pct,
                "volume_utilization": result.metrics.volume_utilization,
                "weight_utilization": result.metrics.weight_utilization,
            },
            "violations": [
                {"rule": v.rule, "message": v.message, "severity": v.severity}
                for v in result.violations
            ],
            "warnings": [
                {"rule": v.rule, "message": v.message, "severity": v.severity}
                for v in result.warnings
            ],
            "error_message": None,
        }

        # Include extra analysis data
        if result.extra_data:
            result_json["material_analysis"] = result.extra_data.get("material_analysis", [])
            result_json["compression_analysis"] = result.extra_data.get("compression_analysis", [])
            result_json["weight_distribution"] = result.extra_data.get("weight_distribution", {})
            result_json["fillers"] = result.extra_data.get("fillers", [])
            result_json["void_count"] = result.extra_data.get("void_count", 0)
            result_json["void_volume"] = result.extra_data.get("void_volume", 0)
            result_json["filled_volume"] = result.extra_data.get("filled_volume", 0)
            result_json["loading_sequence"] = result.extra_data.get("loading_sequence", {})
            result_json["suggested_securements"] = result.extra_data.get("suggested_securements", [])

        efficiency = result.metrics.volume_utilization * 0.5 + result.metrics.weight_utilization * 0.5
        has_errors = any(v.severity == "error" for v in result.violations)
        status = OptimizationStatus.failed if has_errors else OptimizationStatus.completed

        # Always save vehicle info even when optimization fails
        error_message = None
        if has_errors:
            error_violations = [v for v in result.violations if v.severity == "error"]
            error_message = "; ".join(f"{v.rule}: {v.message}" for v in error_violations[:5])
            result_json["error_message"] = error_message
            print(f"[SERVICE] Optimization has {len(error_violations)} errors: {error_message}")

        optimization = Optimization(
            organization_id=organization_id,
            vehicle_id=payload["vehicle_id"],
            input_json=payload,
            status=status,
            result_json=result_json,
            efficiency_score=round(efficiency, 4),
        )
        created = self.repository.create(optimization)
        print(f"[SERVICE] Optimization #{created.id} saved with status={status.value}, placements={len(result.placements)}, efficiency={efficiency:.2%}")
        NotificationRepository(self.repository.db).create(
            Notification(
                user_id=actor_user_id,
                organization_id=organization_id,
                title="Optimization complete",
                body=f"Run #{created.id} finished with efficiency {(efficiency * 100):.1f}%.",
                category="success" if not has_errors else "warning",
                link=f"/jobs/results?id={created.id}",
            ),
        )
        return created

    def get(self, optimization_id: int) -> Optimization | None:
        return self.repository.get_by_id(optimization_id)

    def history(self, organization_id: int) -> list[Optimization]:
        return self.repository.list_by_org(organization_id)

    def autocorrect(self, optimization_id: int, organization_id: int) -> dict:
        from app.core.optimization.autocorrect import auto_correct
        from app.core.optimization.engine import _get_dims
        from app.core.optimization.types import LoadPlacement

        optimization = self.get(optimization_id)
        if not optimization or optimization.organization_id != organization_id:
            raise AppError("NOT_FOUND", "Optimization not found", status_code=404)

        result_json = optimization.result_json or {}
        placements_data = result_json.get("placements", [])
        if not placements_data:
            return {"moves": [], "improvement_score": 1.0, "violations_before": 0, "violations_after": 0}

        # Reconstruct placements
        placements = []
        for pd in placements_data:
            placements.append(LoadPlacement(
                load_id=pd["load_id"], x=pd["x"], y=pd["y"], z=pd["z"],
                rx=pd.get("rx", 0), ry=pd.get("ry", 0), rz=pd.get("rz", 0),
                rotated=pd.get("rotated", False),
                placed_w=pd.get("load", {}).get("dimensions", {}).get("length", 1.0),
                placed_h=pd.get("load", {}).get("dimensions", {}).get("height", 1.0),
                placed_d=pd.get("load", {}).get("dimensions", {}).get("width", 1.0),
            ))

        load_weights = {}
        for pd in placements_data:
            load_id = pd["load_id"]
            if load_id not in load_weights:
                load = self.load_repository.get_by_id(load_id)
                load_weights[load_id] = load.weight if load else 0

        vehicle = self.vehicle_repository.get_by_id(optimization.vehicle_id)
        vehicle_spec = type("VehicleSpec", (), {
            "length_m": result_json.get("vehicle", {}).get("length_m", 12.0),
            "width_m": result_json.get("vehicle", {}).get("width_m", 2.5),
            "height_m": result_json.get("vehicle", {}).get("height_m", 2.6),
        })()

        correction = auto_correct(vehicle_spec, placements, load_weights, [])

        return {
            "moves": correction.moves,
            "improvement_score": correction.improvement_score,
            "violations_before": correction.violations_before,
            "violations_after": correction.violations_after,
            "corrected_placements": [
                {"load_id": p.load_id, "x": p.x, "y": p.y, "z": p.z}
                for p in correction.corrected_placements
            ],
        }
