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
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function csrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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
  const method = (init.method ?? 'GET').toUpperCase();
  const csrfHeader = method !== 'GET' ? { 'X-CSRF-Token': csrfToken() ?? '' } : {};

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...csrfHeader,
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
