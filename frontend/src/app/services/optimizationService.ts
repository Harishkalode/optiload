import { apiRequest } from './http';

export interface OptimizationRunPayload {
  vehicle_id: number;
  load_ids: number[];
}

export async function runOptimization(payload: OptimizationRunPayload): Promise<{ id: number; status: string }> {
  return apiRequest<{ id: number; status: string }>('/optimization/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getOptimization(id: number): Promise<{
  id: number;
  organization_id: number;
  vehicle_id: number;
  status: string;
  result_json: Record<string, unknown>;
  created_at: string;
}> {
  return apiRequest<{
    id: number;
    organization_id: number;
    vehicle_id: number;
    status: string;
    result_json: Record<string, unknown>;
    created_at: string;
  }>(`/optimization/${id}`);
}
