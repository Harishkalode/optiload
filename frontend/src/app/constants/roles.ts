export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SUB_ADMIN: 'SUB_ADMIN',
  OPERATOR: 'OPERATOR',
  VIEWER: 'VIEWER',
} as const;

export type RoleValue = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_REDIRECT: Record<RoleValue, string> = {
  [ROLES.SUPER_ADMIN]: '/super-admin/dashboard',
  [ROLES.ADMIN]: '/dashboard',
  [ROLES.SUB_ADMIN]: '/dashboard',
  [ROLES.OPERATOR]: '/dashboard',
  [ROLES.VIEWER]: '/dashboard',
};

const ROLE_ALIASES: Record<string, RoleValue> = {
  SUPER_ADMIN: ROLES.SUPER_ADMIN,
  SUPERADMIN: ROLES.SUPER_ADMIN,
  ADMIN: ROLES.ADMIN,
  ORGANIZATION_OWNER: ROLES.ADMIN,
  SUB_ADMIN: ROLES.SUB_ADMIN,
  SUBADMIN: ROLES.SUB_ADMIN,
  OPERATOR: ROLES.OPERATOR,
  VIEWER: ROLES.VIEWER,
};

export function normalizeRole(rawRole: string | null | undefined): RoleValue | null {
  if (!rawRole) return null;
  const normalized = rawRole.toUpperCase().replace(/\s+/g, '_');
  return ROLE_ALIASES[normalized] ?? null;
}

export function isValidRole(role: string | null | undefined): role is RoleValue {
  return !!role && Object.values(ROLES).includes(role as RoleValue);
}
