import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { loginRequest, logoutRequest, meRequest, registerRequest } from '../services/authService';
import { apiRequest } from '../services/http';
import { ROLE_REDIRECT, ROLES, type RoleValue, isValidRole, normalizeRole } from '../constants/roles';

const SESSION_FLAG_KEY = 'optiload_session_active';

export interface User {
  id: string;
  name?: string;
  email?: string;
  role: RoleValue;
  organizationId: number | null;
  organization?: string;
  mfaEnabled?: boolean;
  demo_mode?: boolean;
}

interface AuthState {
  user: User | null;
  role: RoleValue | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  organization_name: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<string>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => Promise<void>;
  updateUserDemoMode: (enabled: boolean) => void;
}

function loadState(): AuthState {
  try {
    const userRaw = localStorage.getItem('optiload_user');
    const token = localStorage.getItem('optiload_access_token');
    const sessionActive = sessionStorage.getItem(SESSION_FLAG_KEY) === '1';
    if (!userRaw || (!token && !sessionActive)) {
      return { user: null, role: null, token: null, isAuthenticated: false };
    }

    const parsed = JSON.parse(userRaw) as User;
    const normalizedRole = normalizeRole(parsed.role);
    if (!normalizedRole) throw new Error('Invalid role in storage');

    const user = { ...parsed, role: normalizedRole };
    return { user, role: normalizedRole, token, isAuthenticated: true };
  } catch {
    localStorage.removeItem('optiload_user');
    localStorage.removeItem('optiload_access_token');
    sessionStorage.removeItem(SESSION_FLAG_KEY);
    return { user: null, role: null, token: null, isAuthenticated: false };
  }
}

async function fetchOrgName(): Promise<string | undefined> {
  try {
    const org = await apiRequest<{ name: string }>('/organization');
    return org?.name;
  } catch { return undefined; }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadState);

  useEffect(() => {
    let cancelled = false;
    const syncFromServer = async () => {
      const token = localStorage.getItem('optiload_access_token');
      const sessionActive = sessionStorage.getItem(SESSION_FLAG_KEY) === '1';
      if (token || !sessionActive) return;
      try {
        const me = await meRequest();
        if (cancelled) return;
        const normalizedRole = normalizeRole(me.role);
        if (!normalizedRole || !isValidRole(normalizedRole)) {
          sessionStorage.removeItem(SESSION_FLAG_KEY);
          localStorage.removeItem('optiload_user');
          setState({ user: null, role: null, token: null, isAuthenticated: false });
          return;
        }
        const orgName = await fetchOrgName();
        const user: User = {
          id: String(me.id),
          name: me.name,
          email: me.email,
          role: normalizedRole,
          organizationId: me.organization_id,
          organization: orgName,
          mfaEnabled: me.mfa_enabled,
          demo_mode: (me as any).demo_mode,
        };
        setState({
          user,
          role: normalizedRole,
          token: null,
          isAuthenticated: true,
        });
        localStorage.setItem('optiload_user', JSON.stringify(user));
      } catch {
        if (!cancelled) {
          sessionStorage.removeItem(SESSION_FLAG_KEY);
          localStorage.removeItem('optiload_user');
          setState({ user: null, role: null, token: null, isAuthenticated: false });
        }
      }
    };
    void syncFromServer();
    return () => {
      cancelled = true;
    };
  }, []);

  const setAuthenticatedState = async (
    incomingUser: {
      id: number;
      name?: string;
      email?: string;
      role: string;
      organization_id: number | null;
      mfa_enabled?: boolean;
      demo_mode?: boolean;
    },
    tokens?: { access?: string | null; refresh?: string | null },
  ) => {
    const normalizedRole = normalizeRole(incomingUser.role);
    if (!normalizedRole || !isValidRole(normalizedRole)) {
      throw new Error('Invalid role');
    }

    const user: User = {
      id: String(incomingUser.id),
      name: incomingUser.name,
      email: incomingUser.email,
      role: normalizedRole,
      organizationId: incomingUser.organization_id,
      organization: undefined,
      mfaEnabled: incomingUser.mfa_enabled,
      demo_mode: incomingUser.demo_mode,
    };

    // Fetch org name asynchronously
    const orgName = await fetchOrgName();
    if (orgName) user.organization = orgName;

    const access = tokens?.access;
    if (access) {
      localStorage.setItem('optiload_access_token', access);
    } else {
      localStorage.removeItem('optiload_access_token');
    }
    const refresh = tokens?.refresh;
    if (refresh) {
      localStorage.setItem('optiload_refresh_token', refresh);
    } else {
      localStorage.removeItem('optiload_refresh_token');
    }
    sessionStorage.setItem(SESSION_FLAG_KEY, '1');

    const nextState: AuthState = {
      user,
      role: normalizedRole,
      token: access ?? null,
      isAuthenticated: true,
    };

    setState(nextState);
    localStorage.setItem('optiload_user', JSON.stringify(user));

    return ROLE_REDIRECT[normalizedRole] ?? '/login';
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      /* session may already be invalid */
    }
    setState({ user: null, role: null, token: null, isAuthenticated: false });
    localStorage.removeItem('optiload_user');
    localStorage.removeItem('optiload_access_token');
    localStorage.removeItem('optiload_refresh_token');
    sessionStorage.removeItem(SESSION_FLAG_KEY);
  };

  const updateUserDemoMode = (enabled: boolean) => {
    setState(prev => {
      if (!prev.user) return prev;
      const updated = { ...prev.user, demo_mode: enabled };
      localStorage.setItem('optiload_user', JSON.stringify(updated));
      return { ...prev, user: updated };
    });
  };

  const login = async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    const loginUser = response.user;

    if (!loginUser || !loginUser.role) {
      await logout();
      throw new Error('Invalid user payload');
    }

    return setAuthenticatedState(loginUser, {
      access: response.access_token ?? null,
      refresh: response.refresh_token ?? null,
    });
  };

  const register = async (payload: RegisterPayload) => {
    const response = await registerRequest(payload);
    const user = response.user;

    if (!user || !user.role) {
      await logout();
      throw new Error('Invalid registration payload');
    }

    return setAuthenticatedState(user, {
      access: response.access_token ?? null,
      refresh: response.refresh_token ?? null,
    });
  };

  const value = useMemo(() => ({ ...state, login, register, logout, updateUserDemoMode }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function isSuperAdmin(user: User | null): boolean {
  return user?.role === ROLES.SUPER_ADMIN;
}

export function isAdminLevel(user: User | null): boolean {
  return !!user && [ROLES.ADMIN, ROLES.SUB_ADMIN].includes(user.role);
}
