"""initial schema

Revision ID: 20260327_0001
Revises: None
Create Date: 2026-03-27 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM as PgEnum


revision = '20260327_0001'
down_revision = None
branch_labels = None
depends_on = None


organization_status = PgEnum('active', 'suspended', 'deleted', name='organizationstatus', create_type=False)
organization_plan_type = PgEnum('starter', 'growth', 'enterprise', name='organizationplantype', create_type=False)
role_scope = PgEnum('global', 'org', name='rolescope', create_type=False)
user_status = PgEnum('active', 'invited', 'disabled', name='userstatus', create_type=False)
vehicle_type = PgEnum('railcar', 'container', name='vehicletype', create_type=False)
load_type = PgEnum('cylinder', 'cube', name='loadtype', create_type=False)
load_session_status = PgEnum('draft', 'optimized', 'failed', name='loadsessionstatus', create_type=False)
optimization_status = PgEnum('pending', 'running', 'completed', 'failed', name='optimizationstatus', create_type=False)
metric_type = PgEnum('cpu_usage', 'memory_usage', 'request_count', 'error_count', 'job_latency', name='metrictype', create_type=False)


def upgrade() -> None:
    # Create ENUM types idempotently (PG doesn't support CREATE TYPE IF NOT EXISTS, use DO block)
    op.execute("DO $$ BEGIN CREATE TYPE organizationstatus AS ENUM ('active', 'suspended', 'deleted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE organizationplantype AS ENUM ('starter', 'growth', 'enterprise'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE rolescope AS ENUM ('global', 'org'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE userstatus AS ENUM ('active', 'invited', 'disabled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE vehicletype AS ENUM ('railcar', 'container'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE loadtype AS ENUM ('cylinder', 'cube'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE loadsessionstatus AS ENUM ('draft', 'optimized', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE optimizationstatus AS ENUM ('pending', 'running', 'completed', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE metrictype AS ENUM ('cpu_usage', 'memory_usage', 'request_count', 'error_count', 'job_latency'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;")

    op.create_table(
        'organizations',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('status', organization_status, nullable=False),
        sa.Column('plan_type', organization_plan_type, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_organizations_name', 'organizations', ['name'], unique=True)
    op.create_index('ix_organizations_status', 'organizations', ['status'], unique=False)
    op.create_index('ix_organizations_plan_type', 'organizations', ['plan_type'], unique=False)
    op.create_index('ix_organizations_created_at', 'organizations', ['created_at'], unique=False)

    op.create_table(
        'permissions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('category', sa.String(length=128), nullable=False),
    )
    op.create_index('ix_permissions_name', 'permissions', ['name'], unique=True)
    op.create_index('ix_permissions_category', 'permissions', ['category'], unique=False)

    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.Column('scope', role_scope, nullable=False),
        sa.Column('description', sa.String(length=512), nullable=True),
        sa.UniqueConstraint('name', 'scope', name='uq_role_name_scope'),
    )
    op.create_index('ix_roles_name', 'roles', ['name'], unique=False)

    op.create_table(
        'role_permissions',
        sa.Column('role_id', sa.Integer(), sa.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('permission_id', sa.Integer(), sa.ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True),
    )

    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=320), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role_id', sa.Integer(), sa.ForeignKey('roles.id'), nullable=False),
        sa.Column('status', user_status, nullable=False),
        sa.Column('mfa_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_organization_id', 'users', ['organization_id'], unique=False)
    op.create_index('ix_users_name', 'users', ['name'], unique=False)
    op.create_index('ix_users_status', 'users', ['status'], unique=False)
    op.create_index('ix_users_created_at', 'users', ['created_at'], unique=False)

    op.create_table(
        'user_permission_overrides',
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('permission_id', sa.Integer(), sa.ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('allowed', sa.Boolean(), nullable=False),
    )

    op.create_table(
        'vehicles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', vehicle_type, nullable=False),
        sa.Column('dimensions', sa.JSON(), nullable=False),
        sa.Column('capacity', sa.Float(), nullable=False),
    )
    op.create_index('ix_vehicles_organization_id', 'vehicles', ['organization_id'], unique=False)
    op.create_index('ix_vehicles_type', 'vehicles', ['type'], unique=False)

    op.create_table(
        'loads',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', load_type, nullable=False),
        sa.Column('dimensions', sa.JSON(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
    )
    op.create_index('ix_loads_organization_id', 'loads', ['organization_id'], unique=False)
    op.create_index('ix_loads_type', 'loads', ['type'], unique=False)

    op.create_table(
        'load_sessions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('vehicle_id', sa.Integer(), sa.ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', load_session_status, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_load_sessions_user_id', 'load_sessions', ['user_id'], unique=False)
    op.create_index('ix_load_sessions_vehicle_id', 'load_sessions', ['vehicle_id'], unique=False)
    op.create_index('ix_load_sessions_status', 'load_sessions', ['status'], unique=False)

    op.create_table(
        'load_session_items',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('session_id', sa.Integer(), sa.ForeignKey('load_sessions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('load_id', sa.Integer(), sa.ForeignKey('loads.id', ondelete='CASCADE'), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
    )
    op.create_index('ix_load_session_items_session_id', 'load_session_items', ['session_id'], unique=False)
    op.create_index('ix_load_session_items_load_id', 'load_session_items', ['load_id'], unique=False)

    op.create_table(
        'optimizations',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('vehicle_id', sa.Integer(), sa.ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('input_json', sa.JSON(), nullable=False),
        sa.Column('result_json', sa.JSON(), nullable=True),
        sa.Column('status', optimization_status, nullable=False),
        sa.Column('efficiency_score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_optimizations_organization_id', 'optimizations', ['organization_id'], unique=False)
    op.create_index('ix_optimizations_status', 'optimizations', ['status'], unique=False)
    op.create_index('ix_optimizations_created_at', 'optimizations', ['created_at'], unique=False)

    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=128), nullable=False),
        sa.Column('resource', sa.String(length=128), nullable=False),
        sa.Column('resource_id', sa.String(length=128), nullable=False),
        sa.Column('metadata_json', sa.JSON(), nullable=False),
        sa.Column('ip_address', sa.String(length=64), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'], unique=False)
    op.create_index('ix_audit_logs_organization_id', 'audit_logs', ['organization_id'], unique=False)
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'], unique=False)
    op.create_index('ix_audit_logs_resource', 'audit_logs', ['resource'], unique=False)
    op.create_index('ix_audit_logs_resource_id', 'audit_logs', ['resource_id'], unique=False)
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'], unique=False)

    op.create_table(
        'system_metrics',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('metric_type', metric_type, nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_system_metrics_metric_type', 'system_metrics', ['metric_type'], unique=False)
    op.create_index('ix_system_metrics_timestamp', 'system_metrics', ['timestamp'], unique=False)

    op.create_table(
        'api_keys',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('key_hash', sa.String(length=255), nullable=False),
        sa.Column('permissions_json', sa.JSON(), nullable=False),
    )
    op.create_index('ix_api_keys_organization_id', 'api_keys', ['organization_id'], unique=False)
    op.create_index('ix_api_keys_key_hash', 'api_keys', ['key_hash'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_api_keys_key_hash', table_name='api_keys')
    op.drop_index('ix_api_keys_organization_id', table_name='api_keys')
    op.drop_table('api_keys')

    op.drop_index('ix_system_metrics_timestamp', table_name='system_metrics')
    op.drop_index('ix_system_metrics_metric_type', table_name='system_metrics')
    op.drop_table('system_metrics')

    op.drop_index('ix_audit_logs_timestamp', table_name='audit_logs')
    op.drop_index('ix_audit_logs_resource_id', table_name='audit_logs')
    op.drop_index('ix_audit_logs_resource', table_name='audit_logs')
    op.drop_index('ix_audit_logs_action', table_name='audit_logs')
    op.drop_index('ix_audit_logs_organization_id', table_name='audit_logs')
    op.drop_index('ix_audit_logs_user_id', table_name='audit_logs')
    op.drop_table('audit_logs')

    op.drop_index('ix_optimizations_created_at', table_name='optimizations')
    op.drop_index('ix_optimizations_status', table_name='optimizations')
    op.drop_index('ix_optimizations_organization_id', table_name='optimizations')
    op.drop_table('optimizations')

    op.drop_index('ix_load_session_items_load_id', table_name='load_session_items')
    op.drop_index('ix_load_session_items_session_id', table_name='load_session_items')
    op.drop_table('load_session_items')

    op.drop_index('ix_load_sessions_status', table_name='load_sessions')
    op.drop_index('ix_load_sessions_vehicle_id', table_name='load_sessions')
    op.drop_index('ix_load_sessions_user_id', table_name='load_sessions')
    op.drop_table('load_sessions')

    op.drop_index('ix_loads_type', table_name='loads')
    op.drop_index('ix_loads_organization_id', table_name='loads')
    op.drop_table('loads')

    op.drop_index('ix_vehicles_type', table_name='vehicles')
    op.drop_index('ix_vehicles_organization_id', table_name='vehicles')
    op.drop_table('vehicles')

    op.drop_table('user_permission_overrides')
    op.drop_index('ix_users_created_at', table_name='users')
    op.drop_index('ix_users_status', table_name='users')
    op.drop_index('ix_users_name', table_name='users')
    op.drop_index('ix_users_organization_id', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')

    op.drop_table('role_permissions')
    op.drop_index('ix_roles_name', table_name='roles')
    op.drop_table('roles')

    op.drop_index('ix_permissions_category', table_name='permissions')
    op.drop_index('ix_permissions_name', table_name='permissions')
    op.drop_table('permissions')

    op.drop_index('ix_organizations_created_at', table_name='organizations')
    op.drop_index('ix_organizations_plan_type', table_name='organizations')
    op.drop_index('ix_organizations_status', table_name='organizations')
    op.drop_index('ix_organizations_name', table_name='organizations')
    op.drop_table('organizations')

    op.execute("DROP TYPE IF EXISTS metrictype")
    op.execute("DROP TYPE IF EXISTS optimizationstatus")
    op.execute("DROP TYPE IF EXISTS loadsessionstatus")
    op.execute("DROP TYPE IF EXISTS loadtype")
    op.execute("DROP TYPE IF EXISTS vehicletype")
    op.execute("DROP TYPE IF EXISTS userstatus")
    op.execute("DROP TYPE IF EXISTS rolescope")
    op.execute("DROP TYPE IF EXISTS organizationplantype")
    op.execute("DROP TYPE IF EXISTS organizationstatus")
