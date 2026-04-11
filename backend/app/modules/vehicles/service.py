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
        vehicle = Vehicle(
            organization_id=organization_id,
            type=VehicleType(payload["type"]),
            dimensions=payload["dimensions"],
            capacity=payload["capacity"],
            tare_weight_kg=payload.get("tare_weight_kg"),
            plate_type=payload.get("plate_type"),
            truck_center_front=payload.get("truck_center_front"),
            truck_center_rear=payload.get("truck_center_rear"),
            empty_cg_height_in=payload.get("empty_cg_height_in"),
            axle_positions=payload.get("axle_positions"),
        )
        return self.repository.create(vehicle)

    def update_vehicle(self, organization_id: int, vehicle_id: int, payload: dict) -> Vehicle:
        vehicle = self.get_vehicle(organization_id, vehicle_id)
        if "type" in payload and payload["type"]:
            vehicle.type = VehicleType(payload["type"])
        if "dimensions" in payload and payload["dimensions"]:
            vehicle.dimensions = payload["dimensions"]
        if "capacity" in payload and payload["capacity"] is not None:
            vehicle.capacity = payload["capacity"]
        if "tare_weight_kg" in payload:
            vehicle.tare_weight_kg = payload["tare_weight_kg"]
        if "plate_type" in payload:
            vehicle.plate_type = payload["plate_type"]
        if "truck_center_front" in payload:
            vehicle.truck_center_front = payload["truck_center_front"]
        if "truck_center_rear" in payload:
            vehicle.truck_center_rear = payload["truck_center_rear"]
        if "empty_cg_height_in" in payload:
            vehicle.empty_cg_height_in = payload["empty_cg_height_in"]
        if "axle_positions" in payload:
            vehicle.axle_positions = payload["axle_positions"]
        return self.repository.save(vehicle)

    def delete_vehicle(self, organization_id: int, vehicle_id: int) -> None:
        vehicle = self.get_vehicle(organization_id, vehicle_id)
        self.repository.delete(vehicle)
