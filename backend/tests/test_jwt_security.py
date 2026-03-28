import pytest

from app.core.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    new_refresh_jti,
)


def test_access_token_rejects_refresh_type() -> None:
    jti = new_refresh_jti()
    refresh = create_refresh_token("42", jti)
    with pytest.raises(ValueError):
        decode_access_token(refresh)


def test_refresh_token_rejects_access_type() -> None:
    access = create_access_token("42", role="admin", organization_id=1)
    with pytest.raises(ValueError):
        decode_refresh_token(access)


def test_access_roundtrip_claims() -> None:
    token = create_access_token("7", role="viewer", organization_id=3)
    payload = decode_access_token(token)
    assert payload["sub"] == "7"
    assert payload["token_use"] == "access"
    assert payload.get("role") == "viewer"
    assert payload.get("organization_id") == 3
