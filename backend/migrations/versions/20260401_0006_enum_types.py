"""Update vehicletype and loadtype enums.

Revision ID: 20260401_0006_enum_types
Revises: 20260401_0005
Create Date: 2026-04-01
"""

from alembic import op

revision = "20260401_0006"
down_revision = "20260401_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE vehicletype ADD VALUE IF NOT EXISTS 'boxcar'")
    op.execute("ALTER TYPE vehicletype ADD VALUE IF NOT EXISTS 'flatcar'")
    op.execute("ALTER TYPE vehicletype ADD VALUE IF NOT EXISTS 'gondola'")
    op.execute("ALTER TYPE vehicletype ADD VALUE IF NOT EXISTS 'reefer'")
    op.execute("ALTER TYPE loadtype ADD VALUE IF NOT EXISTS 'paper_roll'")
    op.execute("ALTER TYPE loadtype ADD VALUE IF NOT EXISTS 'pallet'")
    op.execute("ALTER TYPE loadtype ADD VALUE IF NOT EXISTS 'coil'")


def downgrade() -> None:
    # PostgreSQL doesn't support removing enum values; no-op
    pass
