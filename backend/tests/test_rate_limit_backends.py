import asyncio
from unittest.mock import patch

import pytest

from app.core.rate_limit.backends import (
    MemoryRateLimiter,
    RedisRateLimiter,
    create_rate_limit_checker,
)


@pytest.mark.asyncio
async def test_memory_rate_limit_allows_then_blocks() -> None:
    lim = MemoryRateLimiter()
    with patch("app.core.rate_limit.backends.settings") as s:
        s.auth_login_rate_limit_per_minute = 10
        s.rate_limit_per_minute = 3
        assert (await lim.check(ip="10.0.0.1", is_login=False)).allowed
        assert (await lim.check(ip="10.0.0.1", is_login=False)).allowed
        assert (await lim.check(ip="10.0.0.1", is_login=False)).allowed
        assert not (await lim.check(ip="10.0.0.1", is_login=False)).allowed


@pytest.mark.asyncio
async def test_memory_login_bucket_separate_from_general() -> None:
    lim = MemoryRateLimiter()
    with patch("app.core.rate_limit.backends.settings") as s:
        s.auth_login_rate_limit_per_minute = 2
        s.rate_limit_per_minute = 100
        assert (await lim.check(ip="10.0.0.2", is_login=True)).allowed
        assert (await lim.check(ip="10.0.0.2", is_login=True)).allowed
        assert not (await lim.check(ip="10.0.0.2", is_login=True)).allowed
        assert (await lim.check(ip="10.0.0.2", is_login=False)).allowed


@pytest.mark.asyncio
async def test_redis_rate_limit_sliding_window() -> None:
    fakeredis = pytest.importorskip("fakeredis", reason="fakeredis not installed")
    fake = fakeredis.aioredis.FakeRedis(decode_responses=True)
    with patch("app.core.rate_limit.backends.settings") as s:
        s.rate_limit_per_minute = 4
        s.auth_login_rate_limit_per_minute = 4
        lim = RedisRateLimiter(fake, key_prefix="test:rl")
        for _ in range(4):
            assert (await lim.check(ip="192.168.1.1", is_login=False)).allowed
        assert not (await lim.check(ip="192.168.1.1", is_login=False)).allowed


def test_create_checker_returns_memory_when_backend_memory() -> None:
    with patch("app.core.rate_limit.backends.settings") as s:
        s.rate_limit_backend = "memory"
        s.redis_url = "redis://localhost:6379/0"
        checker = create_rate_limit_checker()
        assert type(checker).__name__ == "MemoryRateLimiter"


def test_create_checker_lazy_when_backend_redis() -> None:
    with patch("app.core.rate_limit.backends.settings") as s:
        s.rate_limit_backend = "redis"
        s.redis_url = "redis://localhost:6379/0"
        checker = create_rate_limit_checker()
        assert type(checker).__name__ == "_LazyRedisChecker"
