from datetime import datetime
from enum import Enum

from app.core.database.base import Base
from sqlalchemy import DateTime, Enum as SAEnum, Float
from sqlalchemy.orm import Mapped, mapped_column


class MetricType(str, Enum):
    cpu_usage = "cpu_usage"
    memory_usage = "memory_usage"
    request_count = "request_count"
    error_count = "error_count"
    job_latency = "job_latency"


class SystemMetric(Base):
    __tablename__ = "system_metrics"

    id: Mapped[int] = mapped_column(primary_key=True)
    metric_type: Mapped[MetricType] = mapped_column(SAEnum(MetricType), index=True)
    value: Mapped[float] = mapped_column(Float)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
