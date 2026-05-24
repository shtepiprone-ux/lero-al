import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import type { PermissionKey } from '@/lib/auth/permissionKeys'

// Admin always has full access. Non-moderator non-admin roles are denied.
export async function roleHasPermission(role: string, key: PermissionKey): Promise<boolean> {
  if (role === 'admin') return true
  if (role !== 'moderator') return false

  const supabase = await createClient()
  const { data } = await supabase
    .from('role_permissions')
    .select('allowed')
    .eq('role', 'moderator')
    .eq('permission_key', key)
    .single()

  return data?.allowed ?? false
}

export async function hasPermission(key: PermissionKey): Promise<boolean> {
  const user = await getUser()
  if (!user) return false

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return false
  return roleHasPermission(profile.role as string, key)
}

export async function assertPermission(key: PermissionKey): Promise<void> {
  if (!(await hasPermission(key))) throw new Error('forbidden')
}
