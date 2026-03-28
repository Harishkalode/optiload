"""Model registry for Alembic autogenerate.

Importing this module registers all SQLAlchemy models on Base.metadata.
"""

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
    'UserPermissionOverride',
    'role_permissions',
]
