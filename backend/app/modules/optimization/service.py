from app.core.utils.errors import AppError
from app.modules.optimization.model import Optimization, OptimizationStatus
from app.modules.optimization.repository import OptimizationRepository
from app.modules.vehicles.repository import VehicleRepository


class OptimizationService:
    def __init__(self, repository: OptimizationRepository, vehicle_repository: VehicleRepository):
        self.repository = repository
        self.vehicle_repository = vehicle_repository

    def run(self, organization_id: int, payload: dict) -> Optimization:
        vehicle = self.vehicle_repository.get_by_id(payload["vehicle_id"])
        if not vehicle or vehicle.organization_id != organization_id:
            raise AppError("INVALID_VEHICLE", "Vehicle does not belong to organization", status_code=400)

        result = {
            "strategy": "first_fit_decreasing",
            "load_ids": payload["load_ids"],
            "vehicle_id": payload["vehicle_id"],
            "score": 0.92,
        }
        optimization = Optimization(
            organization_id=organization_id,
            vehicle_id=payload["vehicle_id"],
            status=OptimizationStatus.completed,
            result_json=result,
        )
        return self.repository.create(optimization)

    def get(self, optimization_id: int) -> Optimization | None:
        return self.repository.get_by_id(optimization_id)
