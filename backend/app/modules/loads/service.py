from app.modules.loads.model import Load, LoadType
from app.modules.loads.repository import LoadRepository


class LoadService:
    def __init__(self, repository: LoadRepository):
        self.repository = repository

    def list_loads(self, organization_id: int) -> list[Load]:
        return self.repository.list_by_org(organization_id)

    def create_load(self, organization_id: int, payload: dict) -> Load:
        load = Load(
            organization_id=organization_id,
            type=LoadType(payload["type"]),
            dimensions=payload["dimensions"],
            weight=payload["weight"],
        )
        return self.repository.create(load)
