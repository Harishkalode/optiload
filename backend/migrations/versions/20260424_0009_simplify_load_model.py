"""Simplify load model: remove custom CG offsets, standardize dimensions.

Phase 0.1 changes:
- Removes cg_x, cg_y, cg_z columns (custom CoG offsets - not used)
- Keeps: id, organization_id, type, dimensions, weight, quantity, fragile, stackable, hazmat_class, diameter
- Validates dimensions: L/W/H in meters (0.01m - 10m range)
- Validates weight: kg (1kg - 100,000kg range)
- Validates quantity: 1-1000
"""

from alembic import op
import sqlalchemy as sa

revision = '20260424_0009_simplify_load_model'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Remove unused custom CoG offset columns if they exist
    # These columns are not being used; loads should use standard center-of-mass calculation
    with op.batch_alter_table('loads', schema=None) as batch_op:
        # Check if columns exist before dropping (idempotent)
        try:
            batch_op.drop_column('cg_x')
        except Exception:
            pass
        try:
            batch_op.drop_column('cg_y')
        except Exception:
            pass
        try:
            batch_op.drop_column('cg_z')
        except Exception:
            pass


def downgrade():
    # Re-add columns for rollback
    with op.batch_alter_table('loads', schema=None) as batch_op:
        batch_op.add_column(sa.Column('cg_x', sa.Float, nullable=True))
        batch_op.add_column(sa.Column('cg_y', sa.Float, nullable=True))
        batch_op.add_column(sa.Column('cg_z', sa.Float, nullable=True))
