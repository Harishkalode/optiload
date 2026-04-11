from datetime import datetime

from app.modules.notifications.model import Notification
from sqlalchemy import select, update
from sqlalchemy.orm import Session


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(
            self,
            user_id: int,
            *,
            unread_only: bool = False,
            limit: int = 100,
    ) -> list[Notification]:
        q = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            q = q.where(Notification.read_at.is_(None))
        q = q.order_by(Notification.created_at.desc()).limit(limit)
        return list(self.db.scalars(q).all())

    def get_for_user(self, notification_id: int, user_id: int) -> Notification | None:
        return self.db.scalar(
            select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id),
        )

    def create(self, row: Notification) -> Notification:
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def mark_read(self, notification_id: int, user_id: int) -> bool:
        res = self.db.execute(
            update(Notification)
            .where(Notification.id == notification_id, Notification.user_id == user_id)
            .values(read_at=datetime.utcnow()),
        )
        self.db.commit()
        return (res.rowcount or 0) > 0

    def mark_all_read(self, user_id: int) -> int:
        res = self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.read_at.is_(None))
            .values(read_at=datetime.utcnow()),
        )
        self.db.commit()
        return res.rowcount or 0
