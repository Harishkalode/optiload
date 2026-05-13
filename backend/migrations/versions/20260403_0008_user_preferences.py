"""User preferences table for theme and UI settings."""

from alembic import op
import sqlalchemy as sa

revision = '20260403_0008_user_preferences'
down_revision = '20260401_0005'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user_preferences',
        sa.Column('user_id', sa.Integer, primary_key=True),
        sa.Column('color_mode', sa.String(16), nullable=False, server_default='auto'),
        sa.Column('palette', sa.String(32), nullable=False, server_default='industrial-blue'),
        sa.Column('sidebar_collapsed', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('selection_highlight', sa.String(16), nullable=False, server_default='#3B82F6'),
        sa.Column('table_row_highlight', sa.String(16), nullable=False, server_default='#3B82F620'),
        sa.Column('compact_mode', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade():
    op.drop_table('user_preferences')
