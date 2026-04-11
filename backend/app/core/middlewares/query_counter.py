"""Query counter middleware for N+1 detection.

Counts SQL queries per request and logs warnings when threshold is exceeded.
Only active in local/testing environments.
"""

import logging
import threading

from app.core.config import settings
from app.core.database.session import engine
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("optiload.query_counter")

_local = threading.local()
_lock = threading.Lock()


def _count_queries(conn, cursor, statement, parameters, context, executemany):
    _local.query_count = getattr(_local, "query_count", 0) + 1


class QueryCounterMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not settings.enable_query_counter:
            return await call_next(request)

        from sqlalchemy import event
        from sqlalchemy.exc import InvalidRequestError

        _local.query_count = 0
        with _lock:
            event.listen(engine, "before_cursor_execute", _count_queries)
        try:
            response = await call_next(request)
        finally:
            with _lock:
                try:
                    event.remove(engine, "before_cursor_execute", _count_queries)
                except InvalidRequestError:
                    pass

        query_count = getattr(_local, "query_count", 0)
        if query_count > settings.query_counter_threshold:
            logger.warning(
                "High query count: %d queries for %s %s (threshold: %d)",
                query_count,
                request.method,
                request.url.path,
                settings.query_counter_threshold,
            )

        response.headers["X-Query-Count"] = str(query_count)
        return response
