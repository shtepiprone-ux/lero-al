// @vitest-environment node
/**
 * Task 923 R44 (owner decisions D25, D26, D27): staff power goes with a LIVE account, whatever the role. Every guard of `role-guard-inventory.json` that decides by the
 * caller's role takes it from `requireViewer()`, so a blocked, suspended, deactivated, deleted or missing account of an administrator or a moderator gets no staff answer,
 * and nothing is read, written or sent for them beyond the caller's own row. The REAL guards run (`getStaffRole`, `hasPermission`, `assertPermission` and the local
 * guards inside the actions); only the database, `getUser` and the side-effect senders are doubles. The control cases prove an active staff member still gets
 * exactly today's answer, so the refusals do not pass for another reason.
 */
import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

type Row = { role: string; status: string; suspended_until: string | null; deleted_at: string | null }
const env = vi.hoisted(() => ({
  user: null as null | { id: string },
  row: null as null | Record<string, unknown>,
  readFails: false,
  data: [] as string[],
  effects: [] as string[],
}))

vi.mock('@/lib/auth/server', () => ({ getUser: async () => env.user, resolveSession: async () => ({ user: env.user }), getSession: async () => null }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => { throw new Error('the session client must not decide a role') } }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== 'users') env.data.push(table)
      const chain: Record<string, unknown> = {}
      for (const m of ['select', 'eq', 'neq', 'in', 'is', 'not', 'or', 'ilike', 'order', 'limit', 'range']) chain[m] = () => chain
      // a write to the users table is a data access too (the caller's own row is only ever READ)
      for (const m of ['insert', 'update', 'upsert', 'delete']) chain[m] = () => { if (table === 'users') env.data.push('users:write'); return chain }
      const rowFor = () => {
        if (table === 'users') {
          if (env.readFails) throw new Error('database down')
          return env.row
        }
        return table === 'role_permissions' ? { allowed: true } : null
      }
      // Task 923 R66 (a): the rank read (`users` .in('id', [actor, target])) answers one row per id, with the role of the signed-in row, because the rank check now refuses an
      // empty answer (it used to count "no row" as "not an administrator")
      let rankIds: string[] | null = null
      chain.in = (_column: string, ids: unknown) => { rankIds = Array.isArray(ids) ? (ids as string[]) : null; return chain }
      chain.single = async () => { const r = rowFor(); return { data: r, error: r ? null : { message: 'no row', code: 'PGRST116' } } }
      chain.maybeSingle = async () => ({ data: rowFor(), error: null })
      chain.then = (resolve: (v: unknown) => void) => resolve(table === 'users' && rankIds ? { data: rankIds.map((id) => ({ id, role: env.row?.role ?? null })), error: null } : { data: [], error: null, count: 0 })
      return chain
    },
    rpc: async (name: string) => { env.data.push(`rpc:${name}`); return { data: null, error: null } },
    auth: { admin: new Proxy({}, { get: (_t, name: string) => async () => { env.effects.push(`auth.admin.${name}`); return { data: { user: { id: 'u' }, users: [] }, error: null } } }) },
  }),
}))
vi.mock('next/cache', () => ({ revalidatePath: () => { env.effects.push('revalidate') }, revalidateTag: () => { env.effects.push('revalidate') }, unstable_cache: (fn: unknown) => fn }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, getAll: () => [] }), headers: async () => ({ get: () => null }) }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => { env.effects.push('notification') } }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => { env.effects.push('listing-transition'); return { ok: true } } }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: async () => { env.effects.push('cloudinary') } }))
vi.mock('@/lib/cloudinaryUpload', () => ({ uploadToCloudinary: async () => { env.effects.push('upload'); return { url: 'https://example.com/a.jpg' } }, publicIdFromUrl: () => null }))
vi.mock('@/modules/notifications/lib/emails/send', () => ({ sendEmail: async () => { env.effects.push('email'); return { id: 'x' } } }))
vi.mock('@/modules/notifications/lib/sendTemplatedEmail', () => ({ sendTemplatedEmail: async () => { env.effects.push('email') } }))

import { getStaffRole } from '@/lib/auth/staff'
import { hasPermission, assertPermission } from '@/lib/auth/permissions'
import { getAllCurrenciesAdmin } from '@/modules/admin/actions/currencies'
import { getAllFooterContent } from '@/modules/admin/actions/footer'
import { updateInquiryStatus } from '@/modules/contacts/actions'
import { updateCompanyAction } from '@/modules/companies/actions'
import { setLocationFeatured } from '@/modules/locations/actions/popularLocationActions'
import { upsertEmailTemplateAction } from '@/modules/notifications/actions/emailTemplates'
import { updateListingStatus, updateUserProfileFull } from '@/modules/admin/actions'
import { setModeratorPermission } from '@/modules/admin/actions/permissions'
import { changeListingStatusAction } from '@/modules/listings/actions/changeListingStatus'
import { POST as uploadAvatar } from '@/app/api/upload-avatar/route'

const ID = '3f2b1c0e-8a4d-4e6f-9b1a-2c3d4e5f6a7b'
const future = () => new Date(Date.now() + 3_600_000).toISOString()
const past = () => new Date(Date.now() - 3_600_000).toISOString()
const live = (role: string, extra: Partial<Row> = {}): Row => ({ role, status: 'active', suspended_until: null, deleted_at: null, ...extra })

interface Guard {
  name: string
  /** the roles that get the staff answer from this guard today */
  staff: ('admin' | 'moderator')[]
  call: () => Promise<unknown>
  /** the guard's existing refusal for this answer */
  refused: (answer: unknown) => boolean
  /** the table (or effect) a staff answer reaches */
  reaches: string
}
const safe = async (fn: () => Promise<unknown>): Promise<unknown> => { try { return await fn() } catch (e) { return { threw: (e as Error).message } } }
const isErr = (...codes: string[]) => (a: unknown) => codes.includes((a as { error?: string })?.error ?? '')
const upload = () => uploadAvatar(new NextRequest('http://localhost/api/upload-avatar', { method: 'POST', body: new FormData() }))

const GUARDS: Guard[] = [
  { name: 'getStaffRole', staff: ['admin', 'moderator'], call: () => getStaffRole(), refused: (a) => a === null, reaches: '' },
  { name: 'hasPermission', staff: ['admin', 'moderator'], call: () => hasPermission('listings.delete'), refused: (a) => a === false, reaches: '' },
  { name: 'assertPermission', staff: ['admin', 'moderator'], call: () => assertPermission('listings.delete'), refused: (a) => (a as { threw?: string })?.threw === 'forbidden', reaches: '' },
  { name: 'currencies.assertAdmin', staff: ['admin', 'moderator'], call: () => getAllCurrenciesAdmin(), refused: (a) => Array.isArray(a) && a.length === 0, reaches: 'currencies' },
  { name: 'footer.assertAdminUser (administrator only)', staff: ['admin'], call: () => getAllFooterContent(), refused: isErr('forbidden'), reaches: 'site_footer' },
  { name: 'contacts.assertAdminOrModerator', staff: ['admin', 'moderator'], call: () => updateInquiryStatus('i1', 'closed'), refused: isErr('forbidden'), reaches: 'contact_inquiries' },
  { name: 'companies.assertAdminOrMod', staff: ['admin', 'moderator'], call: () => updateCompanyAction('c1', 'New name'), refused: isErr('forbidden', 'unauthorized'), reaches: 'companies' },
  { name: 'popularLocations.requireAdminOrModerator', staff: ['admin', 'moderator'], call: () => setLocationFeatured(1, 1), refused: isErr('forbidden', 'unauthenticated'), reaches: 'locations' },
  { name: 'emailTemplates.assertAdminOrModerator', staff: ['admin', 'moderator'], call: () => upsertEmailTemplateAction({ key: 'k', locale: 'en', subject: 's', html_body: '<p>x</p>', variables: [], is_active: true }), refused: isErr('forbidden', 'unauthorized'), reaches: 'email_templates' },
  { name: 'admin.resolveAdminActor', staff: ['admin', 'moderator'], call: () => updateListingStatus('l1', 'active'), refused: (a) => /forbidden|unauthenticated/.test((a as { threw?: string })?.threw ?? ''), reaches: 'listing-transition' },
  { name: 'admin.updateUserProfileFull (inline guard)', staff: ['admin', 'moderator'], call: () => updateUserProfileFull('u1', { firstName: 'A', profileType: 'private', phone: '+355691234567', locationId: 1, status: 'active' }), refused: isErr('Forbidden', 'Unauthorized'), reaches: 'users:write' },
  { name: 'permissions.getAdminUserId (administrator only)', staff: ['admin'], call: () => setModeratorPermission('listings.delete', true), refused: isErr('forbidden', 'Forbidden', 'unauthenticated', 'Unauthorized'), reaches: 'role_permissions' },
  { name: 'changeListingStatusAction', staff: ['admin', 'moderator'], call: () => changeListingStatusAction('l1', 'inactive'), refused: (a) => (a as { ok?: boolean })?.ok === false, reaches: 'listing-transition' },
  { name: 'upload-avatar route', staff: ['admin', 'moderator'], call: async () => (await upload()).status, refused: (a) => a === 401 || a === 403, reaches: '' },
]

const reached = (g: Guard) => (g.reaches ? env.data.includes(g.reaches) || env.effects.includes(g.reaches) : false)

beforeEach(() => {
  env.user = { id: ID }; env.row = null; env.readFails = false; env.data = []; env.effects = []
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

it('[SEC-D27-SRV-STAFF-DENY] A blocked, suspended, deactivated, deleted or missing account gets no staff power, whatever its role', async () => {
  const states: [string, Partial<Row> | null][] = [
    ['deleted', { deleted_at: '2026-10-01T00:00:00Z' }],
    ['blocked permanently', { status: 'blocked', suspended_until: null }],
    ['blocked until a future date', { status: 'blocked', suspended_until: future() }],
    ['inactive', { status: 'inactive' }],
    ['no row', null],
  ]
  for (const role of ['admin', 'moderator'] as const) {
    for (const [label, extra] of states) {
      for (const guard of GUARDS) {
        env.row = extra === null ? null : live(role, extra)
        env.data = []; env.effects = []
        const answer = await safe(guard.call)
        const who = `${guard.name} / ${role} / ${label}`
        expect(guard.refused(answer), `${who}: the existing refusal, got ${JSON.stringify(answer)}`).toBe(true)
        expect(env.data, `${who}: no data read or written beyond the caller's own row`).toEqual([])
        expect(env.effects, `${who}: no write, upload, e-mail or notification`).toEqual([])
      }
    }
  }
})

it('[SEC-D27-SRV-STAFF-ALLOW] A blocked, suspended, deactivated, deleted or missing account gets no staff power, whatever its role', async () => {
  const states: [string, Partial<Row>][] = [['active', {}], ['blocked with a suspension that has ended', { status: 'blocked', suspended_until: past() }]]
  for (const role of ['admin', 'moderator'] as const) {
    for (const [label, extra] of states) {
      for (const guard of GUARDS) {
        env.row = live(role, extra)
        env.data = []; env.effects = []
        const answer = await safe(guard.call)
        const who = `${guard.name} / ${role} / ${label}`
        if (guard.staff.includes(role)) {
          // a guard that reaches the database is proved by that reach (an empty list is also the answer for "no rows"); the others by their answer
          if (guard.reaches) expect(reached(guard), `${who}: reached ${guard.reaches}, answer ${JSON.stringify(answer)}`).toBe(true)
          else expect(guard.refused(answer), `${who}: a staff answer, got ${JSON.stringify(answer)}`).toBe(false)
        } else {
          // an administrator-only right is never given to a moderator
          expect(guard.refused(answer), `${who}: administrator-only, got ${JSON.stringify(answer)}`).toBe(true)
        }
      }
    }
  }
})

it('[SEC-D27-SRV-STAFF-ERR] A blocked, suspended, deactivated, deleted or missing account gets no staff power, whatever its role', async () => {
  env.readFails = true
  for (const guard of GUARDS) {
    env.row = live('admin')
    env.data = []; env.effects = []
    const answer = await safe(guard.call)
    expect(guard.refused(answer), `${guard.name}: the existing failure answer, got ${JSON.stringify(answer)}`).toBe(true)
    expect(env.data, `${guard.name}: no data access after a failed read`).toEqual([])
    expect(env.effects, `${guard.name}: no write after a failed read`).toEqual([])
  }
})
