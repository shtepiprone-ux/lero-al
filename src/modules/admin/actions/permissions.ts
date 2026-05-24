'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { PERMISSION_KEYS, type PermissionKey } from '@/lib/auth/permissionKeys'

async function assertAdmin(): Promise<void> {
  const user = await getUser()
  if (!user) throw new Error('unauthenticated')
  const supabase = await createClient()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('forbidden')
}

export async function getModeratorPermissions(): Promise<Record<PermissionKey, boolean>> {
  const user = await getUser()
  if (!user) throw new Error('unauthenticated')

  const supabase = await createClient()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'moderator') throw new Error('forbidden')

  const { data } = await supabase
    .from('role_permissions')
    .select('permission_key, allowed')
    .eq('role', 'moderator')

  const result = Object.fromEntries(PERMISSION_KEYS.map(k => [k, false])) as Record<PermissionKey, boolean>
  for (const row of data ?? []) {
    if (PERMISSION_KEYS.includes(row.permission_key as PermissionKey)) {
      result[row.permission_key as PermissionKey] = row.allowed
    }
  }
  return result
}

export async function setModeratorPermission(
  key: PermissionKey,
  allowed: boolean,
): Promise<{ error?: string }> {
  await assertAdmin()

  const db = createAdminClient()
  const { error } = await db
    .from('role_permissions')
    .upsert(
      { role: 'moderator', permission_key: key, allowed, updated_at: new Date().toISOString() },
      { onConflict: 'role,permission_key' },
    )

  if (error) {
    console.error('setModeratorPermission failed', { error, key })
    return { error: 'save_failed' }
  }

  revalidatePath('/admin/permissions')
  return {}
}
