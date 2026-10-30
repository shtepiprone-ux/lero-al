import 'server-only'

import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireViewer } from '@/lib/auth/requireViewer'
import { hasPermission } from '@/lib/auth/permissions'
import type { PermissionKey } from '@/lib/auth/permissionKeys'

/**
 * The signed-in person's staff role (`admin` or `moderator`), or null for an anonymous visitor, a plain user and an agent.
 * One place for the check the admin routes and actions need (Task 923 Revision 7, findings S3 / S4: two upload routes had no check at all).
 * The role comes from `requireViewer()` (Task 923 R44, owner decisions D25-D27): it is read with the service-role client by the SESSION's user id, so
 * it cannot be spoofed by anything the caller sends, and a blocked, deactivated, deleted or missing account of any role is null, not staff.
 * A failed lookup is null too: staff powers are never granted when the account cannot be established.
 */
export type StaffRole = 'admin' | 'moderator'

export async function getStaffRole(): Promise<StaffRole | null> {
  const staff = await checkStaff()
  return staff.ok ? staff.role : null
}

/**
 * THE staff guard (Task 923 R71 (k)): one decision, in one place, for every Server Action and route that is for staff. It replaces the local copies that each
 * action file kept (nine of them, each with its own idea of what a failed lookup means). The caller keeps its own answer shape and maps `reason` to it:
 *  - `unauthenticated`: no session, or an account without access (blocked, deactivated, deleted, no profile row): sign in again;
 *  - `forbidden`: a signed-in account of another role, or a lookup that failed (a failed lookup grants nothing).
 * `adminOnly` narrows it to administrators. `permission` (Task 923 R75) additionally requires the key: an administrator holds every key, a moderator only the keys the
 * administrator switched on, read at THIS check (never cached), and a failed read is no permission. The role comes from `requireViewer()` (Task 923 R44).
 */
export type StaffCheck =
  | { ok: true; userId: string; role: StaffRole }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' }

export async function checkStaff(options: { adminOnly?: boolean; permission?: PermissionKey } = {}): Promise<StaffCheck> {
  const viewer = await requireViewer()
  if (!viewer.ok) return { ok: false, reason: viewer.reason === 'lookup_failed' ? 'forbidden' : 'unauthenticated' }
  const allowed = options.adminOnly ? viewer.role === 'admin' : viewer.role === 'admin' || viewer.role === 'moderator'
  if (!allowed) return { ok: false, reason: 'forbidden' }
  // an administrator holds every key; a moderator's key is read NOW, from the table, at every check (Task 923 R75 (g): never cached)
  if (options.permission && viewer.role !== 'admin' && !(await hasPermission(options.permission).catch(() => false))) return { ok: false, reason: 'forbidden' }
  return { ok: true, userId: viewer.userId, role: viewer.role as StaffRole }
}

/**
 * Rank check for a staff action on another account (Task 923 Revision 7, finding S44; R66 (a), (o)). An administrator account can only be acted on, or created, by an
 * administrator: a moderator who holds a permission such as "delete users" must not be able to block, delete or re-picture an administrator.
 *
 * Fails closed: a failed read, or no row for the target, means the target's rank is unknown, and an unknown rank is no permission (`allowed: false`). `targetFound` tells
 * "no such account" (a caller may answer 404) apart from "refused"; `readFailed` marks a database error (a caller answers 403, never 404). `actorRole` is the acting
 * account's own role from the same read, or null when it has no row.
 */
export interface RankCheck {
  allowed: boolean
  actorRole: string | null
  targetFound: boolean
  readFailed: boolean
}

export async function checkActorRank(actorId: string, targetId: string): Promise<RankCheck> {
  const { data, error } = await createAdminClient().from('users').select('id, role').in('id', [actorId, targetId])
  if (error || !data) return { allowed: false, actorRole: null, targetFound: false, readFailed: true }
  const roleOf = (id: string) => data.find((r) => r.id === id)?.role ?? null
  const targetRole = roleOf(targetId)
  const actorRole = roleOf(actorId)
  if (!targetRole) return { allowed: false, actorRole, targetFound: false, readFailed: false }
  return { allowed: targetRole !== 'admin' || actorRole === 'admin', actorRole, targetFound: true, readFailed: false }
}

/**
 * The first await of every admin page and of every admin `generateMetadata` (Task 923 R68 (a)).
 *
 * The admin layout checks the viewer, but a layout is NOT a guard for the page below it: a React Server Components request whose router-state header already names
 * the layout makes Next.js render the page alone, so the page's reads run for anyone who sends that header. Every page therefore checks the viewer itself, BEFORE its
 * first read of any kind (a service-role read, an Auth admin read, a permission lookup): a guest is sent to the sign-in page, and anyone who is not an active
 * administrator or moderator (a plain user, an agent, a blocked, deactivated or deleted staff account, a failed lookup) gets `notFound()`. It never returns for them.
 * A page that is gated by a permission key checks its key AFTER this call.
 */
const ADMIN_LOCALES = ['sq', 'en', 'uk', 'it'] as const
const ADMIN_LOCALE_COOKIE = 'admin-locale'
const ADMIN_LOCALE_DEFAULT = 'en'

export async function requireStaffPage(): Promise<{ userId: string; role: StaffRole }> {
  const viewer = await requireViewer()
  if (!viewer.ok) {
    if (viewer.reason === 'unauthenticated') {
      const raw = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value
      const locale = (ADMIN_LOCALES as readonly string[]).includes(raw ?? '') ? raw : ADMIN_LOCALE_DEFAULT
      redirect(`/${locale}/auth/login?next=${encodeURIComponent('/admin')}&session=lost`)
    }
    notFound()
  }
  if (viewer.role !== 'admin' && viewer.role !== 'moderator') notFound()
  return { userId: viewer.userId, role: viewer.role }
}
