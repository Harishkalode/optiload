import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  mfaEnabled: boolean;
}

export function isSuperAdmin(user: User | null): boolean {
  return user?.role === 'Super Admin';
}

export function isAdminLevel(user: User | null): boolean {
  return user?.role === 'Organization Owner' || user?.role === 'Admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('optiload_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string, role: UserRole) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newUser: User = {
      id: 'U-' + Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' '),
      email,
      role,
      organization: role === 'Super Admin' ? 'OptiLoad Platform' : 'RailCorp Inc.',
      mfaEnabled: true,
    };
    setUser(newUser);
    localStorage.setItem('optiload_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('optiload_user');
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