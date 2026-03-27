import { Navigate } from 'react-router';
import type { ReactNode } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import type { RoleValue } from '../../constants/roles';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: RoleValue[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && (!role || !roles.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
