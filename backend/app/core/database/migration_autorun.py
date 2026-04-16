"""Automatic lightweight migration checks at startup.

This module performs a safe, idempotent migration check to ensure
non-existent columns required by the ORM exist in the underlying database.
It is intentionally defensive: if the database is unavailable or the user
lacks permissions, startup will continue with limited persistence, but
informative logs will be emitted.
"""

from __future__ import annotations

import logging
from sqlalchemy import text

try:
    # Import engine from the existing session module
    from app.core.database.session import engine
except Exception:  # pragma: no cover - only on startup environments without DB
    engine = None  # type: ignore

logger = logging.getLogger("optiload")


def ensure_securements_json_exists() -> None:
    """Ensure optimizations.securements_json column exists in the DB.

    Uses a safe, transactional ALTER TABLE with IF NOT EXISTS to be idempotent.
    If the engine is not available (e.g., in non-DB tests), the function is a no-op.
    """
    if engine is None:
        logger.debug("DB engine not available; skipping auto-migration check.")
        return

    try:
        with engine.begin() as conn:  # transactional, commits on success
            result = conn.execute(
                text(
                    "SELECT 1 FROM information_schema.columns WHERE table_name = 'optimizations' AND column_name = 'securements_json'"
                )
            )
            exists = result.first() is not None
            if not exists:
                logger.info("Auto-migration: adding missing column optimizations.securements_json")
                conn.execute(text("ALTER TABLE optimizations ADD COLUMN IF NOT EXISTS securements_json JSONB"))
    except Exception as exc:
        # Do not crash startup; log for operators to act if needed
        logger.exception("Auto-migration check failed: %s", exc)
