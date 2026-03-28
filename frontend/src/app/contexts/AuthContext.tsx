import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { loginRequest, registerRequest } from '../services/authService';
import { ROLE_REDIRECT, ROLES, type RoleValue, isValidRole, normalizeRole } from '../constants/roles';

export interface User {
  id: string;
  name?: string;
  email?: string;
  role: RoleValue;
  organizationId: number | null;
  mfaEnabled?: boolean;
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
  logout: () => void;
}

function loadState(): AuthState {
  try {
    const userRaw = localStorage.getItem('optiload_user');
    const token = localStorage.getItem('optiload_access_token');
    if (!userRaw || !token) return { user: null, role: null, token: null, isAuthenticated: false };

    const parsed = JSON.parse(userRaw) as User;
    const normalizedRole = normalizeRole(parsed.role);
    if (!normalizedRole) throw new Error('Invalid role in storage');

    const user = { ...parsed, role: normalizedRole };
    return { user, role: normalizedRole, token, isAuthenticated: true };
  } catch {
    localStorage.removeItem('optiload_user');
    localStorage.removeItem('optiload_access_token');
    return { user: null, role: null, token: null, isAuthenticated: false };
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadState);

  const setAuthenticatedState = (token: string, incomingUser: { id: number; name?: string; email?: string; role: string; organization_id: number | null; mfa_enabled?: boolean }) => {
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
      mfaEnabled: incomingUser.mfa_enabled,
    };

    const nextState: AuthState = {
      user,
      role: normalizedRole,
      token,
      isAuthenticated: true,
    };

    setState(nextState);
    localStorage.setItem('optiload_user', JSON.stringify(user));
    localStorage.setItem('optiload_access_token', token);

    return ROLE_REDIRECT[normalizedRole] ?? '/login';
  };

  const logout = () => {
    setState({ user: null, role: null, token: null, isAuthenticated: false });
    localStorage.removeItem('optiload_user');
    localStorage.removeItem('optiload_access_token');
  };

  const login = async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    const loginUser = response.user;

    if (!loginUser || !loginUser.role) {
      logout();
      throw new Error('Invalid user payload');
    }

    return setAuthenticatedState(response.access_token, loginUser);
  };

  const register = async (payload: RegisterPayload) => {
    const response = await registerRequest(payload);
    const user = response.user;

    if (!user || !user.role) {
      logout();
      throw new Error('Invalid registration payload');
    }

    return setAuthenticatedState(response.access_token, user);
  };

  const value = useMemo(() => ({ ...state, login, register, logout }), [state]);

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
