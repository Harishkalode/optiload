from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.users.model import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email))

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def list_by_org(self, organization_id: int | None) -> list[User]:
        query = select(User)
        if organization_id is not None:
            query = query.where(User.organization_id == organization_id)
        return list(self.db.scalars(query.order_by(User.id.desc())).all())

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def save(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()
