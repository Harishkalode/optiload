"""Cache manager with environment-driven behavior.

In production: uses Redis for distributed caching.
In local/test: disabled or uses simple in-memory fallback.
"""

import hashlib
import json
import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger("optiload.cache")


class CacheManager:
    def __init__(self) -> None:
        self._redis: Any = None
        self._local_cache: dict[str, Any] = {}
        self._initialized = False

    async def initialize(self) -> None:
        if self._initialized:
            return
        if settings.cache_enabled and settings.redis_url:
            try:
                import redis.asyncio as redis_async

                self._redis = redis_async.from_url(
                    settings.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                )
                await self._redis.ping()
                logger.info("Redis cache initialized")
            except Exception as exc:
                logger.warning("Redis cache unavailable, using in-memory fallback: %s", exc)
                self._redis = None
        self._initialized = True

    async def get(self, key: str) -> Any | None:
        if not settings.cache_enabled:
            return None

        if self._redis:
            try:
                raw = await self._redis.get(key)
                if raw is not None:
                    return json.loads(raw)
            except Exception as exc:
                logger.warning("Cache get failed: %s", exc)
            return None

        return self._local_cache.get(key)

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        if not settings.cache_enabled:
            return

        if ttl is None:
            ttl = settings.cache_default_ttl
        ttl = min(ttl, settings.cache_max_ttl)

        serialized = json.dumps(value, default=str)

        if self._redis:
            try:
                await self._redis.setex(key, ttl, serialized)
            except Exception as exc:
                logger.warning("Cache set failed: %s", exc)
        else:
            self._local_cache[key] = value

    async def delete(self, key: str) -> None:
        if not settings.cache_enabled:
            return

        if self._redis:
            try:
                await self._redis.delete(key)
            except Exception as exc:
                logger.warning("Cache delete failed: %s", exc)
        else:
            self._local_cache.pop(key, None)

    async def clear(self) -> None:
        if not settings.cache_enabled:
            return

        if self._redis:
            try:
                await self._redis.flushdb()
            except Exception as exc:
                logger.warning("Cache clear failed: %s", exc)
        else:
            self._local_cache.clear()

    @staticmethod
    def make_key(prefix: str, *args: Any, **kwargs: Any) -> str:
        parts = [prefix] + [str(a) for a in args] + [f"{k}={v}" for k, v in sorted(kwargs.items())]
        raw = "|".join(parts)
        return f"{prefix}:{hashlib.md5(raw.encode()).hexdigest()}"


cache = CacheManager()


def cached_response(prefix: str, ttl: int | None = None):
    def decorator(func):
        async def wrapper(*args: Any, **kwargs: Any):
            key = CacheManager.make_key(prefix, *args, **kwargs)
            result = await cache.get(key)
            if result is not None:
                return result
            result = await func(*args, **kwargs)
            await cache.set(key, result, ttl)
            return result

        return wrapper

    return decorator
