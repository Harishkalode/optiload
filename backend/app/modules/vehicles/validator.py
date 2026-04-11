from pydantic import BaseModel, Field, model_validator


class VehicleBaseRequest(BaseModel):
    type: str
    dimensions: dict
    capacity: float = Field(gt=0)
    tare_weight_kg: float | None = None
    plate_type: str | None = None
    truck_center_front: float | None = None
    truck_center_rear: float | None = None
    empty_cg_height_in: float | None = None
    axle_positions: list | None = None

    @model_validator(mode="after")
    def validate_dimensions(self):
        for key in ("length", "width", "height"):
            value = self.dimensions.get(key)
            if value is None or float(value) <= 0:
                raise ValueError(f"Invalid dimensions: {key} must be > 0")
        if self.plate_type and self.plate_type not in ("A", "B", "C"):
            raise ValueError("plate_type must be A, B, or C")
        if self.axle_positions and any(v <= 0 for v in self.axle_positions):
            raise ValueError("axle_positions must all be > 0")
        return self


class VehicleCreateRequest(VehicleBaseRequest):
    pass


class VehicleUpdateRequest(VehicleBaseRequest):
    pass
