"""db models

Revision ID: 439e273a7c2f
Revises: 20260327_0001
Create Date: 2026-03-28 09:45:01.440503
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '439e273a7c2f'
down_revision = '20260327_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # This migration was auto-generated and duplicates the initial schema.
    # All tables are already created by 20260327_0001_initial_schema.
    pass


def downgrade() -> None:
    # All tables are managed by the initial schema migration.
    pass
    # ### end Alembic commands ###
