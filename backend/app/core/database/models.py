"""Model registry for Alembic autogenerate.

Importing this module registers all SQLAlchemy models on Base.metadata.
"""

from app.modules.permissions.model import Permission
from app.modules.vehicles.model import Vehicle

__all__ = [
    'Organization',
    'Role',
    'Permission',
    'User',
    'Vehicle',
    'Load',
    'LoadSession',
    'LoadSessionItem',
    'Optimization',
    'AuditLog',
    'SystemMetric',
    'ApiKey',
    'RefreshToken',
    'UserPermissionOverride',
    'role_permissions',
]
