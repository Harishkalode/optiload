"""merge heads

Revision ID: 15f39a619ad4
Revises: 20260401_0006, 20260403_0007_org_extended_fields, 20260403_0008_user_preferences
Create Date: 2026-04-11 12:37:55.947518
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '15f39a619ad4'
down_revision = ('20260401_0006', '20260403_0007_org_extended_fields', '20260403_0008_user_preferences')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
