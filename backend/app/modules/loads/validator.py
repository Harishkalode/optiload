from pydantic import BaseModel, Field, model_validator


class LoadBaseRequest(BaseModel):
    type: str
    dimensions: dict
    weight: float = Field(gt=0)
    quantity: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def validate_dimensions(self):
        for key in ("length", "width", "height"):
            value = self.dimensions.get(key)
            if value is None or float(value) <= 0:
                raise ValueError(f"Invalid dimensions: {key} must be > 0")
        return self


class LoadCreateRequest(LoadBaseRequest):
    pass


class LoadUpdateRequest(LoadBaseRequest):
    pass
