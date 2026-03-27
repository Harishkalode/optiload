import { apiRequest } from './http';

export interface ApiVehicle {
  id: number;
  organization_id: number;
  type: string;
  dimensions: Record<string, number>;
  capacity: number;
}

export async function listVehicles(): Promise<ApiVehicle[]> {
  return apiRequest<ApiVehicle[]>('/vehicles');
}

export async function createVehicle(payload: { type: string; dimensions: Record<string, number>; capacity: number }): Promise<{ id: number }> {
  return apiRequest<{ id: number }>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
