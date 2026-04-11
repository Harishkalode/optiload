from enum import Enum

from app.core.database.base import Base
from sqlalchemy import Boolean, Enum as SAEnum, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column


class LoadType(str, Enum):
    cube = "cube"
    cylinder = "cylinder"
    paper_roll = "paper_roll"
    pallet = "pallet"
    coil = "coil"


class Load(Base):
    __tablename__ = "loads"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), index=True)
    type: Mapped[LoadType] = mapped_column(SAEnum(LoadType), index=True)
    dimensions: Mapped[dict] = mapped_column(JSON)
    weight: Mapped[float] = mapped_column(Float)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    cg_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    cg_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    cg_z: Mapped[float | None] = mapped_column(Float, nullable=True)
    fragile: Mapped[bool] = mapped_column(Boolean, default=False)
    stackable: Mapped[bool] = mapped_column(Boolean, default=True)
    hazmat_class: Mapped[str | None] = mapped_column(String(16), nullable=True)
    diameter: Mapped[float | None] = mapped_column(Float, nullable=True)
