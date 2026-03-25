import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Organization, Role, User
from app.schemas import LoginRequest, OrganizationSignup, Token, UserRead
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return Token(access_token=create_access_token(subject=user.email))


@router.post("/signup/admin", response_model=UserRead)
def signup_admin(payload: OrganizationSignup, db: Session = Depends(get_db)) -> User:
    existing_user = db.query(User).filter(User.email == payload.work_email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="User email already exists")

    organization = None
    if payload.invite_code:
        organization = db.query(Organization).filter(Organization.invite_code == payload.invite_code).first()
        if organization is None:
            raise HTTPException(status_code=404, detail="Invalid invite code")
    else:
        organization = Organization(
            name=payload.organization_name,
            invite_code=secrets.token_hex(8),
        )
        db.add(organization)
        db.flush()

    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if admin_role is None:
        raise HTTPException(status_code=500, detail="Admin role not configured")

    user = User(
        email=payload.work_email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        organization_id=organization.id,
    )
    user.roles = [admin_role]
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
