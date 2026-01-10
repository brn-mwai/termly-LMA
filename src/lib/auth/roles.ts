// Role-Based Access Control (RBAC) System

export type Role = 'admin' | 'manager' | 'analyst' | 'viewer';

export type Permission =
  | 'loans:read'
  | 'loans:write'
  | 'loans:delete'
  | 'documents:read'
  | 'documents:write'
  | 'documents:delete'
  | 'covenants:read'
  | 'covenants:write'
  | 'covenants:delete'
  | 'covenants:test'
  | 'memos:read'
  | 'memos:write'
  | 'memos:delete'
  | 'alerts:read'
  | 'alerts:acknowledge'
  | 'settings:read'
  | 'settings:write'
  | 'users:read'
  | 'users:write'
  | 'users:invite'
  | 'analytics:read'
  | 'audit:read';

// Define permissions for each role
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'loans:read', 'loans:write', 'loans:delete',
    'documents:read', 'documents:write', 'documents:delete',
    'covenants:read', 'covenants:write', 'covenants:delete', 'covenants:test',
    'memos:read', 'memos:write', 'memos:delete',
    'alerts:read', 'alerts:acknowledge',
    'settings:read', 'settings:write',
    'users:read', 'users:write', 'users:invite',
    'analytics:read',
    'audit:read',
  ],
  manager: [
    'loans:read', 'loans:write',
    'documents:read', 'documents:write',
    'covenants:read', 'covenants:write', 'covenants:test',
    'memos:read', 'memos:write',
    'alerts:read', 'alerts:acknowledge',
    'settings:read',
    'users:read', 'users:invite',
    'analytics:read',
    'audit:read',
  ],
  analyst: [
    'loans:read', 'loans:write',
    'documents:read', 'documents:write',
    'covenants:read', 'covenants:write', 'covenants:test',
    'memos:read', 'memos:write',
    'alerts:read', 'alerts:acknowledge',
    'analytics:read',
    'audit:read',
  ],
  viewer: [
    'loans:read',
    'documents:read',
    'covenants:read',
    'memos:read',
    'alerts:read',
    'analytics:read',
  ],
};

// Role hierarchy (higher roles inherit lower role permissions)
const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 4,
  manager: 3,
  analyst: 2,
  viewer: 1,
};

export function hasPermission(role: Role | string, permission: Permission): boolean {
  const validRole = isValidRole(role) ? role : 'viewer';
  const rolePermissions = ROLE_PERMISSIONS[validRole];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(role: Role | string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

export function hasAllPermissions(role: Role | string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

export function isValidRole(role: string): role is Role {
  return ['admin', 'manager', 'analyst', 'viewer'].includes(role);
}

export function getRoleLevel(role: Role | string): number {
  if (!isValidRole(role)) return 0;
  return ROLE_HIERARCHY[role];
}

export function canAssignRole(currentRole: Role, targetRole: Role): boolean {
  // Can only assign roles equal to or lower than current role
  // But admins can assign any role
  if (currentRole === 'admin') return true;
  return ROLE_HIERARCHY[currentRole] > ROLE_HIERARCHY[targetRole];
}

export function getPermissionsForRole(role: Role | string): Permission[] {
  const validRole = isValidRole(role) ? role : 'viewer';
  return [...ROLE_PERMISSIONS[validRole]];
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  analyst: 'Analyst',
  viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Full access to all features including user management and settings',
  manager: 'Can manage loans, documents, and invite users but cannot change settings',
  analyst: 'Can work with loans, documents, covenants and create memos',
  viewer: 'Read-only access to view loans and documents',
};
