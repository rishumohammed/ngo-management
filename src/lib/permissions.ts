import { UserRole } from '@prisma/client'

// Permission definitions per role per module
export const PERMISSIONS = {
  members: {
    SUPER_ADMIN: ['read', 'create', 'update', 'delete'],
    PROGRAM_ADMIN: ['read', 'create', 'update', 'delete'],
    FINANCE_ADMIN: ['read'],
    COMMITTEE_SECRETARY: ['read'],
    DATA_ENTRY_STAFF: ['read', 'create', 'update'],
    AUDITOR: ['read'],
    VOLUNTEER: [],
  },
  volunteers: {
    SUPER_ADMIN: ['read', 'create', 'update', 'delete'],
    PROGRAM_ADMIN: ['read', 'create', 'update', 'delete'],
    FINANCE_ADMIN: ['read'],
    COMMITTEE_SECRETARY: ['read'],
    DATA_ENTRY_STAFF: ['read', 'create', 'update'],
    AUDITOR: ['read'],
    VOLUNTEER: ['read_own', 'update_own'],
  },
  donations: {
    SUPER_ADMIN: ['read', 'create', 'update', 'delete'],
    PROGRAM_ADMIN: ['read'],
    FINANCE_ADMIN: ['read', 'create', 'update', 'delete'],
    COMMITTEE_SECRETARY: ['read'],
    DATA_ENTRY_STAFF: [],
    AUDITOR: ['read'],
    VOLUNTEER: [],
  },
  minutes: {
    SUPER_ADMIN: ['read', 'create', 'update', 'delete'],
    PROGRAM_ADMIN: ['read', 'create', 'update'],
    FINANCE_ADMIN: ['read'],
    COMMITTEE_SECRETARY: ['read', 'create', 'update', 'delete'],
    DATA_ENTRY_STAFF: [],
    AUDITOR: ['read'],
    VOLUNTEER: [],
  },
  committees: {
    SUPER_ADMIN: ['read', 'create', 'update', 'delete'],
    PROGRAM_ADMIN: ['read', 'create', 'update', 'delete'],
    FINANCE_ADMIN: ['read'],
    COMMITTEE_SECRETARY: ['read'],
    DATA_ENTRY_STAFF: [],
    AUDITOR: ['read'],
    VOLUNTEER: [],
  },
  events: {
    SUPER_ADMIN: ['read', 'create', 'update', 'delete'],
    PROGRAM_ADMIN: ['read', 'create', 'update', 'delete'],
    FINANCE_ADMIN: ['read'],
    COMMITTEE_SECRETARY: ['read'],
    DATA_ENTRY_STAFF: [],
    AUDITOR: ['read'],
    VOLUNTEER: ['read_assigned'],
  },
  settings: {
    SUPER_ADMIN: ['read', 'create', 'update', 'delete'],
    PROGRAM_ADMIN: [],
    FINANCE_ADMIN: [],
    COMMITTEE_SECRETARY: [],
    DATA_ENTRY_STAFF: [],
    AUDITOR: [],
    VOLUNTEER: [],
  },
  audit: {
    SUPER_ADMIN: ['read'],
    PROGRAM_ADMIN: [],
    FINANCE_ADMIN: [],
    COMMITTEE_SECRETARY: [],
    DATA_ENTRY_STAFF: [],
    AUDITOR: ['read'],
    VOLUNTEER: [],
  },
  users: {
    SUPER_ADMIN: ['read', 'create', 'update', 'delete'],
    PROGRAM_ADMIN: [],
    FINANCE_ADMIN: [],
    COMMITTEE_SECRETARY: [],
    DATA_ENTRY_STAFF: [],
    AUDITOR: [],
    VOLUNTEER: [],
  },
} as const

type Module = keyof typeof PERMISSIONS
type Permission = 'read' | 'create' | 'update' | 'delete' | 'read_own' | 'update_own' | 'read_assigned'

export function can(
  role: UserRole | string,
  module: Module,
  permission: Permission
): boolean {
  const perms = PERMISSIONS[module][role as UserRole] as readonly string[]
  return perms?.includes(permission) ?? false
}

export const ADMIN_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'PROGRAM_ADMIN',
  'FINANCE_ADMIN',
  'COMMITTEE_SECRETARY',
  'DATA_ENTRY_STAFF',
  'AUDITOR',
]

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as UserRole)
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  PROGRAM_ADMIN: 'Program Admin',
  FINANCE_ADMIN: 'Finance Admin',
  COMMITTEE_SECRETARY: 'Committee Secretary',
  DATA_ENTRY_STAFF: 'Data Entry Staff',
  AUDITOR: 'Auditor',
  VOLUNTEER: 'Volunteer',
}
