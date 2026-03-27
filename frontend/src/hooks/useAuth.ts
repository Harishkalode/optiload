import { useState } from 'react';
import { api } from '../services/api';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (email: string, password: string) => {
    const result = await api.get<{ access_token: string }>(`/auth/login?email=${email}&password=${password}`);
    localStorage.setItem('access_token', result.access_token);
    setUser({ id: 'temp', email, role: 'org_owner' });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return { user, login, logout };
};
