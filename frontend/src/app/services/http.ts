export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: ApiErrorPayload | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('optiload_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init.headers ?? {}),
    },
  });

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !payload.success) {
    const message = payload?.error?.message ?? `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}
