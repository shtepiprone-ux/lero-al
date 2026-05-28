'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { PERMISSION_KEYS, type PermissionKey } from '@/lib/auth/permissionKeys'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface PermissionData {
  allowed: boolean
  updated_at: string | null
  updated_by_name: string | null
}

export interface PermissionEvent {
  id: string
  role: string
  permission_key: string
  old_allowed: boolean | null
  new_allowed: boolean
  actor_user_id: string | null
  actor_name: string | null
  created_at: string
}

export type SetPermissionResult =
  | { error?: string; noOp?: never; direction?: never }
  | { noOp: true; direction: 'grant' | 'revoke'; error?: never }

// ── Internal helpers ──────────────────────────────────────────────────────────

async function getAdminUserId(): Promise<string | null> {
  const user = await getUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user.id : null
}

// ── Public actions ────────────────────────────────────────────────────────────

export async function getModeratorPermissions(): Promise<Record<PermissionKey, PermissionData>> {
  const user = await getUser()
  if (!user) throw new Error('unauthenticated')

  const supabase = await createClient()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'moderator') throw new Error('forbidden')

  const { data: rows } = await supabase
    .from('role_permissions')
    .select('permission_key, allowed, updated_at, updated_by_user_id')
    .eq('role', 'moderator')

  // Batch-resolve actor names for rows that have updated_by_user_id
  const actorIds = [
    ...new Set(
      (rows ?? [])
        .map(r => r.updated_by_user_id)
        .filter((id): id is string => id !== null),
    ),
  ]
  const actorNames: Record<string, string> = {}
  if (actorIds.length > 0) {
    // Use admin client — session client can only self-read after Task 266 users_self_read policy.
    const adminDb = createAdminClient()
    const { data: actors } = await adminDb.from('users').select('id, name').in('id', actorIds)
    for (const a of actors ?? []) {
      actorNames[a.id] = a.name ?? ''
    }
  }

  const result = Object.fromEntries(
    PERMISSION_KEYS.map(k => [k, { allowed: false, updated_at: null, updated_by_name: null }]),
  ) as Record<PermissionKey, PermissionData>

  for (const row of rows ?? []) {
    if (PERMISSION_KEYS.includes(row.permission_key as PermissionKey)) {
      const key = row.permission_key as PermissionKey
      result[key] = {
        allowed: row.allowed,
        updated_at: row.updated_at ?? null,
        updated_by_name: row.updated_by_user_id
          ? (actorNames[row.updated_by_user_id] ?? null)
          : null,
      }
    }
  }
  return result
}

export async function getPermissionEvents(limit = 20): Promise<PermissionEvent[] | null> {
  try {
    const user = await getUser()
    if (!user) return null

    const supabase = await createClient()
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin' && profile?.role !== 'moderator') return null

    const db = createAdminClient()
    const { data: events, error } = await db
      .from('role_permission_events')
      .select('id, role, permission_key, old_allowed, new_allowed, actor_user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return null

    const actorIds = [
      ...new Set(
        (events ?? [])
          .map(e => e.actor_user_id)
          .filter((id): id is string => id !== null),
      ),
    ]
    const actorNames: Record<string, string> = {}
    if (actorIds.length > 0) {
      const { data: actors } = await db.from('users').select('id, name').in('id', actorIds)
      for (const a of actors ?? []) {
        actorNames[a.id] = a.name ?? ''
      }
    }

    return (events ?? []).map(e => ({
      id: e.id,
      role: e.role,
      permission_key: e.permission_key,
      old_allowed: e.old_allowed ?? null,
      new_allowed: e.new_allowed,
      actor_user_id: e.actor_user_id ?? null,
      actor_name: e.actor_user_id ? (actorNames[e.actor_user_id] ?? null) : null,
      created_at: e.created_at,
    }))
  } catch {
    return null // Non-fatal — audit log unavailable
  }
}

export async function setModeratorPermission(
  key: PermissionKey,
  value: boolean,
): Promise<SetPermissionResult> {
  try {
    const adminUserId = await getAdminUserId()
    if (!adminUserId) return { error: 'forbidden' }

    const db = createAdminClient()

    // Read current value for no-op detection and old_allowed audit field
    const { data: current } = await db
      .from('role_permissions')
      .select('allowed')
      .eq('role', 'moderator')
      .eq('permission_key', key)
      .maybeSingle()

    // No-op: DB already has the requested value (concurrent edit scenario)
    if (current !== null && current.allowed === value) {
      return { noOp: true, direction: value ? 'grant' : 'revoke' }
    }

    const oldAllowed = current?.allowed ?? null

    // Upsert permission row (updated_at set by server action — not a trigger)
    const { error: upsertError } = await db.from('role_permissions').upsert(
      {
        role: 'moderator',
        permission_key: key,
        allowed: value,
        updated_at: new Date().toISOString(),
        updated_by_user_id: adminUserId,
      },
      { onConflict: 'role,permission_key' },
    )

    if (upsertError) {
      console.error('setModeratorPermission upsert failed', { error: upsertError, key })
      return { error: 'save_failed' }
    }

    // Insert audit event — non-fatal if it fails (permission change already committed)
    const { error: eventError } = await db.from('role_permission_events').insert({
      role: 'moderator',
      permission_key: key,
      old_allowed: oldAllowed,
      new_allowed: value,
      actor_user_id: adminUserId,
    })

    if (eventError) {
      console.error('setModeratorPermission event insert failed', { error: eventError, key })
    }

    revalidatePath('/admin/permissions')
    return {}
  } catch (err) {
    console.error('setModeratorPermission unexpected error', err)
    return { error: 'save_failed' }
  }
}
