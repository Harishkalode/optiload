from app.core.utils.errors import AppError
from app.modules.vehicles.model import Vehicle, VehicleType
from app.modules.vehicles.repository import VehicleRepository

# AAR Standard Vehicle Dimensions (Phase 2)
# All values in meters, kg. Interior dimensions for cargo space.
AAR_VEHICLES = {
    "boxcar": {
        "length_m": 15.24,     # 50ft interior
        "width_m": 2.74,       # 9ft
        "height_m": 2.74,      # 9ft
        "capacity_kg": 90700,  # 100 US tons
        "tare_weight_kg": 28600,
        "empty_cg_height_m": 1.60,
        "truck_center_front_m": 2.5,
        "truck_center_rear_m": 13.0,
        "axle_count": 4,
        "per_axle_limit_kg": 22500,
        "platform_height_m": 1.1,
        "doorway_width_m": 2.44,
        "doorway_height_m": 2.59,
        "has_roof": True,
        "has_walls": True,
        "max_layer_height_m": 2.59,
    },
    "flatcar": {
        "length_m": 18.29,      # 60ft deck
        "width_m": 2.74,        # 9ft
        "height_m": 3.0,        # No sides, stack height limited by clearance
        "capacity_kg": 81600,   # 90 US tons
        "tare_weight_kg": 22700,
        "empty_cg_height_m": 0.75,  # Low CG (deck only)
        "truck_center_front_m": 2.5,
        "truck_center_rear_m": 16.0,
        "axle_count": 4,
        "per_axle_limit_kg": 22500,
        "platform_height_m": 1.1,
        "has_roof": False,
        "has_walls": False,
        "max_layer_height_m": 3.0,
    },
    "gondola": {
        "length_m": 15.85,      # 52ft
        "width_m": 2.93,        # 9ft 7in
        "height_m": 1.98,       # 6ft 6in
        "capacity_kg": 113400,  # 125 US tons
        "tare_weight_kg": 24900,
        "empty_cg_height_m": 1.20,
        "truck_center_front_m": 2.5,
        "truck_center_rear_m": 13.5,
        "axle_count": 4,
        "per_axle_limit_kg": 22500,
        "platform_height_m": 1.1,
        "has_roof": False,
        "has_walls": True,
        "max_layer_height_m": 1.83,
    },
    "reefer": {
        "length_m": 15.24,      # 50ft interior
        "width_m": 2.59,        # 8ft 6in (narrower for insulation)
        "height_m": 2.44,       # 8ft
        "capacity_kg": 72500,   # 80 US tons
        "tare_weight_kg": 31800,
        "empty_cg_height_m": 1.60,
        "truck_center_front_m": 2.5,
        "truck_center_rear_m": 13.0,
        "axle_count": 4,
        "per_axle_limit_kg": 22500,
        "platform_height_m": 1.1,
        "doorway_width_m": 2.13,
        "doorway_height_m": 2.29,
        "has_roof": True,
        "has_walls": True,
        "max_layer_height_m": 2.29,
        "engine_room_depth_m": 0.6,  # Reefer engine takes front space
    },
    "container": {
        "length_m": 12.19,      # 40ft ISO container
        "width_m": 2.44,        # 8ft
        "height_m": 2.59,       # 8ft 6in
        "capacity_kg": 30480,   # 67,200 lbs
        "tare_weight_kg": 3780,
        "empty_cg_height_m": 1.20,
        "truck_center_front_m": 1.5,
        "truck_center_rear_m": 10.5,
        "axle_count": 4,
        "per_axle_limit_kg": 22500,
        "platform_height_m": 1.1,
        "has_roof": True,
        "has_walls": True,
        "max_layer_height_m": 2.44,
    },
}


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
            empty_cg_height_m=payload.get("empty_cg_height_m"),
            axle_positions=payload.get("axle_positions"),
            axle_count=payload.get("axle_count"),
            per_axle_limit_kg=payload.get("per_axle_limit_kg"),
            doorway_width_m=payload.get("doorway_width_m"),
            doorway_height_m=payload.get("doorway_height_m"),
            platform_height_m=payload.get("platform_height_m"),
        )
        return self.repository.create(vehicle)

    def bootstrap_default_vehicles(self, organization_id: int) -> list[Vehicle]:
        """Create one AAR-standard vehicle per type for an organization.
        Skips types that already exist for this org."""
        existing = {v.type.value for v in self.repository.list_by_org(organization_id)}
        created = []
        for vtype, dims in AAR_VEHICLES.items():
            if vtype in existing:
                continue
            axles = []
            axle_spacing = 1.2
            front_center = dims["truck_center_front_m"]
            rear_center = dims["truck_center_rear_m"]
            half_count = dims["axle_count"] // 2
            for i in range(half_count):
                axles.append(front_center - axle_spacing + i * axle_spacing)
            for i in range(half_count):
                axles.append(rear_center - axle_spacing + i * axle_spacing)
            axles.sort()

            vehicle = Vehicle(
                organization_id=organization_id,
                type=VehicleType(vtype),
                dimensions={"length": dims["length_m"], "width": dims["width_m"], "height": dims["height_m"]},
                capacity=dims["capacity_kg"],
                tare_weight_kg=dims["tare_weight_kg"],
                empty_cg_height_m=dims["empty_cg_height_m"],
                empty_cg_height_in=dims["empty_cg_height_m"] * 39.3701,
                axle_positions=axles,
                axle_count=dims["axle_count"],
                per_axle_limit_kg=dims["per_axle_limit_kg"],
                doorway_width_m=dims.get("doorway_width_m"),
                doorway_height_m=dims.get("doorway_height_m"),
                platform_height_m=dims["platform_height_m"],
            )
            created.append(self.repository.create(vehicle))
        return created

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
