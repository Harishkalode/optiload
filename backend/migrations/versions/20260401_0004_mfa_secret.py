"""Add MFA secret column to users table.

Revision ID: 20260401_0004_mfa_secret
Revises: 20260328_0003_notifications
Create Date: 2026-04-01
"""

from alembic import op
import sqlalchemy as sa

revision = "20260401_0004"
down_revision = "20260328_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("mfa_secret", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "mfa_secret")
