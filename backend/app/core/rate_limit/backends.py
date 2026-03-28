import asyncio
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from secrets import token_hex
from typing import TYPE_CHECKING, Protocol

from app.core.config import settings

if TYPE_CHECKING:
    from redis.asyncio import Redis

logger = logging.getLogger("optiload.rate_limit")

WINDOW_SECONDS = 60

# Atomic: record hit, prune window, return current count (including this hit).
_SLIDING_LUA = """
local key = KEYS[1]
local now_ms = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local member = ARGV[3]
redis.call('ZADD', key, now_ms, member)
redis.call('ZREMRANGEBYSCORE', key, '-inf', now_ms - window_ms)
return redis.call('ZCARD', key)
"""


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool


class RateLimitChecker(Protocol):
    async def check(self, *, ip: str, is_login: bool) -> RateLimitDecision: ...


class MemoryRateLimiter:
    """Per-process sliding window (same semantics as previous middleware)."""

    def __init__(self) -> None:
        self._general: dict[str, deque[float]] = defaultdict(deque)
        self._login: dict[str, deque[float]] = defaultdict(deque)

    async def check(self, *, ip: str, is_login: bool) -> RateLimitDecision:
        now = time.time()
        bucket = self._login[ip] if is_login else self._general[ip]
        limit = settings.auth_login_rate_limit_per_minute if is_login else settings.rate_limit_per_minute
        while bucket and now - bucket[0] > WINDOW_SECONDS:
            bucket.popleft()
        if len(bucket) >= limit:
            return RateLimitDecision(allowed=False)
        bucket.append(now)
        return RateLimitDecision(allowed=True)


class RedisRateLimiter:
    def __init__(self, redis: "Redis", key_prefix: str = "optiload:rl") -> None:
        self._redis = redis
        self._key_prefix = key_prefix.rstrip(":")
        self._script = self._redis.register_script(_SLIDING_LUA)

    def _safe_ip(self, ip: str) -> str:
        return ip.replace(":", "_").replace(" ", "_")[:200]

    def _key(self, ip: str, is_login: bool) -> str:
        kind = "login" if is_login else "api"
        return f"{self._key_prefix}:{kind}:{self._safe_ip(ip)}"

    async def check(self, *, ip: str, is_login: bool) -> RateLimitDecision:
        limit = settings.auth_login_rate_limit_per_minute if is_login else settings.rate_limit_per_minute
        now_ms = time.time() * 1000.0
        member = f"{now_ms:.3f}:{token_hex(6)}"
        key = self._key(ip, is_login)
        count = int(await self._script(keys=[key], args=[str(now_ms), str(WINDOW_SECONDS * 1000), member]))
        await self._redis.expire(key, WINDOW_SECONDS * 2)
        return RateLimitDecision(allowed=count <= limit)


class FallbackRateLimiter:
    """Try Redis first; on any failure use memory for that request (and log)."""

    def __init__(self, redis_limiter: RedisRateLimiter | None, memory: MemoryRateLimiter) -> None:
        self._redis = redis_limiter
        self._memory = memory
        self._warned_redis_down = False

    async def check(self, *, ip: str, is_login: bool) -> RateLimitDecision:
        if self._redis is None:
            return await self._memory.check(ip=ip, is_login=is_login)
        try:
            return await self._redis.check(ip=ip, is_login=is_login)
        except Exception as exc:
            if not self._warned_redis_down:
                logger.warning("Redis rate limit unavailable, using in-memory fallback: %s", exc)
                self._warned_redis_down = True
            return await self._memory.check(ip=ip, is_login=is_login)


_redis_client: "Redis | None" = None


async def _get_redis_client() -> "Redis | None":
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    url = settings.redis_url
    if not url or not url.strip():
        return None
    try:
        import redis.asyncio as redis_async
    except ImportError as exc:
        logger.warning("redis package not installed; rate limit stays in-memory: %s", exc)
        return None
    _redis_client = redis_async.from_url(
        url.strip(),
        encoding="utf-8",
        decode_responses=True,
        socket_connect_timeout=2.0,
        socket_timeout=2.0,
    )
    return _redis_client


def create_rate_limit_checker() -> RateLimitChecker:
    memory = MemoryRateLimiter()
    backend = (settings.rate_limit_backend or "memory").strip().lower()
    if backend != "redis":
        return memory
    if not settings.redis_url or not str(settings.redis_url).strip():
        logger.warning("OPTILOAD_RATE_LIMIT_BACKEND=redis but OPTILOAD_REDIS_URL is empty; using memory")
        return memory
    return _LazyRedisChecker(memory)


class _LazyRedisChecker:
    """Defer Redis connect until first request so import/start stays fast."""

    def __init__(self, memory: MemoryRateLimiter) -> None:
        self._memory = memory
        self._inner: RateLimitChecker | None = None
        self._init_failed = False
        self._lock = asyncio.Lock()

    async def check(self, *, ip: str, is_login: bool) -> RateLimitDecision:
        if self._inner is not None:
            return await self._inner.check(ip=ip, is_login=is_login)
        if self._init_failed:
            return await self._memory.check(ip=ip, is_login=is_login)
        async with self._lock:
            if self._inner is not None:
                return await self._inner.check(ip=ip, is_login=is_login)
            if self._init_failed:
                return await self._memory.check(ip=ip, is_login=is_login)
            client = await _get_redis_client()
            if client is None:
                self._init_failed = True
                return await self._memory.check(ip=ip, is_login=is_login)
            try:
                await client.ping()
            except Exception as exc:
                logger.warning("Redis ping failed; rate limit using memory: %s", exc)
                self._init_failed = True
                return await self._memory.check(ip=ip, is_login=is_login)
            redis_limiter = RedisRateLimiter(client, key_prefix=settings.redis_rate_limit_key_prefix)
            self._inner = FallbackRateLimiter(redis_limiter, self._memory)
        return await self._inner.check(ip=ip, is_login=is_login)
