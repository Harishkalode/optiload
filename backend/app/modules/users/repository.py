from app.modules.users.model import User
from sqlalchemy import func, select
from sqlalchemy.orm import Session


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

    def list_by_org_paginated(
        self,
        organization_id: int | None,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        role_id: int | None = None,
        status: str | None = None,
    ) -> tuple[list[User], int]:
        query = select(User)
        count_query = select(User)
        if organization_id is not None:
            query = query.where(User.organization_id == organization_id)
            count_query = count_query.where(User.organization_id == organization_id)
        if search:
            term = f"%{search.lower()}%"
            query = query.where(
                (User.name.ilike(term)) | (User.email.ilike(term))
            )
            count_query = count_query.where(
                (User.name.ilike(term)) | (User.email.ilike(term))
            )
        if role_id is not None:
            query = query.where(User.role_id == role_id)
            count_query = count_query.where(User.role_id == role_id)
        if status is not None:
            query = query.where(User.status == status)
            count_query = count_query.where(User.status == status)
        total = self.db.scalar(select(func.count()).select_from(count_query.subquery())) or 0
        items = list(
            self.db.scalars(
                query.order_by(User.id.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            ).all()
        )
        return items, total

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
