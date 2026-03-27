from fastapi import APIRouter

router = APIRouter()


@router.get("/metrics")
def metrics() -> dict[str, int]:
    return {"active_jobs": 0, "users": 0}


@router.get("/audit-logs")
def audit_logs() -> list[dict]:
    return []


@router.post("/users/{user_id}/suspend")
def suspend_user(user_id: str) -> dict[str, str]:
    return {"id": user_id, "status": "suspended"}


@router.get("/system-health")
def system_health() -> dict[str, str]:
    return {"database": "ok", "api": "ok"}


@router.post("/backup")
def backup() -> dict[str, str]:
    return {"status": "started"}
