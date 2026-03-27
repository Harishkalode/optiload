import { apiRequest } from './http';

export type BackendRole = 'super_admin' | 'admin' | 'sub_admin' | string;

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    status: string;
    mfa_enabled: boolean;
  };
  role: BackendRole;
  organization_id: number | null;
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
