"""Add demo_mode column to users table.

Revision ID: 20260518_0012
Revises: 20260426_0011
Create Date: 2026-05-18
"""
from alembic import op
import sqlalchemy as sa

revision = '20260518_0012'
down_revision = '20260426_0011'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('demo_mode', sa.Boolean, nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('users', 'demo_mode')
