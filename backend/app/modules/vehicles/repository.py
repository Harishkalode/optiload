from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.vehicles.model import Vehicle


class VehicleRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_org(self, organization_id: int) -> list[Vehicle]:
        return list(self.db.scalars(select(Vehicle).where(Vehicle.organization_id == organization_id)).all())

    def get_by_id(self, vehicle_id: int) -> Vehicle | None:
        return self.db.get(Vehicle, vehicle_id)

    def create(self, vehicle: Vehicle) -> Vehicle:
        self.db.add(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle
