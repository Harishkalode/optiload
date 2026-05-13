from app.modules.api_keys.controller import router as api_keys_router
from app.modules.audit_logs.controller import router as audit_logs_router
from app.modules.auth.controller import router as auth_router
from app.modules.dashboard.controller import router as dashboard_router
from app.modules.load_builder.controller import router as load_builder_router
from app.modules.loads.controller import router as loads_router
from app.modules.meta.controller import router as meta_router
from app.modules.notifications.controller import router as notifications_router
from app.modules.optimization.controller import router as optimization_router
from app.modules.organizations.controller import router as organizations_router
from app.modules.permissions.controller import router as permissions_router
from app.modules.reports.controller import router as reports_router
from app.modules.roles.controller import router as roles_router
from app.modules.system_monitoring.controller import router as system_monitoring_router
from app.modules.users.controller import router as users_router
from app.modules.vehicles.controller import router as vehicles_router
from fastapi import APIRouter

from app.core.health import router as health_router
from app.core.seed import SeedDataService
from app.core.utils.responses import success_response

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(roles_router)
api_router.include_router(permissions_router)
api_router.include_router(organizations_router)
api_router.include_router(api_keys_router)
api_router.include_router(vehicles_router)
api_router.include_router(loads_router)
api_router.include_router(load_builder_router)
api_router.include_router(optimization_router)
api_router.include_router(notifications_router)
api_router.include_router(reports_router)
api_router.include_router(meta_router)
api_router.include_router(dashboard_router)
api_router.include_router(audit_logs_router)
api_router.include_router(system_monitoring_router)
api_router.include_router(health_router)


@api_router.post("/seed", include_in_schema=False)
async def seed_database():
    service = SeedDataService()
    return service.run_seed()
