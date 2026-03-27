from app.modules.vehicles.model import Vehicle, VehicleType
from app.modules.vehicles.repository import VehicleRepository


class VehicleService:
    def __init__(self, repository: VehicleRepository):
        self.repository = repository

    def list_vehicles(self, organization_id: int) -> list[Vehicle]:
        return self.repository.list_by_org(organization_id)

    def create_vehicle(self, organization_id: int, payload: dict) -> Vehicle:
        vehicle = Vehicle(
            organization_id=organization_id,
            type=VehicleType(payload["type"]),
            dimensions=payload["dimensions"],
            capacity=payload["capacity"],
        )
        return self.repository.create(vehicle)
