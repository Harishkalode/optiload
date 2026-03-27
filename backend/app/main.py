from fastapi import FastAPI

from app.core.config import settings
from app.core.middleware import setup_middleware
from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.vehicles.router import router as vehicles_router
from app.loads.router import router as loads_router
from app.optimizations.router import router as optimizations_router
from app.admin.router import router as admin_router


app = FastAPI(title=settings.APP_NAME)
setup_middleware(app)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(vehicles_router, prefix="/vehicles", tags=["vehicles"])
app.include_router(loads_router, prefix="/loads", tags=["loads"])
app.include_router(optimizations_router, prefix="/optimizations", tags=["optimizations"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
