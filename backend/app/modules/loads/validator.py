from pydantic import BaseModel, Field, model_validator


class LoadBaseRequest(BaseModel):
    type: str
    dimensions: dict
    weight: float = Field(gt=0)
    quantity: int = Field(default=1, ge=1)
    cg_x: float | None = None
    cg_y: float | None = None
    cg_z: float | None = None
    fragile: bool = False
    stackable: bool = True
    hazmat_class: str | None = None
    diameter: float | None = None

    @model_validator(mode="after")
    def validate_dimensions(self):
        dims = self.dimensions or {}
        shape = self.type
        if shape in ("cube", "cuboid"):
            for key in ("length", "width", "height"):
                value = dims.get(key)
                if value is None or float(value) <= 0:
                    raise ValueError(f"Invalid dimensions: {key} must be > 0")
        elif shape in ("cylinder", "paper_roll", "coil"):
            length = dims.get("length")
            if length is None or float(length) <= 0:
                raise ValueError("Invalid dimensions: length must be > 0 for cylinder-like loads")
            diameter = self.diameter if self.diameter is not None else dims.get("diameter")
            if diameter is None or float(diameter) <= 0:
                raise ValueError("Invalid dimensions: diameter must be > 0 for cylinder-like loads")
            dims.setdefault("width", float(diameter))
            dims.setdefault("height", float(diameter))
            self.dimensions = dims
            if self.diameter is None:
                self.diameter = float(diameter)
        else:
            raise ValueError(f"Unsupported load type: {shape}")
        if self.hazmat_class and self.hazmat_class not in ("1", "2", "3", "4", "5", "6", "7", "8", "9"):
            raise ValueError("hazmat_class must be 1-9")
        if self.diameter is not None and self.diameter <= 0:
            raise ValueError("diameter must be > 0")
        return self


class LoadCreateRequest(LoadBaseRequest):
    pass


class LoadUpdateRequest(LoadBaseRequest):
    pass
