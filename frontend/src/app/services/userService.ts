import { apiRequest } from './http';

export interface ApiUser {
  id: number;
  organization_id: number | null;
  name: string;
  email: string;
  role_id: number;
  status: string;
  mfa_enabled: boolean;
  last_login: string | null;
  created_at: string;
}

export interface CreateUserPayload {
  organization_id?: number | null;
  name: string;
  email: string;
  password: string;
  role_id: number;
}

export async function listUsers(): Promise<ApiUser[]> {
  return apiRequest<ApiUser[]>('/users');
}

export async function createUser(payload: CreateUserPayload): Promise<{ id: number }> {
  return apiRequest<{ id: number }>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUser(userId: number, payload: Partial<Pick<ApiUser, 'status' | 'mfa_enabled'>>): Promise<{ id: number }> {
  return apiRequest<{ id: number }>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
