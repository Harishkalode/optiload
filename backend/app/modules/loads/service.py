from app.core.utils.errors import AppError
from app.modules.loads.model import Load, LoadType
from app.modules.loads.repository import LoadRepository


class LoadService:
    def __init__(self, repository: LoadRepository):
        self.repository = repository

    def list_loads(self, organization_id: int) -> list[Load]:
        return self.repository.list_by_org(organization_id)

    def get_load(self, organization_id: int, load_id: int) -> Load:
        load = self.repository.get_by_id(load_id)
        if not load:
            raise AppError("NOT_FOUND", "Load not found", status_code=404)
        if load.organization_id != organization_id:
            raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
        return load

    def create_load(self, organization_id: int, payload: dict) -> Load:
        load = Load(
            organization_id=organization_id,
            type=LoadType(payload["type"]),
            dimensions=payload["dimensions"],
            weight=payload["weight"],
            quantity=payload.get("quantity", 1),
            cg_x=payload.get("cg_x"),
            cg_y=payload.get("cg_y"),
            cg_z=payload.get("cg_z"),
            fragile=payload.get("fragile", False),
            stackable=payload.get("stackable", True),
            hazmat_class=payload.get("hazmat_class"),
            diameter=payload.get("diameter"),
        )
        return self.repository.create(load)

    def update_load(self, organization_id: int, load_id: int, payload: dict) -> Load:
        load = self.get_load(organization_id, load_id)
        for field in ("type", "dimensions", "weight", "quantity", "cg_x", "cg_y", "cg_z",
                       "fragile", "stackable", "hazmat_class", "diameter"):
            if field in payload:
                if field == "type":
                    setattr(load, field, LoadType(payload[field]))
                else:
                    setattr(load, field, payload[field])
        return self.repository.save(load)

    def delete_load(self, organization_id: int, load_id: int) -> None:
        load = self.get_load(organization_id, load_id)
        self.repository.delete(load)
