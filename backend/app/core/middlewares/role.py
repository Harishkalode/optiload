from app.core.utils.errors import AppError
from app.modules.users.model import User


def require_roles(user: User, allowed: set[str]) -> None:
    role_name = user.role.name if user.role else ""
    if role_name not in allowed:
        raise AppError("FORBIDDEN", "Insufficient role permissions", status_code=403)
