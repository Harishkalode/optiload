import { apiRequest } from './http';

export interface ApiLoad {
  id: number;
  organization_id: number;
  type: string;
  shape?: 'cuboid' | 'cylinder' | 'irregular' | string;
  load_type?: string;
  dimensions: Record<string, number>;
  material_type?: string;
  texture_url?: string;
  model_url?: string;
  orientation?: Record<string, number>;
  weight: number;
  quantity?: number;
  diameter?: number;
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

export async function createLoad(payload: {
  type: string;
  shape?: 'cuboid' | 'cylinder' | 'irregular' | string;
  load_type?: string;
  dimensions: Record<string, number>;
  weight: number;
  quantity?: number;
  diameter?: number;
  material_type?: string;
  texture_url?: string;
  model_url?: string;
  orientation?: Record<string, number>;
  fragile?: boolean;
  stackable?: boolean;
}): Promise<{ id: number }> {
  return apiRequest<{ id: number }>('/loads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteLoad(id: number): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/loads/${id}`, { method: 'DELETE' });
}
