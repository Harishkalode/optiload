from datetime import datetime, timezone

from app.modules.auth.model import RefreshToken
from app.modules.users.repository import UserRepository
from sqlalchemy import select, update


class AuthRepository(UserRepository):
    def create_refresh_token_row(self, *, user_id: int, jti: str, expires_at: datetime) -> RefreshToken:
        row = RefreshToken(user_id=user_id, jti=jti, expires_at=expires_at)
        self.db.add(row)
        self.db.flush()
        return row

    def get_refresh_token_by_jti(self, jti: str) -> RefreshToken | None:
        return self.db.scalar(select(RefreshToken).where(RefreshToken.jti == jti))

    def revoke_refresh_token(self, jti: str) -> None:
        now = datetime.now(timezone.utc)
        self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.jti == jti, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )

    def revoke_all_refresh_tokens_for_user(self, user_id: int) -> None:
        now = datetime.now(timezone.utc)
        self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
