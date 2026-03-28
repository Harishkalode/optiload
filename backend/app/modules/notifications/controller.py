from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database.session import get_db
from app.core.middlewares.auth import get_current_user
from app.core.utils.errors import AppError
from app.core.utils.responses import success_response
from app.modules.notifications.repository import NotificationRepository

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    unread_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = NotificationRepository(db)
    items = repo.list_for_user(current_user.id, unread_only=unread_only)
    return success_response(
        [
            {
                "id": n.id,
                "title": n.title,
                "body": n.body,
                "category": n.category,
                "link": n.link,
                "read_at": n.read_at,
                "created_at": n.created_at,
            }
            for n in items
        ],
    )


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    repo = NotificationRepository(db)
    if not repo.get_for_user(notification_id, current_user.id):
        raise AppError("NOT_FOUND", "Notification not found", status_code=404)
    repo.mark_read(notification_id, current_user.id)
    return success_response({"id": notification_id, "updated": True})
