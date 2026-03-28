from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.load_builder.model import LoadSession, LoadSessionItem


class LoadBuilderRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_session(self, session: LoadSession) -> LoadSession:
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_session(self, session_id: int) -> LoadSession | None:
        return self.db.get(LoadSession, session_id)

    def list_items(self, session_id: int) -> list[LoadSessionItem]:
        return list(self.db.scalars(select(LoadSessionItem).where(LoadSessionItem.session_id == session_id)).all())

    def add_item(self, item: LoadSessionItem) -> LoadSessionItem:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get_item(self, item_id: int) -> LoadSessionItem | None:
        return self.db.get(LoadSessionItem, item_id)

    def delete_item(self, item: LoadSessionItem) -> None:
        self.db.delete(item)
        self.db.commit()
