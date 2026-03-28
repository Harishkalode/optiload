from app.core.utils.errors import AppError
from app.modules.vehicles.model import Vehicle, VehicleType
from app.modules.vehicles.repository import VehicleRepository


class VehicleService:
    def __init__(self, repository: VehicleRepository):
        self.repository = repository

    def list_vehicles(self, organization_id: int) -> list[Vehicle]:
        return self.repository.list_by_org(organization_id)

    def get_vehicle(self, organization_id: int, vehicle_id: int) -> Vehicle:
        vehicle = self.repository.get_by_id(vehicle_id)
        if not vehicle:
            raise AppError("NOT_FOUND", "Vehicle not found", status_code=404)
        if vehicle.organization_id != organization_id:
            raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
        return vehicle

    def create_vehicle(self, organization_id: int, payload: dict) -> Vehicle:
        vehicle = Vehicle(organization_id=organization_id, type=VehicleType(payload["type"]),
                          dimensions=payload["dimensions"], capacity=payload["capacity"])
        return self.repository.create(vehicle)

    def update_vehicle(self, organization_id: int, vehicle_id: int, payload: dict) -> Vehicle:
        vehicle = self.get_vehicle(organization_id, vehicle_id)
        vehicle.type = VehicleType(payload["type"])
        vehicle.dimensions = payload["dimensions"]
        vehicle.capacity = payload["capacity"]
        return self.repository.save(vehicle)

    def delete_vehicle(self, organization_id: int, vehicle_id: int) -> None:
        vehicle = self.get_vehicle(organization_id, vehicle_id)
        self.repository.delete(vehicle)
