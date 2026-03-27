from pydantic import BaseModel


class AuditLogCreateRequest(BaseModel):
    user_id: int
    organization_id: int | None
    action: str
    resource: str
    resource_id: str
    metadata_json: dict
    ip_address: str
