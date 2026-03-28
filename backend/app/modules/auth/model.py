from app.core.database.base import Base
from sqlalchemy import ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), index=True)
    key_hash: Mapped[str] = mapped_column(String(255), unique=True)
    permissions_json: Mapped[dict] = mapped_column(JSON)
