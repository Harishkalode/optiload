import { apiRequest } from './http';

export interface ApiVehicle {
  id: number;
  organization_id: number;
  type: string;
  dimensions: Record<string, number>;
  capacity: number;
  tare_weight_kg?: number;
  plate_type?: string;
  truck_center_front?: number;
  truck_center_rear?: number;
  empty_cg_height_in?: number;
  axle_positions?: number[];
}

export interface VehicleListResponse {
  items: ApiVehicle[];
  total: number;
  page: number;
  page_size: number;
}

export async function listVehicles(page = 1, pageSize = 20): Promise<VehicleListResponse> {
  return apiRequest<VehicleListResponse>(`/vehicles?page=${page}&page_size=${pageSize}`);
}

export async function createVehicle(payload: {
  type: string;
  dimensions: Record<string, number>;
  capacity: number;
  tare_weight_kg?: number;
  plate_type?: string;
  truck_center_front?: number;
  truck_center_rear?: number;
  empty_cg_height_in?: number;
  axle_positions?: number[];
}): Promise<{ id: number }> {
  return apiRequest<{ id: number }>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateVehicle(id: number, payload: {
  type?: string;
  dimensions?: Record<string, number>;
  capacity?: number;
  tare_weight_kg?: number;
  plate_type?: string;
  truck_center_front?: number;
  truck_center_rear?: number;
  empty_cg_height_in?: number;
  axle_positions?: number[];
}): Promise<{ id: number }> {
  return apiRequest<{ id: number }>(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteVehicle(id: number): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/vehicles/${id}`, { method: 'DELETE' });
}
