import type { PermissionKey } from '@/lib/auth/permissionKeys'

/**
 * Task 1007 (owner decision O-P01, 2026-11-19): the admin pages a moderator can be given. Each page has one switch in the "Admin panel pages" section of "Permissions",
 * stored in the same `role_permissions` table as the action keys (`permission_key` is text with no list check) and read at every request, never cached.
 *
 * `ADMIN_PAGES` is in the sidebar's order. `labelKey` is the message of `admin.sidebar` the sidebar shows for the page; `paths` are the routes the key opens, the first one
 * being the sidebar item's address. Footer and Permissions are administrator-only (owner decision O1007-1) and are not in the list.
 * The page keys are plain constants: a client component reads them too, so this file imports nothing at run time.
 */
export const ADMIN_PAGES = [
  { key: 'page.dashboard', labelKey: 'item_dashboard', paths: ['/admin'] },
  { key: 'page.listings', labelKey: 'item_listings', paths: ['/admin/listings', '/admin/listings/[id]/preview'] },
  { key: 'page.users', labelKey: 'item_users', paths: ['/admin/users', '/admin/users/[id]', '/admin/users/new'] },
  { key: 'page.support', labelKey: 'item_support', paths: ['/admin/support'] },
  { key: 'page.inquiries_support', labelKey: 'item_inquiries_support', paths: ['/admin/inquiries/support', '/admin/inquiries'] },
  { key: 'page.inquiries_sales', labelKey: 'item_inquiries_sales', paths: ['/admin/inquiries/sales'] },
  { key: 'page.reports', labelKey: 'item_reports', paths: ['/admin/reports'] },
  { key: 'page.locations', labelKey: 'item_locations', paths: ['/admin/locations'] },
  { key: 'page.popular_locations', labelKey: 'item_popular_locations', paths: ['/admin/popular-locations'] },
  { key: 'page.companies', labelKey: 'item_companies', paths: ['/admin/companies'] },
  { key: 'page.pages', labelKey: 'item_pages', paths: ['/admin/pages', '/admin/legal'] },
  { key: 'page.property_types', labelKey: 'item_property_types', paths: ['/admin/property-types'] },
  { key: 'page.currency', labelKey: 'item_currency', paths: ['/admin/currency'] },
  { key: 'page.email_templates', labelKey: 'item_email_templates', paths: ['/admin/email-templates'] },
  { key: 'page.settings', labelKey: 'item_settings', paths: ['/admin/settings'] },
] as const

export type AdminPageKey = typeof ADMIN_PAGES[number]['key']

export const ADMIN_PAGE_KEYS: readonly AdminPageKey[] = ADMIN_PAGES.map((page) => page.key)

/** the one key type every permission check takes: an action key or a page key */
export type AccessKey = PermissionKey | AdminPageKey

/** the sidebar items only an administrator sees (owner decision O1007-1): their pages answer a moderator with `notFound()` */
export const ADMIN_ONLY_PATHS = ['/admin/footer', '/admin/permissions'] as const

/**
 * The sidebar addresses to show: the first path of each page key given, in the sidebar's order, and for an administrator the administrator-only items too.
 * Display only: every page and every loader checks its own key.
 */
export function adminSidebarPaths(keys: readonly AdminPageKey[], isAdmin: boolean): string[] {
  const shown = ADMIN_PAGES.filter((page) => keys.includes(page.key)).map((page) => page.paths[0] as string)
  return isAdmin ? [...shown, ...ADMIN_ONLY_PATHS] : shown
}
