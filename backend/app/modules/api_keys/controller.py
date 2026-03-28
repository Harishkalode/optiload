from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.middlewares.tenant import get_tenant_organization_id
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.api_keys.repository import ApiKeyRepository
from app.modules.api_keys.service import ApiKeyService
from app.modules.api_keys.validator import ApiKeyCreateRequest
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api-keys", tags=["api_keys"])


@router.get("")
def list_api_keys(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    keys = ApiKeyService(ApiKeyRepository(db)).list_keys(org_id)
    return success_response(
        [{"id": k.id, "organization_id": k.organization_id, "permissions_json": k.permissions_json} for k in keys])


@router.post("")
def create_api_key(payload: ApiKeyCreateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    created, raw_key = ApiKeyService(ApiKeyRepository(db)).create_key(org_id, payload.permissions_json)
    return success_response({"id": created.id, "api_key": raw_key})


@router.delete("/{key_id}")
def delete_api_key(key_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    org_id = get_tenant_organization_id(current_user)
    if org_id is None:
        raise AppError("ORG_REQUIRED", "organization context is required")
    ApiKeyService(ApiKeyRepository(db)).delete_key(org_id, key_id)
    return success_response({"deleted": True})
