from collections import defaultdict
from datetime import datetime, timedelta
from typing import Literal

from app.modules.loads.repository import LoadRepository
from app.modules.optimization.repository import OptimizationRepository
from app.modules.vehicles.repository import VehicleRepository

Period = Literal["1M", "3M", "6M", "1Y"]


def _period_start(period: Period) -> datetime:
    now = datetime.utcnow()
    delta = {"1M": timedelta(days=30), "3M": timedelta(days=90), "6M": timedelta(days=180), "1Y": timedelta(days=365)}[
        period]
    return now - delta


class ReportsService:
    def __init__(
            self,
            optimization_repo: OptimizationRepository,
            vehicle_repo: VehicleRepository,
            load_repo: LoadRepository,
    ):
        self.optimization_repo = optimization_repo
        self.vehicle_repo = vehicle_repo
        self.load_repo = load_repo

    def summary(self, organization_id: int, period: Period) -> dict:
        start = _period_start(period)
        opts = [o for o in self.optimization_repo.list_by_org(organization_id) if
                o.created_at and o.created_at >= start]
        vehicles = self.vehicle_repo.list_by_org(organization_id)
        loads = self.load_repo.list_by_org(organization_id)
        avg_eff = round(sum((o.efficiency_score or 0) for o in opts) / len(opts), 4) if opts else 0.0
        return {
            "period": period,
            "total_optimizations": len(opts),
            "avg_efficiency": avg_eff,
            "fleet_size": len(vehicles),
            "load_catalog_size": len(loads),
            "cost_savings_estimate_usd": round(len(opts) * 1200 * (avg_eff or 0), 2),
        }

    def utilization(self, organization_id: int, period: Period) -> dict:
        start = _period_start(period)
        opts = [o for o in self.optimization_repo.list_by_org(organization_id) if
                o.created_at and o.created_at >= start]
        by_vehicle: dict[int, list] = defaultdict(list)
        for o in opts:
            by_vehicle[o.vehicle_id].append(o)
        items = []
        for vid, runs in by_vehicle.items():
            scores = [r.efficiency_score or 0 for r in runs]
            items.append(
                {
                    "vehicle_id": vid,
                    "runs": len(runs),
                    "avg_efficiency": round(sum(scores) / len(scores), 4) if scores else 0.0,
                },
            )
        items.sort(key=lambda x: x["runs"], reverse=True)
        return {"period": period, "items": items}

    def performance(self, organization_id: int, period: Period) -> dict:
        start = _period_start(period)
        opts = [o for o in self.optimization_repo.list_by_org(organization_id) if
                o.created_at and o.created_at >= start]
        by_month: dict[str, list] = defaultdict(list)
        for o in opts:
            key = o.created_at.strftime("%Y-%m")
            by_month[key].append(o)
        series = []
        for month in sorted(by_month.keys()):
            rows = by_month[month]
            eff = [r.efficiency_score or 0 for r in rows]
            series.append(
                {
                    "month": month,
                    "jobs": len(rows),
                    "avg_efficiency": round(sum(eff) / len(eff), 4) if eff else 0.0,
                },
            )
        return {"period": period, "series": series}
