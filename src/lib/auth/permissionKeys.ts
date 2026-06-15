export const PERMISSION_KEYS = [
  'listings.delete',
  'listings.set_premium',
  'users.create',
  'users.change_role',
  'users.soft_delete',
  'users.hard_delete',
  'locations.manage',
  'settings.manage',
  'legal.manage',
  'reports.manage',
  'audit.clear_history',
] as const

export type PermissionKey = typeof PERMISSION_KEYS[number]
