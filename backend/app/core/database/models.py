"""Model registry for Alembic autogenerate.

Importing this module registers all SQLAlchemy models on Base.metadata.
Every model that has a corresponding migration must be imported here.
"""

from app.modules.auth.model import ApiKey, RefreshToken
from app.modules.audit_logs.model import AuditLog
from app.modules.loads.model import Load
from app.modules.notifications.model import Notification
from app.modules.optimization.model import Optimization
from app.modules.organizations.model import Organization
from app.modules.permissions.model import Permission
from app.modules.roles.model import Role, UserPermissionOverride, role_permissions
from app.modules.system_monitoring.model import SystemMetric
from app.modules.users.model import User
from app.modules.vehicles.model import Vehicle

__all__ = [
    "ApiKey",
    "AuditLog",
    "Load",
    "Notification",
    "Optimization",
    "Organization",
    "Permission",
    "RefreshToken",
    "Role",
    "role_permissions",
    "SystemMetric",
    "User",
    "UserPermissionOverride",
    "Vehicle",
]
