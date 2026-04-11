"""Add extended fields to organizations table."""

from alembic import op
import sqlalchemy as sa

revision = '20260403_0007_org_extended_fields'
down_revision = None  # Will be set by migration chain
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('organizations', sa.Column('timezone', sa.String(64), nullable=True, server_default='America/Chicago'))
    op.add_column('organizations', sa.Column('contact_email', sa.String(255), nullable=True))
    op.add_column('organizations', sa.Column('contact_phone', sa.String(32), nullable=True))
    op.add_column('organizations', sa.Column('address', sa.Text, nullable=True))
    op.add_column('organizations', sa.Column('city', sa.String(128), nullable=True))
    op.add_column('organizations', sa.Column('state', sa.String(64), nullable=True))
    op.add_column('organizations', sa.Column('country', sa.String(64), nullable=True, server_default='US'))
    op.add_column('organizations', sa.Column('postal_code', sa.String(16), nullable=True))
    op.add_column('organizations', sa.Column('max_users', sa.Integer, nullable=False, server_default='10'))


def downgrade():
    op.drop_column('organizations', 'max_users')
    op.drop_column('organizations', 'postal_code')
    op.drop_column('organizations', 'country')
    op.drop_column('organizations', 'state')
    op.drop_column('organizations', 'city')
    op.drop_column('organizations', 'address')
    op.drop_column('organizations', 'contact_phone')
    op.drop_column('organizations', 'contact_email')
    op.drop_column('organizations', 'timezone')
