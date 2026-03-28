from app.core.database.base import Base
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(128), index=True)
