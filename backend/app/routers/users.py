from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user, require_role
from app.models import Role, User
from app.schemas import UserCreate, UserRead
from app.security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.get("", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("superuser", "admin", "sub-admin")),
) -> list[User]:
    query = db.query(User).options(joinedload(User.roles).joinedload(Role.permissions))
    user_roles = {role.name for role in current_user.roles}

    if "superuser" in user_roles:
        return query.all()
    if "admin" in user_roles:
        return query.filter((User.id == current_user.id) | (User.parent_admin_id == current_user.id)).all()
    return [current_user]


@router.post("", response_model=UserRead)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("superuser", "admin")),
) -> User:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already exists")

    role = db.query(Role).filter(Role.name == payload.role).first()
    if role is None:
        raise HTTPException(status_code=400, detail="Invalid role")

    current_user_roles = {r.name for r in current_user.roles}
    if "admin" in current_user_roles and payload.role != "sub-admin":
        raise HTTPException(status_code=403, detail="Admin can only create sub-admin users")

    parent_admin_id = payload.parent_admin_id
    if payload.role == "sub-admin":
        parent_admin_id = current_user.id if "admin" in current_user_roles else payload.parent_admin_id

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        parent_admin_id=parent_admin_id,
    )
    user.roles = [role]
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
