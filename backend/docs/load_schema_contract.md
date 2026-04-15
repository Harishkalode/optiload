# Load Schema Contract (FE ↔ BE ↔ 3D)

## Create / Update payload

```json
{
  "type": "cube",
  "shape": "cuboid",
  "load_type": "pallet",
  "dimensions": {
    "length": 1.2,
    "width": 1.0,
    "height": 1.4
  },
  "weight": 860,
  "quantity": 1,
  "material_type": "wood",
  "texture_url": "https://cdn.example.com/textures/pallet_albedo.jpg",
  "model_url": "https://cdn.example.com/models/pallet.glb",
  "orientation": { "x": 0, "y": 90, "z": 0 },
  "fragile": false,
  "stackable": true
}
```

## Shape rules

- `cuboid`: requires `dimensions.length`, `dimensions.width`, `dimensions.height`.
- `cylinder`: accepts `dimensions.radius` + `dimensions.height` (or `diameter`), backend normalizes:
  - `dimensions.length` = height
  - `dimensions.width` = diameter
  - `dimensions.height` = height
- `irregular`: requires bounding-box dimensions and may include `model_url`.

## Response fields

- `shape`, `load_type`, `material_type`, `texture_url`, `model_url`, `orientation` are returned in load API responses.
- optimization result placement embeds these fields in `result.placements[].load` for FE renderers.
