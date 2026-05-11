from pydantic import BaseModel, Field, model_validator

# AAR Standard Vehicle Dimensions (Phase 0.2)
AAR_VEHICLES = {
    "boxcar": {
        "length_m": 40.67,  # 133'6"
        "width_m": 2.74,    # 9'0"
        "height_m": 2.74,   # 9'0" interior
        "capacity_kg": 60000,
        "tare_weight_kg": 30400,
        "empty_cg_height_m": 1.60,
        "truck_center_front_m": 3.0,
        "truck_center_rear_m": 35.0,
        "axle_count": 8,
        "per_axle_limit_kg": 22500,
        "platform_height_m": 1.50,
        "doorway_width_m": 2.0,
        "doorway_height_m": 2.44,
    },
    "flatcar": {
        "length_m": 40.67,  # 133'6"
        "width_m": 2.74,    # 9'0"
        "height_m": 3.0,    # No sides, open deck
        "capacity_kg": 80000,
        "tare_weight_kg": 20400,
        "empty_cg_height_m": 0.75,  # Low center of gravity (deck only)
        "truck_center_front_m": 3.0,
        "truck_center_rear_m": 35.0,
        "axle_count": 8,
        "per_axle_limit_kg": 22500,
        "platform_height_m": 1.50,
    },
    "gondola": {
        "length_m": 38.0,   # 125'
        "width_m": 2.93,    # 9'7"
        "height_m": 1.98,   # 6'6" interior
        "capacity_kg": 70000,
        "tare_weight_kg": 22700,
        "empty_cg_height_m": 1.20,
        "truck_center_front_m": 3.0,
        "truck_center_rear_m": 32.0,
        "axle_count": 8,
        "per_axle_limit_kg": 22500,
        "platform_height_m": 1.50,
    },
    "reefer": {
        "length_m": 40.67,  # 133'6"
        "width_m": 2.59,    # 8'6" interior (narrower for insulation)
        "height_m": 2.44,   # 8'0"
        "capacity_kg": 55000,
        "tare_weight_kg": 35000,  # Heavier due to insulation
        "empty_cg_height_m": 1.60,
        "truck_center_front_m": 3.0,
        "truck_center_rear_m": 35.0,
        "axle_count": 8,
        "per_axle_limit_kg": 22500,
        "platform_height_m": 1.50,
        "doorway_width_m": 2.0,
        "doorway_height_m": 2.44,
    },
    "container": {
        "length_m": 12.0,   # 40' container
        "width_m": 2.35,    # 7'8"
        "height_m": 2.39,   # 7'10"
        "capacity_kg": 30000,
        "tare_weight_kg": 4000,
        "empty_cg_height_m": 1.20,
        "truck_center_front_m": 1.5,
        "truck_center_rear_m": 10.5,
        "axle_count": 2,
        "per_axle_limit_kg": 22500,
        "platform_height_m": 1.50,
    },
}


class VehicleBaseRequest(BaseModel):
    type: str
    dimensions: dict | None = None
    capacity: float | None = None
    tare_weight_kg: float | None = None
    plate_type: str | None = None
    truck_center_front: float | None = None
    truck_center_rear: float | None = None
    empty_cg_height_in: float | None = None
    empty_cg_height_m: float | None = None
    axle_positions: list[float] | None = None
    axle_count: int | None = None
    per_axle_limit_kg: float | None = None
    doorway_width_m: float | None = None
    doorway_height_m: float | None = None
    platform_height_m: float | None = None

    @model_validator(mode="after")
    def validate_and_populate_defaults(self):
        vehicle_type = (self.type or "").lower()
        
        # Use AAR standard defaults if not provided
        if vehicle_type in AAR_VEHICLES:
            defaults = AAR_VEHICLES[vehicle_type]
            
            # Populate dimensions with AAR standard if not provided
            if not self.dimensions:
                self.dimensions = {
                    "length": defaults["length_m"],
                    "width": defaults["width_m"],
                    "height": defaults["height_m"],
                }
            else:
                # Validate provided dimensions are realistic
                for key in ("length", "width", "height"):
                    if key in self.dimensions:
                        val = float(self.dimensions[key])
                        if val < 5 or val > 50:
                            raise ValueError(f"Invalid {key}: must be between 5m and 50m")
            
            # Populate capacity if not provided
            if not self.capacity:
                self.capacity = defaults["capacity_kg"]
            else:
                if self.capacity < 10000 or self.capacity > 100000:
                    raise ValueError("Capacity must be between 10,000kg and 100,000kg")
            
            # Populate tare_weight if not provided
            if not self.tare_weight_kg:
                self.tare_weight_kg = defaults["tare_weight_kg"]
            else:
                if self.tare_weight_kg < 5000 or self.tare_weight_kg > 50000:
                    raise ValueError("Tare weight must be between 5,000kg and 50,000kg")
            
            # Populate empty_cg_height if not provided
            if not self.empty_cg_height_m:
                self.empty_cg_height_m = defaults["empty_cg_height_m"]
            
            # Convert empty_cg_height_in to meters if provided
            if self.empty_cg_height_in and not self.empty_cg_height_m:
                self.empty_cg_height_m = self.empty_cg_height_in / 39.3701
            
            # Populate truck centers if not provided
            if not self.truck_center_front:
                self.truck_center_front = defaults["truck_center_front_m"]
            if not self.truck_center_rear:
                self.truck_center_rear = defaults["truck_center_rear_m"]
            
            # Populate axle info if not provided
            if not self.axle_count:
                self.axle_count = defaults["axle_count"]
            if not self.per_axle_limit_kg:
                self.per_axle_limit_kg = defaults["per_axle_limit_kg"]
            if not self.platform_height_m:
                self.platform_height_m = defaults["platform_height_m"]
            
            # Generate axle positions if not provided
            if not self.axle_positions:
                # Standard configuration: front truck at 3m, rear at 35m (for 40'6" cars)
                # Each truck has 4 axles spaced ~1.2m apart
                front_truck_center = self.truck_center_front
                rear_truck_center = self.truck_center_rear
                axle_spacing = 1.2
                
                self.axle_positions = []
                for i in range(self.axle_count // 2):  # Two axles per truck
                    self.axle_positions.append(front_truck_center - axle_spacing + i * axle_spacing)
                for i in range(self.axle_count // 2):  # Two axles per truck
                    self.axle_positions.append(rear_truck_center - axle_spacing + i * axle_spacing)
                self.axle_positions.sort()
            
            # Populate doorway dimensions for boxcars/reefers
            if vehicle_type in ("boxcar", "reefer"):
                if not self.doorway_width_m:
                    self.doorway_width_m = defaults.get("doorway_width_m", 2.0)
                if not self.doorway_height_m:
                    self.doorway_height_m = defaults.get("doorway_height_m", 2.44)
        else:
            raise ValueError(
                f"Unsupported vehicle type: {vehicle_type}. "
                f"Must be one of: {list(AAR_VEHICLES.keys())}"
            )
        
        # Validate plate_type
        if self.plate_type and self.plate_type not in ("A", "B", "C", "D"):
            raise ValueError("plate_type must be A, B, C, or D")
        
        # Validate axle positions
        if self.axle_positions:
            if any(v <= 0 for v in self.axle_positions):
                raise ValueError("axle_positions must all be > 0")
            if len(self.axle_positions) < 2:
                raise ValueError("Must have at least 2 axles")
        
        return self


class VehicleCreateRequest(VehicleBaseRequest):
    pass


class VehicleUpdateRequest(VehicleBaseRequest):
    pass
