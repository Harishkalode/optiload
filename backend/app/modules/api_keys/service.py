import secrets

from app.core.utils.errors import AppError
from app.core.utils.security import hash_password, verify_password
from app.modules.api_keys.repository import ApiKeyRepository
from app.modules.auth.model import ApiKey


class ApiKeyService:
    def __init__(self, repository: ApiKeyRepository):
        self.repository = repository

    def list_keys(self, organization_id: int) -> list[ApiKey]:
        return self.repository.list_by_org(organization_id)

    def create_key(self, organization_id: int, permissions_json: dict) -> tuple[ApiKey, str]:
        raw_key = f"ok_{secrets.token_urlsafe(32)}"
        api_key = ApiKey(
            organization_id=organization_id,
            key_hash=hash_password(raw_key),
            permissions_json=permissions_json,
        )
        created = self.repository.create(api_key)
        return created, raw_key

    def delete_key(self, organization_id: int, key_id: int) -> None:
        key = self.repository.get_by_id(key_id)
        if not key:
            raise AppError("NOT_FOUND", "API key not found", status_code=404)
        if key.organization_id != organization_id:
            raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
        self.repository.delete(key)

    def validate_key(self, raw_key: str) -> ApiKey | None:
        keys = self.repository.list_all()
        for key in keys:
            if verify_password(raw_key, key.key_hash):
                return key
        return None
