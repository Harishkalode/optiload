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

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const API_BASE_URL = rawApiBaseUrl.endsWith('/') ? rawApiBaseUrl.slice(0, -1) : rawApiBaseUrl;

let refreshInFlight: Promise<boolean> | null = null;

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('optiload_access_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const storedRefresh = localStorage.getItem('optiload_refresh_token');
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: storedRefresh || undefined }),
      });
      const payload = (await response.json()) as ApiEnvelope<{
        access_token?: string;
        refresh_token?: string;
      }>;
      if (!response.ok || !payload.success || !payload.data) {
        return false;
      }
      const access = payload.data.access_token;
      if (access) {
        localStorage.setItem('optiload_access_token', access);
      }
      const refresh = payload.data.refresh_token;
      if (refresh) {
        localStorage.setItem('optiload_refresh_token', refresh);
      }
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init.headers ?? {}),
    },
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
  }

  if (
    response.status === 401 &&
    !isRetry &&
    path !== '/auth/login' &&
    path !== '/auth/register' &&
    path !== '/auth/refresh'
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequest<T>(path, init, true);
    }
  }

  if (!response.ok || (payload && !payload.success)) {
    const message = payload?.error?.message ?? `Request failed: ${response.status}`;
    throw new Error(message);
  }

  if (!payload) {
    throw new Error('Empty response payload from API');
  }

  return payload.data;
}
