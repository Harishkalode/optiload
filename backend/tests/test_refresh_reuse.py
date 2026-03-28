from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest

from app.core.utils.errors import AppError
from app.modules.auth.service import AuthService


def test_refresh_token_reuse_revokes_all_sessions_for_user() -> None:
    repo = MagicMock()
    audit = MagicMock()
    row = MagicMock()
    row.user_id = 42
    row.revoked_at = datetime.now(timezone.utc)
    row.expires_at = datetime.now(timezone.utc) + timedelta(days=1)
    repo.get_refresh_token_by_jti.return_value = row
    victim = MagicMock()
    victim.organization_id = 7
    repo.get_by_id.return_value = victim

    svc = AuthService(repo, audit)
    with patch("app.modules.auth.service.decode_refresh_token", return_value={"jti": "reused-jti", "sub": "42"}):
        with pytest.raises(AppError) as exc:
            svc.refresh("fake.jwt.value")

    assert exc.value.status_code == 401
    repo.revoke_all_refresh_tokens_for_user.assert_called_once_with(42)
    repo.db.commit.assert_called()
    audit.record.assert_called()
    call_kw = audit.record.call_args.kwargs
    assert call_kw["action"] == "auth.refresh_token_reuse_detected"
    assert call_kw["user_id"] == 42
