import { createAdminClient } from '@/lib/supabase/admin'
import { requireViewer } from '@/lib/auth/requireViewer'
import type { PermissionKey } from '@/lib/auth/permissionKeys'

// Admin always has full access. Non-moderator non-admin roles are denied.
// The moderator branch reads role_permissions through the admin client: `authenticated` has no
// SELECT grant on this table (Task 275), so a user-scoped read always fails closed with 42501.
export async function roleHasPermission(role: string, key: PermissionKey): Promise<boolean> {
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

export async function hasPermission(key: PermissionKey): Promise<boolean> {
  // The role comes from requireViewer() (Task 923 R44): a blocked, deactivated, deleted or missing account of any role has no permission,
  // and a failed lookup is no permission either.
  const viewer = await requireViewer()
  if (!viewer.ok || !viewer.role) return false
  return roleHasPermission(viewer.role, key)
}

export async function assertPermission(key: PermissionKey): Promise<void> {
  if (!(await hasPermission(key))) throw new Error('forbidden')
}
