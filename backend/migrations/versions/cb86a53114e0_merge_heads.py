"""merge heads

Revision ID: cb86a53114e0
Revises: 15f39a619ad4, ce7278a1e32d
Create Date: 2026-04-25 23:18:20.484942
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cb86a53114e0'
down_revision = ('15f39a619ad4', 'ce7278a1e32d')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
