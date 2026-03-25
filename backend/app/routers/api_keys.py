import secrets

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_role
from app.models import ApiKey, User
from app.schemas import ApiKeyCreate, ApiKeyRead
from app.security import hash_password

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.post("", response_model=dict)
def create_api_key(
    payload: ApiKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> dict:
    raw_key = f"ol_{secrets.token_hex(16)}"
    item = ApiKey(
        organization_id=current_user.organization_id,
        key_name=payload.key_name,
        key_prefix=raw_key[:10],
        hashed_secret=hash_password(raw_key),
        environment=payload.environment,
        is_active=True,
    )
    db.add(item)
    db.commit()
    return {"api_key": raw_key, "prefix": item.key_prefix}


@router.get("", response_model=list[ApiKeyRead])
def list_api_keys(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))) -> list[ApiKey]:
    return db.query(ApiKey).filter(ApiKey.organization_id == current_user.organization_id).all()
