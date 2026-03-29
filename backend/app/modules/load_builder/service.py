from app.core.utils.errors import AppError
from app.modules.load_builder.model import LoadSession, LoadSessionItem
from app.modules.load_builder.repository import LoadBuilderRepository
from app.modules.loads.repository import LoadRepository
from app.modules.vehicles.repository import VehicleRepository


class LoadBuilderService:
    def __init__(self, repository: LoadBuilderRepository, vehicle_repository: VehicleRepository,
                 load_repository: LoadRepository):
        self.repository = repository
        self.vehicle_repository = vehicle_repository
        self.load_repository = load_repository

    def create_session(self, user_id: int, organization_id: int, vehicle_id: int) -> LoadSession:
        vehicle = self.vehicle_repository.get_by_id(vehicle_id)
        if not vehicle or vehicle.organization_id != organization_id:
            raise AppError("INVALID_VEHICLE", "Vehicle does not belong to organization", status_code=400)
        return self.repository.create_session(LoadSession(user_id=user_id, vehicle_id=vehicle_id))

    def add_item(self, organization_id: int, session_id: int, load_id: int, quantity: int) -> LoadSessionItem:
        session = self.repository.get_session(session_id)
        if not session:
            raise AppError("NOT_FOUND", "Load builder session not found", status_code=404)

        vehicle = self.vehicle_repository.get_by_id(session.vehicle_id)
        load = self.load_repository.get_by_id(load_id)
        if not vehicle or vehicle.organization_id != organization_id or not load or load.organization_id != organization_id:
            raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)

        return self.repository.add_item(LoadSessionItem(session_id=session_id, load_id=load_id, quantity=quantity))

    def remove_item(self, organization_id: int, item_id: int) -> None:
        item = self.repository.get_item(item_id)
        if not item:
            raise AppError("NOT_FOUND", "Load builder item not found", status_code=404)
        session = self.repository.get_session(item.session_id)
        if not session:
            raise AppError("NOT_FOUND", "Load builder session not found", status_code=404)
        vehicle = self.vehicle_repository.get_by_id(session.vehicle_id)
        if not vehicle or vehicle.organization_id != organization_id:
            raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
        self.repository.delete_item(item)

    def get_session(self, organization_id: int, session_id: int) -> dict:
        session = self.repository.get_session(session_id)
        if not session:
            raise AppError("NOT_FOUND", "Load builder session not found", status_code=404)
        vehicle = self.vehicle_repository.get_by_id(session.vehicle_id)
        if not vehicle or vehicle.organization_id != organization_id:
            raise AppError("FORBIDDEN", "Cross-tenant access denied", status_code=403)
        items = self.repository.list_items(session_id)
        return {
            "id": session.id,
            "vehicle_id": session.vehicle_id,
            "status": session.status.value,
            "items": [{"id": i.id, "load_id": i.load_id, "quantity": i.quantity} for i in items],
        }
