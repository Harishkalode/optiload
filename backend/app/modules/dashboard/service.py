from datetime import datetime, timedelta

from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.loads.repository import LoadRepository
from app.modules.optimization.repository import OptimizationRepository
from app.modules.users.repository import UserRepository
from app.modules.vehicles.repository import VehicleRepository


class DashboardService:
    def __init__(
        self,
        load_repo: LoadRepository,
        optimization_repo: OptimizationRepository,
        audit_repo: AuditLogRepository,
        vehicle_repo: VehicleRepository,
        user_repo: UserRepository,
    ):
        self.load_repo = load_repo
        self.optimization_repo = optimization_repo
        self.audit_repo = audit_repo
        self.vehicle_repo = vehicle_repo
        self.user_repo = user_repo

    def summary(self, organization_id: int) -> dict:
        loads = self.load_repo.list_by_org(organization_id)
        vehicles = self.vehicle_repo.list_by_org(organization_id)
        optimizations = self.optimization_repo.list_by_org(organization_id)
        avg_eff = round(sum((o.efficiency_score or 0) for o in optimizations) / len(optimizations), 4) if optimizations else 0.0
        recent = optimizations[:12]
        trend = [{"index": i, "efficiency": round(o.efficiency_score or 0, 4)} for i, o in enumerate(reversed(recent))]
        return {
            "total_loads": len(loads),
            "total_vehicles": len(vehicles),
            "optimizations": len(optimizations),
            "avg_efficiency": avg_eff,
            "efficiency_trend": trend,
        }

    def recent_loads(self, organization_id: int) -> list[dict]:
        loads = self.load_repo.list_by_org(organization_id)[:10]
        return [{"id": l.id, "type": l.type.value, "weight": l.weight, "quantity": l.quantity} for l in loads]

    def activity(self, organization_id: int) -> list[dict]:
        week_ago = datetime.utcnow() - timedelta(days=7)
        logs = self.audit_repo.list_filtered(organization_id, date_from=week_ago, limit=20)
        out = []
        for l in logs:
            user = self.user_repo.get_by_id(l.user_id)
            out.append(
                {
                    "id": l.id,
                    "action": l.action,
                    "resource": l.resource,
                    "timestamp": l.timestamp,
                    "user_id": l.user_id,
                    "user_email": user.email if user else None,
                    "user_name": user.name if user else None,
                },
            )
        return out

    def recent_optimizations(self, organization_id: int, limit: int = 20) -> list[dict]:
        opts = self.optimization_repo.list_by_org(organization_id)[:limit]
        return [
            {
                "id": o.id,
                "vehicle_id": o.vehicle_id,
                "load_count": len((o.input_json or {}).get("load_ids", [])),
                "efficiency_score": o.efficiency_score,
                "status": o.status.value,
                "created_at": o.created_at,
            }
            for o in opts
        ]
