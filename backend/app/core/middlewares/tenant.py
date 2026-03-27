from app.modules.users.model import User


def get_tenant_organization_id(user: User) -> int | None:
    if user.is_super_admin:
        return None
    return user.organization_id
