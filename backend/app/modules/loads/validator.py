from pydantic import BaseModel, Field, model_validator


class LoadBaseRequest(BaseModel):
    type: str
    dimensions: dict
    weight: float = Field(gt=0)
    quantity: int = Field(default=1, ge=1, le=1000)
    fragile: bool = False
    stackable: bool = True
    hazmat_class: str | None = None
    diameter: float | None = None

    @model_validator(mode="after")
    def validate_dimensions(self):
        dims = self.dimensions or {}
        shape = (self.type or "cube").lower()
        
        # Validate dimensions exist and are positive
        if shape in ("cube", "cuboid", "pallet"):
            for key in ("length", "width", "height"):
                value = dims.get(key)
                if value is None:
                    raise ValueError(f"Missing dimension: {key}")
                try:
                    fval = float(value)
                    if fval <= 0.01 or fval > 10:
                        raise ValueError(f"Invalid {key}: must be between 0.01m and 10m")
                    dims[key] = fval
                except (ValueError, TypeError):
                    raise ValueError(f"Invalid {key}: must be a positive number")
        
        elif shape in ("cylinder", "paper_roll", "roll", "coil"):
            # For cylinders: diameter and height/length required
            length = dims.get("length") or dims.get("height")
            if length is None:
                raise ValueError("Missing dimension: length/height required for cylindrical loads")
            
            try:
                length_val = float(length)
                if length_val <= 0.01 or length_val > 10:
                    raise ValueError("Invalid length: must be between 0.01m and 10m")
                dims["length"] = length_val
                dims["height"] = length_val
            except (ValueError, TypeError):
                raise ValueError("Invalid length: must be a positive number")
            
            # Diameter from self.diameter or dimensions
            diameter = self.diameter or dims.get("diameter")
            if diameter is None:
                raise ValueError("Missing dimension: diameter required for cylindrical loads")
            
            try:
                diam_val = float(diameter)
                if diam_val <= 0.01 or diam_val > 10:
                    raise ValueError("Invalid diameter: must be between 0.01m and 10m")
                dims["diameter"] = diam_val
                dims["width"] = diam_val
                self.diameter = diam_val
            except (ValueError, TypeError):
                raise ValueError("Invalid diameter: must be a positive number")
        
        else:
            raise ValueError(f"Unsupported load type: {shape}. Must be: cube, cylinder, roll, pallet, or coil")
        
        # Validate weight
        try:
            weight_val = float(self.weight)
            if weight_val < 1 or weight_val > 100000:
                raise ValueError("Weight must be between 1kg and 100,000kg")
        except (ValueError, TypeError):
            raise ValueError("Invalid weight: must be a positive number")
        
        # Validate hazmat class if provided
        if self.hazmat_class:
            valid_classes = ("1", "2", "3", "4", "5", "6", "7", "8", "9")
            if self.hazmat_class not in valid_classes:
                raise ValueError(f"Invalid hazmat_class: must be one of {valid_classes}")
        
        self.dimensions = dims
        return self


class LoadCreateRequest(LoadBaseRequest):
    pass


class LoadUpdateRequest(LoadBaseRequest):
    pass
