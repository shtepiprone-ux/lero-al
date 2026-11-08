// @vitest-environment node
/**
 * Every staff-only Server Action refuses everyone who is not staff, and does nothing at all for them (Task 923 Revision 7, owner 2026-10-17: the tests must also catch
 * what lets a stranger read or change other people's data).
 *
 * One table drives all the actions: each is called as an anonymous visitor, a signed-in plain user and a signed-in agent. For these callers the database client must not
 * be touched beyond the caller's own role lookup, no auth-admin call, no e-mail, no notification and no file deletion may happen, and nothing may be revalidated. As a
 * control, the same call as an administrator must reach the database: otherwise the table would pass for a reason other than the guard.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

type Access = { client: 'user' | 'admin'; table: string; op: string; cols?: string }
const access: Access[] = []
const sideEffects: string[] = []
let sessionUser: { id: string; email?: string } | null = null
let sessionRole: string | null = null

function recorder(client: 'user' | 'admin') {
  return {
    from(table: string) {
      const rec: Access = { client, table, op: 'select' }
      access.push(rec)
      const chain: Record<string, unknown> = {}
      const setOp = (op: string) => () => { rec.op = op; return chain }
      chain.select = (cols?: string) => { rec.cols = cols; return chain }
      chain.insert = setOp('insert'); chain.update = setOp('update'); chain.upsert = setOp('upsert'); chain.delete = setOp('delete')
      for (const m of ['eq', 'neq', 'is', 'not', 'or', 'ilike', 'gte', 'lte', 'order', 'limit', 'range', 'match']) chain[m] = () => chain
      // the rank read of an action on another account (Task 923 R66 (a), fail-closed): it is answered for exactly the ids that were asked for
      let rankIds: string[] | null = null
      chain.in = (_column: string, ids: string[]) => { rankIds = ids; return chain }
      const row = table === 'users' ? { role: sessionRole, status: 'active', user_type: 'private', name: 'X', id: sessionUser?.id } : null
      chain.single = async () => ({ data: row, error: row ? null : { message: 'none', code: 'PGRST116' } })
      chain.maybeSingle = async () => ({ data: row, error: null })
      chain.then = (resolve: (v: unknown) => void) => resolve(
        table === 'users' && rankIds
          ? { data: rankIds.map((id) => ({ id, role: id === sessionUser?.id ? sessionRole : 'user' })), error: null, count: rankIds.length }
          : { data: [], error: null, count: 0 },
      )
      return chain
    },
    rpc(name: string) { access.push({ client, table: `rpc:${name}`, op: 'rpc' }); return Promise.resolve({ data: null, error: null }) },
    auth: {
      getUser: async () => ({ data: { user: sessionUser } }),
      admin: new Proxy({}, { get: (_t, name: string) => async () => { access.push({ client, table: `auth.admin.${name}`, op: 'auth-admin' }); return { data: { user: { id: 'u', email: 'u@example.com' }, users: [] }, error: null } } }),
    },
  }
}

vi.mock('@/lib/auth/server', () => ({ getUser: async () => sessionUser, resolveSession: async () => ({ user: sessionUser }), getSession: async () => null }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => recorder('user') }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => recorder('admin') }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('@/lib/getExchangeRateServer', () => ({ isRatePublished: async () => true }))   // the single rate source (Task 923 R79): published, so the catalogue actions reach their database
vi.mock('next/cache', () => ({ revalidatePath: () => { sideEffects.push('revalidatePath') }, revalidateTag: () => { sideEffects.push('revalidateTag') }, updateTag: () => { sideEffects.push('updateTag') }, unstable_cache: (fn: unknown) => fn }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, set: () => { sideEffects.push('cookie') }, getAll: () => [] }), headers: async () => ({ get: () => null }) }))
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => { sideEffects.push('notification') } }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => { sideEffects.push('listing-transition'); return { ok: true } }, applyListingTransition: async () => { sideEffects.push('listing-transition'); return { ok: true } } }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: async () => { sideEffects.push('cloudinary-delete') } }))
vi.mock('@/modules/notifications/lib/emails/send', () => ({ sendEmail: async () => { sideEffects.push('email'); return { id: 'x' } } }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => { sideEffects.push('email') } }))
vi.mock('@/modules/notifications/lib/sendTemplatedEmail', () => ({ sendTemplatedEmail: async () => { sideEffects.push('email') } }))

import * as admin from '@/modules/admin/actions'
import * as permissions from '@/modules/admin/actions/permissions'
import * as footer from '@/modules/admin/actions/footer'
import * as currencies from '@/modules/admin/actions/currencies'
import * as propertyTypes from '@/modules/admin/actions/propertyTypes'
import * as clearHistory from '@/modules/admin/actions/clearHistory'
import * as emailTemplates from '@/modules/notifications/actions/emailTemplates'
import * as popular from '@/modules/locations/actions/popularLocationActions'

type Fn = (...args: unknown[]) => Promise<unknown>
const CURRENCY = { code: 'XXX', symbol: 'x', name_sq: 'a', name_en: 'a', name_uk: 'a', name_it: 'a' }
const TYPE = { name_sq: 'a', name_en: 'a', name_uk: 'a', name_it: 'a', slug: 'flat' }
const FOOTER = { nav_links: [], info_links: [], social_links: [], tagline: '', copyright: '' }

/** every staff-only action with arguments that are valid enough to get past input checks */
const ACTIONS: [string, Fn, unknown[]][] = [
  ['admin.updateListingStatus', admin.updateListingStatus as Fn, ['l1', 'active']],
  ['admin.setListingPremium', admin.setListingPremium as Fn, ['l1', true, null]],
  ['admin.toggleListingPremium', admin.toggleListingPremium as Fn, ['l1', true]],
  ['admin.deleteListing', admin.deleteListing as Fn, ['l1']],
  ['admin.updateUserProfile', admin.updateUserProfile as Fn, ['u1', { name: 'X' }]],
  ['admin.toggleUserVerified', admin.toggleUserVerified as Fn, ['u1', true]],
  ['admin.createLocation', admin.createLocation as Fn, [{ name_al: 'A', type: 'city', slug: 'a' }]],
  ['admin.updateLocation', admin.updateLocation as Fn, [1, { name_al: 'B' }]],
  ['admin.toggleLocationFeatured', admin.toggleLocationFeatured as Fn, [1, true]],
  ['admin.deleteLocation', admin.deleteLocation as Fn, [1]],
  ['admin.saveSettings', admin.saveSettings as Fn, [{ site_name: 'Lero.al' }]],
  ['admin.createPage', admin.createPage as Fn, [{ title: 'T', slug: 'terms', content: {}, is_published: false }]],
  ['admin.updatePage', admin.updatePage as Fn, [1, { title: 'T' }]],
  ['admin.deletePage', admin.deletePage as Fn, [1]],
  ['admin.updateUserProfileFull', admin.updateUserProfileFull as Fn, ['u1', { firstName: 'A', profileType: 'private', phone: '+355691234567', locationId: 1, status: 'active' }]],
  ['admin.createAdminUser', admin.createAdminUser as Fn, [{ firstName: 'A', email: 'a@example.com', profileType: 'private', phone: '+355691234567', locationId: 1 }]],
  ['admin.deactivateUser', admin.deactivateUser as Fn, ['u1', 'reason']],
  ['admin.reactivateUser', admin.reactivateUser as Fn, ['u1', 'reason']],
  ['admin.hardDeleteUser', admin.hardDeleteUser as Fn, ['u1']],
  ['admin.removeUserAvatar', admin.removeUserAvatar as Fn, ['u1']],
  ['admin.addLocation', admin.addLocation as Fn, [{ name_al: 'A', region_id: 1 }]],
  ['admin.approveLocationRequest', admin.approveLocationRequest as Fn, ['u1', 1]],
  ['admin.rejectLocationRequest', admin.rejectLocationRequest as Fn, ['u1']],
  ['admin.searchUsersForPicker', admin.searchUsersForPicker as Fn, ['alba']],
  ['admin.updateTicketStatus', admin.updateTicketStatus as Fn, ['t1', 'open']],
  ['permissions.getModeratorPermissions', permissions.getModeratorPermissions as Fn, []],
  ['permissions.getPermissionEvents', permissions.getPermissionEvents as Fn, [5]],
  ['permissions.setModeratorPermission', permissions.setModeratorPermission as Fn, ['listings.delete', true]],
  ['footer.getAllFooterContent', footer.getAllFooterContent as Fn, []],
  ['footer.upsertFooterContent', footer.upsertFooterContent as Fn, ['en', FOOTER]],
  ['currencies.getAllCurrenciesAdmin', currencies.getAllCurrenciesAdmin as Fn, []],
  ['currencies.createCurrency', currencies.createCurrency as Fn, [CURRENCY]],
  ['currencies.updateCurrency', currencies.updateCurrency as Fn, [1, CURRENCY]],
  ['currencies.toggleCurrencyActive', currencies.toggleCurrencyActive as Fn, [1, true]],
  ['currencies.setDefaultCurrency', currencies.setDefaultCurrency as Fn, [1]],
  ['currencies.deleteCurrency', currencies.deleteCurrency as Fn, [1]],
  ['propertyTypes.createPropertyType', propertyTypes.createPropertyType as Fn, [TYPE]],
  ['propertyTypes.updatePropertyType', propertyTypes.updatePropertyType as Fn, [1, TYPE]],
  ['propertyTypes.togglePropertyTypeActive', propertyTypes.togglePropertyTypeActive as Fn, [1, true]],
  ['propertyTypes.deletePropertyType', propertyTypes.deletePropertyType as Fn, [1]],
  ['propertyTypes.getAllPropertyTypesAdmin', propertyTypes.getAllPropertyTypesAdmin as Fn, []],
  ['clearHistory.clearHistoryRow', clearHistory.clearHistoryRow as Fn, ['user_status_history', 'e1', 'r1']],
  ['clearHistory.clearHistoryForEntity', clearHistory.clearHistoryForEntity as Fn, ['user_status_history', 'e1']],
  ['emailTemplates.upsertEmailTemplateAction', emailTemplates.upsertEmailTemplateAction as Fn, [{ key: 'k', locale: 'en', subject: 's', html_body: '<p>x</p>', variables: [], is_active: true }]],
  ['emailTemplates.deleteEmailTemplateGroupAction', emailTemplates.deleteEmailTemplateGroupAction as Fn, ['k']],
  ['emailTemplates.deleteEmailTemplateLocaleAction', emailTemplates.deleteEmailTemplateLocaleAction as Fn, ['id1']],
  ['popular.setLocationFeatured', popular.setLocationFeatured as Fn, [1, 1]],
  ['popular.setLocationUnfeatured', popular.setLocationUnfeatured as Fn, [1]],
]

/** a database access that is NOT the caller's own role lookup */
// (Task 923 R44: the caller's role is read by `requireViewer()`, `role, status, suspended_until, deleted_at` of the caller's own row, through the service role.)
const beyondRoleLookup = () => access.filter((a) => !(a.table === 'users' && a.op === 'select' && /^\s*(role|id, role|role, status, suspended_until, deleted_at)\s*$/.test(a.cols ?? 'role')) && a.table !== 'role_permissions')

async function run(fn: Fn, args: unknown[]) {
  try { await fn(...args) } catch { /* a refusal may throw */ }
}

beforeEach(() => {
  access.length = 0
  sideEffects.length = 0
  sessionUser = null
  sessionRole = null
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('the table covers the staff actions', () => {
  it('lists every exported action of the staff action files, none forgotten', () => {
    const listed = new Set(ACTIONS.map(([n]) => n))
    // actions that are NOT staff-only by design, with the reason
    const NOT_STAFF: Record<string, string> = {
      'admin.createSupportTicket': 'creates a ticket on behalf of a requester; covered by its own flow test',
    }
    const modules: Record<string, Record<string, unknown>> = { admin, permissions, footer, currencies, propertyTypes, clearHistory, emailTemplates, popular }
    const missing: string[] = []
    for (const [prefix, mod] of Object.entries(modules)) {
      for (const [name, value] of Object.entries(mod)) {
        if (typeof value !== 'function') continue
        const id = `${prefix}.${name}`
        if (!listed.has(id) && !(id in NOT_STAFF)) missing.push(id)
      }
    }
    expect(missing, `staff actions missing from the table: ${missing.join(', ')}`).toEqual([])
  })
})

describe.each([
  ['an anonymous visitor', null, null],
  ['a signed-in plain user', { id: 'u-plain', email: 'plain@example.com' }, 'user'],
  ['a signed-in agent', { id: 'u-agent', email: 'agent@example.com' }, 'agent'],
])('%s', (_label, user, role) => {
  beforeEach(() => { sessionUser = user; sessionRole = role })

  it.each(ACTIONS)('%s does nothing for them', async (_name, fn, args) => {
    await run(fn, args)
    expect(beyondRoleLookup(), `database access: ${JSON.stringify(beyondRoleLookup())}`).toEqual([])
    expect(sideEffects).toEqual([])
  })
})

describe('control: an administrator DOES reach the database (so the table above is not passing for another reason)', () => {
  it.each(ACTIONS)('%s', async (name, fn, args) => {
    sessionUser = { id: 'u-admin', email: 'admin@example.com' }
    sessionRole = 'admin'
    await run(fn, args)
    const reached = beyondRoleLookup().length > 0 || sideEffects.length > 0
    // a few actions answer from the role lookup alone for the dummy arguments (a read of a permission table, a locale cookie)
    const EXEMPT_CONTROL = new Set<string>(['permissions.getModeratorPermissions'])
    if (!EXEMPT_CONTROL.has(name)) expect(reached, `${name} never reached the database as an administrator`).toBe(true)
  })
})
