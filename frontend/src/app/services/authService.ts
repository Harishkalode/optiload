import { apiRequest } from './http';

export interface AuthUserPayload {
  id: number;
  name?: string;
  email?: string;
  role: string;
  organization_id: number | null;
  mfa_enabled?: boolean;
}

export interface AuthResponse {
  access_token?: string;
  refresh_token?: string;
  user: AuthUserPayload;
}

export interface RegisterRequestPayload {
  full_name: string;
  email: string;
  password: string;
  organization_name: string;
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequest(payload: RegisterRequestPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function meRequest(): Promise<AuthUserPayload> {
  return apiRequest<AuthUserPayload>('/auth/me', { method: 'GET' });
}

export async function logoutRequest(): Promise<void> {
  await apiRequest<{ logged_out: boolean }>('/auth/logout', { method: 'POST' });
}
