import { apiRequest } from './http';

export interface ApiLoad {
  id: number;
  organization_id: number;
  type: string;
  dimensions: Record<string, number>;
  weight: number;
  quantity?: number;
}

export interface LoadListResponse {
  items: ApiLoad[];
  total: number;
  page: number;
  page_size: number;
}

export async function listLoads(page = 1, pageSize = 20): Promise<LoadListResponse> {
  return apiRequest<LoadListResponse>(`/loads?page=${page}&page_size=${pageSize}`);
}

export async function createLoad(payload: { type: string; dimensions: Record<string, number>; weight: number; quantity?: number }): Promise<{ id: number }> {
  return apiRequest<{ id: number }>('/loads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteLoad(id: number): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/loads/${id}`, { method: 'DELETE' });
}
