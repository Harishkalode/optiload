from fastapi import APIRouter

router = APIRouter()


@router.get("")
def list_users() -> list[dict[str, str]]:
    return []


@router.post("")
def create_user() -> dict[str, str]:
    return {"status": "created"}


@router.get("/{user_id}")
def get_user(user_id: str) -> dict[str, str]:
    return {"id": user_id}


@router.put("/{user_id}")
def update_user(user_id: str) -> dict[str, str]:
    return {"id": user_id, "status": "updated"}


@router.delete("/{user_id}")
def delete_user(user_id: str) -> dict[str, str]:
    return {"id": user_id, "status": "deleted"}


@router.post("/{user_id}/impersonate")
def impersonate_user(user_id: str) -> dict[str, str]:
    return {"id": user_id, "status": "impersonating"}
