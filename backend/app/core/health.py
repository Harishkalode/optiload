"""Health check and metrics endpoints."""

import time
from datetime import datetime, timezone

from app.core.config import settings
from app.core.database.session import health_check_db
from app.core.utils.responses import success_response
from fastapi import APIRouter
from fastapi.responses import JSONResponse, PlainTextResponse

router = APIRouter(tags=["health"])

START_TIME = time.time()

# Optional Prometheus metrics
_prometheus_registry = None
_prometheus_metrics_initialized = False


def _init_prometheus():
    global _prometheus_registry, _prometheus_metrics_initialized
    if _prometheus_metrics_initialized:
        return
    try:
        from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST
        from prometheus_client import REGISTRY as _prometheus_registry

        # Application-level metrics
        http_requests_total = Counter(
            "optiload_http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
        )
        http_request_duration_seconds = Histogram(
            "optiload_http_request_duration_seconds",
            "HTTP request duration in seconds",
            ["method", "endpoint"],
            buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
        )
        db_pool_connections = Gauge(
            "optiload_db_pool_connections", "Database pool connections", ["state"]
        )
        cog_height_inches = Gauge(
            "optiload_cog_height_inches", "Center of gravity height per AAR 3.5.1"
        )

        # Store for middleware access
        _prometheus_registry._optiload_metrics = {
            "http_requests_total": http_requests_total,
            "http_request_duration_seconds": http_request_duration_seconds,
            "db_pool_connections": db_pool_connections,
            "cog_height_inches": cog_height_inches,
            "generate_latest": generate_latest,
            "CONTENT_TYPE_LATEST": CONTENT_TYPE_LATEST,
        }
        _prometheus_metrics_initialized = True
    except ImportError:
        _prometheus_metrics_initialized = False


def get_prometheus_metrics():
    """Return the prometheus metrics dict if initialized."""
    _init_prometheus()
    if _prometheus_registry and hasattr(_prometheus_registry, "_optiload_metrics"):
        return _prometheus_registry._optiload_metrics
    return None


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


@router.get("/meta/prometheus")
def prometheus_metrics():
    metrics_dict = get_prometheus_metrics()
    if not metrics_dict:
        return PlainTextResponse(
            "# Prometheus client not installed\n", status_code=200, media_type="text/plain"
        )
    try:
        from prometheus_client import REGISTRY

        data = generate_latest(REGISTRY)
        return PlainTextResponse(data, media_type="text/plain")
    except ImportError:
        return PlainTextResponse(
            "# Prometheus client not installed\n", status_code=200, media_type="text/plain"
        )
