"""Add realistic vehicle dimensions and AAR-compliant fields (Phase 0.2).

Changes:
- Add empty_cg_height_m: meters above rail (AAR 3.5.1 reference)
- Add axle_count: number of axles (typically 8)
- Add per_axle_limit_kg: weight limit per axle (typically 22,500kg)
- Add doorway_width_m, doorway_height_m: for boxcars
- Add platform_height_m: rail to deck height
- Update with realistic AAR standard dimensions for boxcar, flatcar, gondola
"""

from alembic import op
import sqlalchemy as sa

revision = '20260424_0010'
down_revision = '20260424_0009'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('vehicles', schema=None) as batch_op:
        # Add new AAR-compliance fields
        batch_op.add_column(sa.Column('empty_cg_height_m', sa.Float, nullable=True))
        batch_op.add_column(sa.Column('axle_count', sa.Integer, nullable=True))
        batch_op.add_column(sa.Column('per_axle_limit_kg', sa.Float, nullable=True))
        batch_op.add_column(sa.Column('doorway_width_m', sa.Float, nullable=True))
        batch_op.add_column(sa.Column('doorway_height_m', sa.Float, nullable=True))
        batch_op.add_column(sa.Column('platform_height_m', sa.Float, nullable=True))


def downgrade():
    with op.batch_alter_table('vehicles', schema=None) as batch_op:
        batch_op.drop_column('empty_cg_height_m')
        batch_op.drop_column('axle_count')
        batch_op.drop_column('per_axle_limit_kg')
        batch_op.drop_column('doorway_width_m')
        batch_op.drop_column('doorway_height_m')
        batch_op.drop_column('platform_height_m')
