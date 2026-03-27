from typing import Any


def success_response(data: Any) -> dict[str, Any]:
    return {"success": True, "data": data, "error": None}


def error_response(code: str, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "success": False,
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
        },
    }
