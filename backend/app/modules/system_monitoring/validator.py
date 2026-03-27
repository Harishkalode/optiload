from pydantic import BaseModel


class MetricCreateRequest(BaseModel):
    metric_type: str
    value: float
