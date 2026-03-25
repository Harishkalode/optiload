from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        subject = payload.get("sub")
        if subject is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.query(User).filter(User.email == subject).first()
    if user is None:
        raise credentials_exception
    return user


def require_role(*allowed_roles: str):
    def _require(user: User = Depends(get_current_user)) -> User:
        user_role_names = {role.name for role in user.roles}
        if not user_role_names.intersection(set(allowed_roles)):
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user

    return _require


def require_org_user(user: User = Depends(require_role("admin", "sub-admin"))) -> User:
    if user.organization_id is None:
        raise HTTPException(status_code=400, detail="User is not attached to organization")
    return user
