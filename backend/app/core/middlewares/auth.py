from app.core.config import settings
from app.core.database.session import get_db
from app.core.utils.errors import AppError
from app.core.utils.security import decode_access_token
from app.modules.roles.model import Role
from app.modules.users.model import User
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
        request: Request,
        credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
        db: Session = Depends(get_db),
) -> User:
    token: str | None = None
    if credentials and credentials.credentials:
        token = credentials.credentials.strip()
    if not token:
        raw = request.cookies.get(settings.access_token_cookie_name)
        token = raw.strip() if raw else None
    if not token:
        raise AppError("UNAUTHORIZED", "Authentication required", status_code=401)
    try:
        payload = decode_access_token(token)
    except Exception as exc:
        raise AppError("UNAUTHORIZED", "Invalid authentication credentials", status_code=401) from exc
    user_id = payload.get("sub")
    if not user_id:
        raise AppError("UNAUTHORIZED", "Invalid authentication credentials", status_code=401)
    stmt = (
        select(User)
        .where(User.id == int(user_id))
        .options(selectinload(User.role).selectinload(Role.permissions))
    )
    user = db.scalars(stmt).first()
    if not user:
        raise AppError("UNAUTHORIZED", "Invalid authentication credentials", status_code=401)
    return user
