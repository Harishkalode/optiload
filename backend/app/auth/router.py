from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

from app.core.security import create_access_token

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
def login(payload: LoginRequest) -> dict[str, str]:
    token = create_access_token({"sub": payload.email, "role": "org_owner"})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/register")
def register() -> dict[str, str]:
    return {"status": "registered"}


@router.post("/refresh")
def refresh() -> dict[str, str]:
    return {"status": "refreshed"}


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"status": "logged_out"}
