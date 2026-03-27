from fastapi import APIRouter

router = APIRouter()


@router.post("/types")
def create_load_type() -> dict[str, str]:
    return {"status": "created"}


@router.get("/types")
def list_load_types() -> list[dict]:
    return []


@router.post("/instances")
def create_load_instance() -> dict[str, str]:
    return {"status": "created"}


@router.get("/instances")
def list_load_instances() -> list[dict]:
    return []


@router.post("/compatibility")
def check_compatibility() -> dict[str, bool]:
    return {"compatible": True}
