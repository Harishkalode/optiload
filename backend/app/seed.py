from sqlalchemy.orm import Session

from app.config import settings
from app.models import Organization, Permission, Role, User, Warehouse
from app.security import hash_password


DEFAULT_PERMISSIONS = [
    ("users:view", "View users"),
    ("users:create", "Create users"),
    ("vehicles:manage", "Manage vehicles"),
    ("loads:manage", "Manage loads"),
    ("optimizations:run", "Run optimization jobs"),
    ("reports:view", "View reports and analytics"),
    ("api_keys:manage", "Manage API keys"),
]

DEFAULT_ROLES = {
    "superuser": [
        "users:view",
        "users:create",
        "vehicles:manage",
        "loads:manage",
        "optimizations:run",
        "reports:view",
        "api_keys:manage",
    ],
    "admin": ["users:view", "users:create", "vehicles:manage", "loads:manage", "optimizations:run", "reports:view"],
    "sub-admin": ["users:view", "loads:manage", "optimizations:run", "reports:view"],
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

    demo_org = db.query(Organization).filter(Organization.name == "Demo Rail Ops").first()
    if demo_org is None:
        demo_org = Organization(name="Demo Rail Ops", invite_code="DEMO-RAIL-001", region="US")
        db.add(demo_org)
        db.flush()

    admin_user = db.query(User).filter(User.email == "admin@demo.optiload.local").first()
    if admin_user is None:
        admin_user = User(
            email="admin@demo.optiload.local",
            full_name="Demo Admin",
            hashed_password=hash_password("ChangeMe123!"),
            organization_id=demo_org.id,
            is_active=True,
        )
        admin_user.roles = [roles_by_name["admin"]]
        db.add(admin_user)

    wh = db.query(Warehouse).filter(Warehouse.organization_id == demo_org.id, Warehouse.code == "DFW-HUB").first()
    if wh is None:
        db.add(
            Warehouse(
                organization_id=demo_org.id,
                name="Dallas Freight Hub",
                code="DFW-HUB",
                location="Dallas, TX",
                is_active=True,
            )
        )

    db.commit()
