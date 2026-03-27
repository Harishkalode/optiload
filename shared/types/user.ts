export type UserRole =
  | 'super_admin'
  | 'org_owner'
  | 'admin'
  | 'operations_manager'
  | 'viewer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
  lastLogin?: string;
}
