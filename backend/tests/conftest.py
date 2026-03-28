import pytest


@pytest.fixture(autouse=True)
def _reset_redis_rate_limit_singleton():
    import app.core.rate_limit.backends as rl

    rl._redis_client = None
    yield
    rl._redis_client = None
