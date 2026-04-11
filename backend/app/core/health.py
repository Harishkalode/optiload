"""Health check and metrics endpoints."""

import time
from datetime import datetime, timezone

from app.core.config import settings
from app.core.database.session import health_check_db
from app.core.utils.responses import success_response
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(tags=["health"])

START_TIME = time.time()


@router.get("/meta/health")
def health_check():
    return success_response({
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.resolved_environment,
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@router.get("/meta/ready")
def readiness_check():
    db_healthy = health_check_db()
    status = "ready" if db_healthy else "not_ready"
    code = 200 if db_healthy else 503
    return JSONResponse(
        status_code=code,
        content={
            "status": status,
            "database": "connected" if db_healthy else "disconnected",
            "cache": "enabled" if settings.cache_enabled else "disabled",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@router.get("/meta/metrics")
def metrics():
    from app.core.database.session import engine

    pool = engine.pool.status()
    return success_response({
        "pool_size": pool.size,
        "checked_in": pool.checkedin,
        "checked_out": pool.checkedout,
        "overflow": pool.overflow,
        "pool_timeout": settings.db_pool_timeout,
        "pool_recycle": settings.db_pool_recycle,
        "environment": settings.resolved_environment,
        "cache_enabled": settings.cache_enabled,
        "csrf_enabled": settings.csrf_enabled,
        "rate_limit_backend": settings.rate_limit_backend,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
