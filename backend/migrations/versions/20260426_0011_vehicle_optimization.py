"""Add vehicle optimization configuration fields (Phase 2.0).

Changes:
- Add optimization_mode: space_optimized, cost_optimized, stability_optimized
- Add space_weight: weight for space utilization in placement scoring (0-1)
- Add stability_weight: weight for CoG centering (0-1)
- Add cost_weight: weight for cost reduction (0-1)
- Defaults: stability_optimized with space=0.5, stability=0.4, cost=0.1
"""

from alembic import op
import sqlalchemy as sa

revision = '20260426_0011_vehicle_optimization'
down_revision = 'cb86a53114e0'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('vehicles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('optimization_mode', sa.String(32), nullable=False, server_default='stability_optimized'))
        batch_op.add_column(sa.Column('space_weight', sa.Float, nullable=False, server_default='0.5'))
        batch_op.add_column(sa.Column('stability_weight', sa.Float, nullable=False, server_default='0.4'))
        batch_op.add_column(sa.Column('cost_weight', sa.Float, nullable=False, server_default='0.1'))


def downgrade():
    with op.batch_alter_table('vehicles', schema=None) as batch_op:
        batch_op.drop_column('optimization_mode')
        batch_op.drop_column('space_weight')
        batch_op.drop_column('stability_weight')
        batch_op.drop_column('cost_weight')
