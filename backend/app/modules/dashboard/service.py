from datetime import datetime, timedelta

from app.modules.audit_logs.repository import AuditLogRepository
from app.modules.loads.repository import LoadRepository
from app.modules.optimization.repository import OptimizationRepository


class DashboardService:
    def __init__(self, load_repo: LoadRepository, optimization_repo: OptimizationRepository, audit_repo: AuditLogRepository):
        self.load_repo = load_repo
        self.optimization_repo = optimization_repo
        self.audit_repo = audit_repo

    def summary(self, organization_id: int) -> dict:
        total_loads = len(self.load_repo.list_by_org(organization_id))
        optimizations = self.optimization_repo.list_by_org(organization_id)
        return {
            "total_loads": total_loads,
            "optimizations": len(optimizations),
            "avg_efficiency": round(sum((o.efficiency_score or 0) for o in optimizations) / len(optimizations), 3) if optimizations else 0,
        }

    def recent_loads(self, organization_id: int) -> list[dict]:
        loads = self.load_repo.list_by_org(organization_id)[:10]
        return [{"id": l.id, "type": l.type.value, "weight": l.weight, "quantity": l.quantity} for l in loads]

    def activity(self, organization_id: int) -> list[dict]:
        week_ago = datetime.utcnow() - timedelta(days=7)
        logs = [l for l in self.audit_repo.list_by_org(organization_id) if l.timestamp >= week_ago][:20]
        return [{"id": l.id, "action": l.action, "resource": l.resource, "timestamp": l.timestamp} for l in logs]
