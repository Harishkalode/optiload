from pydantic import BaseModel, Field, model_validator


class VehicleBaseRequest(BaseModel):
    type: str
    dimensions: dict
    capacity: float = Field(gt=0)

    @model_validator(mode="after")
    def validate_dimensions(self):
        for key in ("length", "width", "height", "max_weight"):
            value = self.dimensions.get(key)
            if value is None or float(value) <= 0:
                raise ValueError(f"Invalid dimensions: {key} must be > 0")
        return self


class VehicleCreateRequest(VehicleBaseRequest):
    pass


class VehicleUpdateRequest(VehicleBaseRequest):
    pass
