from pydantic import BaseModel, Field, model_validator


class LoadBaseRequest(BaseModel):
    type: str
    shape: str | None = None
    load_type: str | None = None
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
    material_type: str | None = None
    texture_url: str | None = None
    model_url: str | None = None
    orientation: dict | None = None

    @model_validator(mode="after")
    def validate_dimensions(self):
        dims = self.dimensions or {}
        shape = (self.shape or self.type or "cuboid").lower()
        if shape in ("cube", "cuboid"):
            for key in ("length", "width", "height"):
                value = dims.get(key)
                if value is None or float(value) <= 0:
                    raise ValueError(f"Invalid dimensions: {key} must be > 0")
        elif shape in ("cylinder", "paper_roll", "coil"):
            radius = dims.get("radius")
            height = dims.get("height")
            length = dims.get("length", height)
            if length is None or float(length) <= 0:
                raise ValueError("Invalid dimensions: height/length must be > 0 for cylinder-like loads")
            diameter = self.diameter if self.diameter is not None else dims.get("diameter")
            if diameter is None and radius is not None:
                diameter = float(radius) * 2.0
            if diameter is None or float(diameter) <= 0:
                raise ValueError("Invalid dimensions: radius or diameter must be > 0 for cylinder-like loads")
            dims["length"] = float(length)
            dims["height"] = float(length)
            dims["width"] = float(diameter)
            dims["radius"] = float(diameter) / 2.0
            dims["diameter"] = float(diameter)
            self.dimensions = dims
            self.diameter = float(diameter)
        elif shape == "irregular":
            for key in ("length", "width", "height"):
                value = dims.get(key)
                if value is None or float(value) <= 0:
                    raise ValueError(f"Invalid irregular bounds: {key} must be > 0")
        else:
            raise ValueError(f"Unsupported load type: {shape}")

        dims["shape"] = shape
        if self.load_type:
            dims["load_type"] = self.load_type
        if self.material_type:
            dims["material_type"] = self.material_type
        if self.texture_url:
            dims["texture_url"] = self.texture_url
        if self.model_url:
            dims["model_url"] = self.model_url
        if self.orientation:
            dims["orientation"] = self.orientation
        self.dimensions = dims

        if self.hazmat_class and self.hazmat_class not in ("1", "2", "3", "4", "5", "6", "7", "8", "9"):
            raise ValueError("hazmat_class must be 1-9")
        if self.diameter is not None and self.diameter <= 0:
            raise ValueError("diameter must be > 0")
        return self


class LoadCreateRequest(LoadBaseRequest):
    pass


class LoadUpdateRequest(LoadBaseRequest):
    pass
