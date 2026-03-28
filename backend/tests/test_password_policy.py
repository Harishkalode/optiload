import pytest

from app.core.security.password_policy import validate_password_strength
from app.core.utils.errors import AppError


def test_password_policy_accepts_strong_password() -> None:
    validate_password_strength("ValidPass1!ab")


@pytest.mark.parametrize(
    "password",
    ["short1A!", "nouppercase1!abcd", "NOLOWERCASE1!AB", "NoDigits!xxxxx", "NoSpecial123456"],
)
def test_password_policy_rejects_weak(password: str) -> None:
    with pytest.raises(AppError) as exc:
        validate_password_strength(password)
    assert exc.value.status_code == 400
