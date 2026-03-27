from app.modules.system_monitoring.repository import SystemMetricRepository


class SystemMonitoringService:
    def __init__(self, repository: SystemMetricRepository):
        self.repository = repository

    def metrics(self):
        return self.repository.list_metrics()

    def jobs(self):
        return [{"job": "optimization_worker", "status": "healthy"}]

    def errors(self):
        return []
