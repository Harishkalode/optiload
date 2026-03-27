from fastapi import APIRouter

from app.modules.audit_logs.controller import router as audit_logs_router
from app.modules.auth.controller import router as auth_router
from app.modules.loads.controller import router as loads_router
from app.modules.optimization.controller import router as optimization_router
from app.modules.organizations.controller import router as organizations_router
from app.modules.permissions.controller import router as permissions_router
from app.modules.roles.controller import router as roles_router
from app.modules.system_monitoring.controller import router as system_monitoring_router
from app.modules.users.controller import router as users_router
from app.modules.vehicles.controller import router as vehicles_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(roles_router)
api_router.include_router(permissions_router)
api_router.include_router(organizations_router)
api_router.include_router(vehicles_router)
api_router.include_router(loads_router)
api_router.include_router(optimization_router)
api_router.include_router(audit_logs_router)
api_router.include_router(system_monitoring_router)
