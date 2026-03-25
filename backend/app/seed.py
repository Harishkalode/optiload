from sqlalchemy.orm import Session

from app.config import settings
from app.models import Permission, Role, User
from app.security import hash_password


DEFAULT_PERMISSIONS = [
    ("users:view", "View users"),
    ("users:create", "Create users"),
    ("users:update", "Update users"),
    ("users:delete", "Delete users"),
]

DEFAULT_ROLES = {
    "superuser": ["users:view", "users:create", "users:update", "users:delete"],
    "admin": ["users:view", "users:create", "users:update"],
    "sub-admin": ["users:view"],
}


def seed_defaults(db: Session) -> None:
    permissions_by_code: dict[str, Permission] = {}
    for code, description in DEFAULT_PERMISSIONS:
        permission = db.query(Permission).filter(Permission.code == code).first()
        if permission is None:
            permission = Permission(code=code, description=description)
            db.add(permission)
            db.flush()
        permissions_by_code[code] = permission

    roles_by_name: dict[str, Role] = {}
    for role_name, codes in DEFAULT_ROLES.items():
        role = db.query(Role).filter(Role.name == role_name).first()
        if role is None:
            role = Role(name=role_name, description=f"{role_name} role")
            db.add(role)
            db.flush()
        role.permissions = [permissions_by_code[code] for code in codes]
        roles_by_name[role_name] = role

    superuser = db.query(User).filter(User.email == settings.seed_superuser_email).first()
    if superuser is None:
        superuser = User(
            email=settings.seed_superuser_email,
            full_name="Optiload Owner",
            hashed_password=hash_password(settings.seed_superuser_password),
            is_active=True,
        )
        superuser.roles = [roles_by_name["superuser"]]
        db.add(superuser)

    db.commit()
