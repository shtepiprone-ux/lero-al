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
  'reports.status_override',
  'reports.delete',
  'audit.clear_history',
  // Task 923 R75: a key for EVERY action that admits a moderator. An administrator keeps every right; a moderator holds a key only when the administrator switched it on
  // (the release seeds one `role_permissions` row with `allowed = true` per new key, so today's behaviour is kept until the administrator changes it).
  'users.edit',
  'users.verify',
  'support.manage',
  'inquiries.manage',
  'catalog.manage',
  'email_templates.manage',
  'companies.manage',
  'listings.moderate',
] as const

export type PermissionKey = typeof PERMISSION_KEYS[number]
