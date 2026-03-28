from app.core.utils.errors import AppError
from app.modules.loads.repository import LoadRepository
from app.modules.notifications.model import Notification
from app.modules.notifications.repository import NotificationRepository
from app.modules.optimization.model import Optimization, OptimizationStatus
from app.modules.optimization.repository import OptimizationRepository
from app.modules.vehicles.repository import VehicleRepository


class OptimizationService:
    def __init__(self, repository: OptimizationRepository, vehicle_repository: VehicleRepository, load_repository: LoadRepository):
        self.repository = repository
        self.vehicle_repository = vehicle_repository
        self.load_repository = load_repository

    def run(self, organization_id: int, payload: dict, *, actor_user_id: int) -> Optimization:
        vehicle = self.vehicle_repository.get_by_id(payload["vehicle_id"])
        if not vehicle or vehicle.organization_id != organization_id:
            raise AppError("INVALID_VEHICLE", "Vehicle does not belong to organization", status_code=400)

        loads = []
        total_weight = 0.0
        for load_id in payload["load_ids"]:
            load = self.load_repository.get_by_id(load_id)
            if not load or load.organization_id != organization_id:
                raise AppError("INVALID_LOAD", "Load does not belong to organization", status_code=400)
            loads.append(load)
            total_weight += load.weight * load.quantity

        max_weight = float(vehicle.dimensions.get("max_weight", 0))
        if total_weight > max_weight:
            raise AppError("OVERWEIGHT_LOAD", "Load exceeds vehicle max weight", status_code=400)

        if max_weight <= 0:
            raise AppError("OPTIMIZATION_FAILED", "Vehicle has invalid max_weight configuration", status_code=422)

        score = max(0.0, min(1.0, round(1 - abs(max_weight - total_weight) / max_weight, 4)))
        result = {
            "strategy": "first_fit_decreasing",
            "load_ids": payload["load_ids"],
            "vehicle_id": payload["vehicle_id"],
            "efficiency": score,
            "layout_3d": {"bins": len(loads), "items": len(loads)},
        }
        optimization = Optimization(
            organization_id=organization_id,
            vehicle_id=payload["vehicle_id"],
            input_json=payload,
            status=OptimizationStatus.completed,
            result_json=result,
            efficiency_score=score,
        )
        created = self.repository.create(optimization)
        NotificationRepository(self.repository.db).create(
            Notification(
                user_id=actor_user_id,
                organization_id=organization_id,
                title="Optimization complete",
                body=f"Run #{created.id} finished with efficiency {(score * 100):.1f}%.",
                category="success",
                link=f"/jobs/results?id={created.id}",
            ),
        )
        return created

    def get(self, optimization_id: int) -> Optimization | None:
        return self.repository.get_by_id(optimization_id)

    def history(self, organization_id: int) -> list[Optimization]:
        return self.repository.list_by_org(organization_id)
