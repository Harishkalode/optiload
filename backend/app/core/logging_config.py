"""Structured logging configuration.

Production: JSON structured logs with request context.
Local/Test: Human-readable console logs.
"""

import json
import logging
import sys
from datetime import datetime, timezone

from app.core.config import settings


def setup_logging() -> logging.Logger:
    root_logger = logging.getLogger("optiload")
    root_logger.setLevel(getattr(logging, settings.log_level or "DEBUG"))

    if root_logger.handlers:
        return root_logger

    handler = logging.StreamHandler(sys.stdout)

    if settings.structured_logging:
        handler.setFormatter(StructuredJSONFormatter())
    else:
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )

    root_logger.addHandler(handler)
    return root_logger


class StructuredJSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, object] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_entry["user_id"] = record.user_id
        if hasattr(record, "ip_address"):
            log_entry["ip_address"] = record.ip_address

        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)
