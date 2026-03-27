from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.utils.errors import AppError
from app.core.utils.security import decode_access_token
from app.modules.users.model import User

bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(credentials.credentials)
    except Exception as exc:
        raise AppError("UNAUTHORIZED", "Invalid authentication credentials", status_code=401) from exc
    user_id = payload.get("sub")
    if isinstance(user_id, str) and user_id.startswith("refresh:"):
<<<<<<< codex/design-backend-for-application-features-4eh9m7
        raise AppError("UNAUTHORIZED", "Refresh token cannot access protected endpoints", status_code=401)
=======
        user_id = user_id.split(":", 1)[1]
>>>>>>> main
    user = db.get(User, int(user_id)) if user_id else None
    if not user:
        raise AppError("UNAUTHORIZED", "Invalid authentication credentials", status_code=401)
    return user
