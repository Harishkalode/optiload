from app.modules.auth.model import ApiKey
from sqlalchemy import select
from sqlalchemy.orm import Session


class ApiKeyRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_org(self, organization_id: int) -> list[ApiKey]:
        return list(self.db.scalars(select(ApiKey).where(ApiKey.organization_id == organization_id)).all())

    def create(self, api_key: ApiKey) -> ApiKey:
        self.db.add(api_key)
        self.db.commit()
        self.db.refresh(api_key)
        return api_key

    def get_by_id(self, key_id: int) -> ApiKey | None:
        return self.db.get(ApiKey, key_id)

    def delete(self, api_key: ApiKey) -> None:
        self.db.delete(api_key)
        self.db.commit()
