"""Account lockout manager.

Tracks failed login attempts and locks accounts after threshold.
Uses Redis in production, in-memory fallback for local/test.
"""

import logging
import time

from app.core.config import settings

logger = logging.getLogger("optiload.lockout")


class AccountLockoutManager:
    def __init__(self) -> None:
        self._redis = None
        self._local_attempts: dict[str, list[float]] = {}
        self._local_locks: dict[str, float] = {}

    async def initialize(self) -> None:
        if settings.is_production and settings.redis_url:
            try:
                import redis.asyncio as redis_async

                self._redis = redis_async.from_url(
                    settings.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                )
                await self._redis.ping()
            except Exception as exc:
                logger.warning("Redis unavailable for lockout, using in-memory: %s", exc)
                self._redis = None

    def _lock_key(self, identifier: str) -> str:
        return f"lockout:{identifier}"

    def _attempts_key(self, identifier: str) -> str:
        return f"attempts:{identifier}"

    async def record_failed_attempt(self, identifier: str) -> None:
        if not settings.account_lockout_enabled:
            return

        now = time.time()
        window = settings.account_lockout_duration_minutes * 60

        if self._redis:
            try:
                key = self._attempts_key(identifier)
                pipe = self._redis.pipeline()
                pipe.zadd(key, {str(now): now})
                pipe.zremrangebyscore(key, 0, now - window)
                pipe.zcard(key)
                pipe.expire(key, window * 2)
                results = await pipe.execute()
                count = results[2]
                if count >= settings.account_lockout_max_attempts:
                    await self._redis.setex(
                        self._lock_key(identifier),
                        window,
                        "locked",
                    )
                    logger.info("Account locked: %s (attempts: %d)", identifier, count)
                return
            except Exception as exc:
                logger.warning("Redis lockout failed, using memory: %s", exc)

        bucket = self._local_attempts.setdefault(identifier, [])
        while bucket and bucket[0] < now - window:
            bucket.pop(0)
        bucket.append(now)

        if len(bucket) >= settings.account_lockout_max_attempts:
            self._local_locks[identifier] = now + window
            logger.info("Account locked (memory): %s (attempts: %d)", identifier, len(bucket))

    async def is_locked(self, identifier: str) -> bool:
        if not settings.account_lockout_enabled:
            return False

        if self._redis:
            try:
                locked = await self._redis.exists(self._lock_key(identifier))
                return bool(locked)
            except Exception:
                pass

        lock_until = self._local_locks.get(identifier)
        if lock_until and time.time() < lock_until:
            return True
        if lock_until and time.time() >= lock_until:
            del self._local_locks[identifier]
        return False

    async def reset_attempts(self, identifier: str) -> None:
        if self._redis:
            try:
                await self._redis.delete(self._attempts_key(identifier))
                await self._redis.delete(self._lock_key(identifier))
            except Exception:
                pass

        self._local_attempts.pop(identifier, None)
        self._local_locks.pop(identifier, None)


lockout_manager = AccountLockoutManager()
