import { createAdminClient } from '@/lib/supabase/admin'
import { requireViewer } from '@/lib/auth/requireViewer'
import { ADMIN_PAGES, ADMIN_PAGE_KEYS, type AccessKey, type AdminPageKey } from '@/lib/auth/adminPages'

// Admin always has full access. Non-moderator non-admin roles are denied.
// The moderator branch reads role_permissions through the admin client: `authenticated` has no
// SELECT grant on this table (Task 275), so a user-scoped read always fails closed with 42501.
export async function roleHasPermission(role: string, key: AccessKey): Promise<boolean> {
  if (role === 'admin') return true
  if (role !== 'moderator') return false

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('role_permissions')
      .select('allowed')
      .eq('role', 'moderator')
      .eq('permission_key', key)
      .maybeSingle()

    if (error) {
      console.error('[permissions] role_permissions read failed', { key, code: error.code })
      return false
    }

    return data?.allowed ?? false
  } catch {
    console.error('[permissions] role_permissions read failed', { key, code: 'exception' })
    return false
  }
}

export async function hasPermission(key: AccessKey): Promise<boolean> {
  // The role comes from requireViewer() (Task 923 R44): a blocked, deactivated, deleted or missing account of any role has no permission,
  // and a failed lookup is no permission either.
  const viewer = await requireViewer()
  if (!viewer.ok || !viewer.role) return false
  return roleHasPermission(viewer.role, key)
}

export async function assertPermission(key: AccessKey): Promise<void> {
  if (!(await hasPermission(key))) throw new Error('forbidden')
}

/**
 * The admin pages a role may open (Task 1007): the ONE read the admin layout (the sidebar) and the `/admin` landing use, so the two never disagree.
 * An administrator holds every page; a moderator only the page keys the administrator switched on, in the order of `ADMIN_PAGES`, from one `role_permissions` select;
 * any other role, a read that fails and a read that throws give no page (fail closed). Display and routing only: every page and loader checks its own key.
 */
export async function allowedAdminPageKeys(role: string): Promise<AdminPageKey[]> {
  if (role === 'admin') return ADMIN_PAGES.map((page) => page.key)
  if (role !== 'moderator') return []

  try {
    const { data, error } = await createAdminClient()
      .from('role_permissions')
      .select('permission_key')
      .eq('role', 'moderator')
      .eq('allowed', true)
      .in('permission_key', [...ADMIN_PAGE_KEYS])

    if (error || !data) {
      console.error('[permissions] allowedAdminPageKeys read failed', { code: error?.code ?? 'no_data' })
      return []
    }

    const on = new Set(data.map((row) => row.permission_key))
    return ADMIN_PAGES.filter((page) => on.has(page.key)).map((page) => page.key)
  } catch {
    console.error('[permissions] allowedAdminPageKeys read failed', { code: 'exception' })
    return []
  }
}
