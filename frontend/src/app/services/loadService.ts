import { apiRequest } from './http';

export interface ApiLoad {
  id: number;
  organization_id: number;
  type: string;
  dimensions: Record<string, number>;
  weight: number;
}

export async function listLoads(): Promise<ApiLoad[]> {
  return apiRequest<ApiLoad[]>('/loads');
}

export async function createLoad(payload: { type: string; dimensions: Record<string, number>; weight: number }): Promise<{ id: number }> {
  return apiRequest<{ id: number }>('/loads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
