"""Add vehicle/load fields for optimization engine.

Revision ID: 20260401_0005_vehicle_load_fields
Revises: 20260401_0004
Create Date: 2026-04-01
"""

from alembic import op
import sqlalchemy as sa

revision = "20260401_0005"
down_revision = "20260401_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("vehicles", sa.Column("tare_weight_kg", sa.Float(), nullable=True))
    op.add_column("vehicles", sa.Column("plate_type", sa.String(1), nullable=True))
    op.add_column("vehicles", sa.Column("truck_center_front", sa.Float(), nullable=True))
    op.add_column("vehicles", sa.Column("truck_center_rear", sa.Float(), nullable=True))
    op.add_column("vehicles", sa.Column("empty_cg_height_in", sa.Float(), nullable=True))
    op.add_column("vehicles", sa.Column("axle_positions", sa.JSON(), nullable=True))

    op.add_column("loads", sa.Column("cg_x", sa.Float(), nullable=True))
    op.add_column("loads", sa.Column("cg_y", sa.Float(), nullable=True))
    op.add_column("loads", sa.Column("cg_z", sa.Float(), nullable=True))
    op.add_column("loads", sa.Column("fragile", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("loads", sa.Column("stackable", sa.Boolean(), nullable=True, server_default="true"))
    op.add_column("loads", sa.Column("hazmat_class", sa.String(16), nullable=True))
    op.add_column("loads", sa.Column("diameter", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("loads", "diameter")
    op.drop_column("loads", "hazmat_class")
    op.drop_column("loads", "stackable")
    op.drop_column("loads", "fragile")
    op.drop_column("loads", "cg_z")
    op.drop_column("loads", "cg_y")
    op.drop_column("loads", "cg_x")
    op.drop_column("vehicles", "axle_positions")
    op.drop_column("vehicles", "empty_cg_height_in")
    op.drop_column("vehicles", "truck_center_rear")
    op.drop_column("vehicles", "truck_center_front")
    op.drop_column("vehicles", "plate_type")
    op.drop_column("vehicles", "tare_weight_kg")
