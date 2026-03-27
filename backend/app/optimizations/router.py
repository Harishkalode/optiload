from fastapi import APIRouter

router = APIRouter()


@router.post("")
def create_job() -> dict[str, str]:
    return {"job_id": "job-temp", "status": "queued"}


@router.get("/{job_id}")
def get_job(job_id: str) -> dict[str, str]:
    return {"job_id": job_id, "status": "completed"}


@router.get("/{job_id}/progress")
def get_progress(job_id: str) -> dict[str, object]:
    return {"job_id": job_id, "progress": 100}


@router.post("/{job_id}/approve")
def approve_job(job_id: str) -> dict[str, str]:
    return {"job_id": job_id, "status": "approved"}


@router.post("/validate")
def validate_placement() -> dict[str, object]:
    return {"valid": True, "violations": []}
