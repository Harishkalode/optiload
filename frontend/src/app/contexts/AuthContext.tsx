import React, { createContext, useContext, useState, ReactNode } from 'react';

import { loginRequest } from '../services/authService';

export type UserRole =
  | 'Super Admin'
  | 'Organization Owner'
  | 'Admin'
  | 'Sub-Admin'
  | 'Operations Manager'
  | 'Rail Planner'
  | 'Compliance Officer'
  | 'Yard Supervisor'
  | 'Loader Operator'
  | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  organizationId: number | null;
  mfaEnabled: boolean;
}

function mapBackendRole(role: string): UserRole {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'sub_admin':
      return 'Sub-Admin';
    default:
      return 'Viewer';
  }
}

function loadStoredUser(): User | null {
  try {
    const stored = localStorage.getItem('optiload_user');
    if (!stored) return null;
    return JSON.parse(stored) as User;
  } catch (error) {
    console.warn('Failed to parse stored user. Clearing invalid auth payload.', error);
    localStorage.removeItem('optiload_user');
    localStorage.removeItem('optiload_access_token');
    return null;
  }
}

export function isSuperAdmin(user: User | null): boolean {
  return user?.role === 'Super Admin';
}

export function isAdminLevel(user: User | null): boolean {
  return user?.role === 'Organization Owner' || user?.role === 'Admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);

  const login = async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    const newUser: User = {
      id: String(response.user.id),
      name: response.user.name,
      email: response.user.email,
      role: mapBackendRole(response.role),
      organization: response.organization_id ? `Organization-${response.organization_id}` : 'OptiLoad Platform',
      organizationId: response.organization_id,
      mfaEnabled: response.user.mfa_enabled,
    };

    setUser(newUser);
    localStorage.setItem('optiload_user', JSON.stringify(newUser));
    localStorage.setItem('optiload_access_token', response.access_token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('optiload_user');
    localStorage.removeItem('optiload_access_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
