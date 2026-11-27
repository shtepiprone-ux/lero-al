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

type Access = { client: 'user' | 'admin'; table: string; op: string; cols?: string; payload?: unknown; inColumn?: string; inValues?: unknown[] }
const access: Access[] = []
const sideEffects: string[] = []
let sessionUser: { id: string; email?: string } | null = null
let sessionRole: string | null = null
/** the `role_permissions` switches of the moderator that are on (Task 1007: the page keys and the action keys) */
let switchedOn = new Set<string>()

function recorder(client: 'user' | 'admin') {
  return {
    from(table: string) {
      const rec: Access = { client, table, op: 'select' }
      access.push(rec)
      const chain: Record<string, unknown> = {}
      const setOp = (op: string) => () => { rec.op = op; return chain }
      chain.select = (cols?: string) => { rec.cols = cols; return chain }
      // the written values are kept (Task 989 AC4: the social list of the Footer page goes to all four language rows)
      const setWrite = (op: string) => (payload?: unknown) => { rec.op = op; rec.payload = payload; return chain }
      chain.insert = setWrite('insert'); chain.update = setWrite('update'); chain.upsert = setWrite('upsert'); chain.delete = setOp('delete')
      for (const m of ['eq', 'neq', 'is', 'not', 'or', 'ilike', 'gte', 'lte', 'order', 'limit', 'range', 'match']) chain[m] = () => chain
      // the switch of a moderator (Task 1007): `roleHasPermission` reads `role_permissions` for one `permission_key`; a key that is on answers `allowed`, any other has no row
      let permissionKey = ''
      chain.eq = (column: string, value: string) => { if (column === 'permission_key') permissionKey = value; return chain }
      // the rank read of an action on another account (Task 923 R66 (a), fail-closed): it is answered for exactly the ids that were asked for
      let rankIds: string[] | null = null
      chain.in = (column: string, ids: string[]) => { rankIds = ids; rec.inColumn = column; rec.inValues = ids; return chain }
      const row = table === 'users' ? { role: sessionRole, status: 'active', user_type: 'private', name: 'X', id: sessionUser?.id } : null
      chain.single = async () => ({ data: row, error: row ? null : { message: 'none', code: 'PGRST116' } })
      chain.maybeSingle = async () => ({ data: table === 'role_permissions' ? (switchedOn.has(permissionKey) ? { allowed: true } : null) : row, error: null })
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
/** Task 989: a valid save of the shared block of the Footer page */
const FOOTER_SHARED = {
  settings: { contact_phone: '+355 69 123 4567', contact_email: 'support@lero.al', contact_email_sales: 'sales@lero.al', footer_show_phone: 'true', footer_show_email_support: 'true', footer_show_email_sales: 'false', footer_show_text: 'true' },
  social_links: [{ id: 's1', label: 'Facebook', url: 'https://www.facebook.com/lero.al', enabled: true, order: 0 }, { id: 's2', label: 'Instagram', url: 'https://www.instagram.com/lero.al', enabled: false, order: 1 }],
}

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
  ['footer.saveFooterShared', footer.saveFooterShared as Fn, [FOOTER_SHARED]],
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
  switchedOn = new Set()
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

// ── Task 1007 AC4: the three loaders a browser can call follow the page keys ───────────────────────────────────────────────────────
describe('a moderator and the page keys (Task 1007)', () => {
  beforeEach(() => { sessionUser = { id: 'u-mod', email: 'mod@example.com' }; sessionRole = 'moderator' })
  const reachedTable = (table: string) => access.some((a) => a.table === table)

  const LOADERS: [name: string, pageKey: string, writeKey: string, table: string, fn: Fn][] = [
    ['getAllCurrenciesAdmin', 'page.currency', 'catalog.manage', 'currencies', currencies.getAllCurrenciesAdmin as Fn],
    ['getAllPropertyTypesAdmin', 'page.property_types', 'catalog.manage', 'property_types', propertyTypes.getAllPropertyTypesAdmin as Fn],
  ]
  it.each(LOADERS)('%s: without %s a moderator gets [] (the write key %s is no help); with it, the read runs', async (_name, pageKey, writeKey, table, fn) => {
    switchedOn = new Set([writeKey, 'support.manage'])
    expect(await fn(), 'no page key: nothing').toEqual([])
    expect(reachedTable(table), `${table} is not read without ${pageKey}`).toBe(false)

    access.length = 0
    switchedOn = new Set([pageKey])   // the page key alone is enough to read the page: the writes keep catalog.manage
    await fn()
    expect(reachedTable(table), `${table} is read with ${pageKey}`).toBe(true)
  })

  it('searchUsersForPicker: refused without page.support and without support.manage; with both, the users are searched', async () => {
    const search = admin.searchUsersForPicker as Fn
    for (const on of [[], ['support.manage'], ['page.support']]) {
      access.length = 0
      switchedOn = new Set(on)
      await expect(search('alba'), `switched on: ${on.join(', ') || 'nothing'}`).rejects.toThrow('forbidden')
      expect(beyondRoleLookup(), `switched on: ${on.join(', ') || 'nothing'}: no user was read`).toEqual([])
    }
    access.length = 0
    switchedOn = new Set(['page.support', 'support.manage'])
    await search('alba')
    expect(beyondRoleLookup().some((a) => a.table === 'users'), 'with both keys the users are searched').toBe(true)
  })

  it('an administrator reads all three with no row', async () => {
    sessionRole = 'admin'
    await (currencies.getAllCurrenciesAdmin as Fn)()
    await (propertyTypes.getAllPropertyTypesAdmin as Fn)()
    await (admin.searchUsersForPicker as Fn)('alba')
    expect(reachedTable('currencies') && reachedTable('property_types') && access.some((a) => a.table === 'users' && /last_name/.test(a.cols ?? ''))).toBe(true)
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

// ── Task 989 AC4: the writes refuse bad values, removed keys and non-admins ──────────────────────────────────────────────────────────
describe('Task 989 AC4 — the settings and the Footer page refuse what they must', () => {
  const writes = () => access.filter((a) => a.op === 'insert' || a.op === 'update' || a.op === 'upsert' || a.op === 'delete')
  const asAdmin = () => { sessionUser = { id: 'u-admin', email: 'admin@example.com' }; sessionRole = 'admin' }

  it.each(['tagline', 'logo_dark_url', 'social_facebook', 'social_instagram', 'social_linkedin', 'about_al', 'about_uk', 'meta_title', 'meta_desc', 'contact_email', 'contact_phone'])(
    'saveSettings refuses the key %s, which the settings form no longer holds, and writes nothing',
    async (key) => {
      asAdmin()
      const result = await (admin.saveSettings as Fn)({ site_name: 'Lero.al', [key]: 'x' }) as { error?: string }
      expect(result.error).toBe('validation')
      expect(writes()).toEqual([])
    },
  )

  it('saveSettings saves the per-language titles and descriptions and the brand images', async () => {
    asAdmin()
    const entries = { meta_title_sq: 'Titulli', meta_desc_uk: 'Опис', logo_url: 'https://res.cloudinary.com/lero/image/upload/logo.svg', favicon_url: '' }
    expect(await (admin.saveSettings as Fn)(entries)).toEqual({})
    expect(writes().some((a) => a.table === 'site_settings' && a.op === 'upsert')).toBe(true)
  })

  const BAD: [string, Record<string, unknown>][] = [
    ['an e-mail with a query', { settings: { ...FOOTER_SHARED.settings, contact_email: 'support@lero.al?cc=victim@example.com' } }],
    ['an e-mail with a line break', { settings: { ...FOOTER_SHARED.settings, contact_email_sales: 'sales@lero.al\nBcc: victim@example.com' } }],
    ['two e-mails', { settings: { ...FOOTER_SHARED.settings, contact_email: 'a@lero.al,b@lero.al' } }],
    ['an e-mail with a space', { settings: { ...FOOTER_SHARED.settings, contact_email: 'sup port@lero.al' } }],
    ['an e-mail without @', { settings: { ...FOOTER_SHARED.settings, contact_email: 'support.lero.al' } }],
    ['an e-mail of 255 characters', { settings: { ...FOOTER_SHARED.settings, contact_email: `${'a'.repeat(247)}@lero.al` } }],
    ['a phone with letters', { settings: { ...FOOTER_SHARED.settings, contact_phone: '+355 call me' } }],
    ['a phone with a scheme', { settings: { ...FOOTER_SHARED.settings, contact_phone: 'tel:+355691234567' } }],
    ['a phone too short', { settings: { ...FOOTER_SHARED.settings, contact_phone: '+3556' } }],
    ['a phone too long', { settings: { ...FOOTER_SHARED.settings, contact_phone: '+355 69 123 4567 8901' } }],
    ['a switch that is not true or false', { settings: { ...FOOTER_SHARED.settings, footer_show_phone: 'yes' } }],
    ['a key that is not of the Footer page', { settings: { ...FOOTER_SHARED.settings, site_name: 'Evil' } }],
    ['a value that is not text', { settings: { ...FOOTER_SHARED.settings, contact_phone: 355 } }],
    ['a javascript: social link', { social_links: [{ id: 's1', label: 'X', url: 'javascript:alert(1)', enabled: true, order: 0 }] }],
    ['a tab inside the scheme of a social link', { social_links: [{ id: 's1', label: 'X', url: 'java\tscript:alert(1)', enabled: false, order: 0 }] }],
    ['a social list that is not a list', { social_links: 'https://evil.example' }],
    ['a social link that is not an object', { social_links: ['https://evil.example'] }],
  ]
  it.each(BAD)('saveFooterShared refuses %s and writes nothing', async (_label, over) => {
    asAdmin()
    const result = await (footer.saveFooterShared as Fn)({ ...FOOTER_SHARED, ...over }) as { error?: string }
    expect(result.error).toBeTruthy()
    expect(writes()).toEqual([])
    expect(sideEffects).toEqual([])
  })

  it('saveFooterShared refuses a payload that is not an object', async () => {
    asAdmin()
    for (const payload of [null, 'x', 42]) {
      const result = await (footer.saveFooterShared as Fn)(payload) as { error?: string }
      expect(result.error).toBeTruthy()
    }
    expect(writes()).toEqual([])
  })

  describe.each([
    ['an anonymous visitor', null, null],
    ['a signed-in plain user', { id: 'u-plain', email: 'plain@example.com' }, 'user'],
    ['a signed-in agent', { id: 'u-agent', email: 'agent@example.com' }, 'agent'],
    ['a moderator with every switch on', { id: 'u-mod', email: 'mod@example.com' }, 'moderator'],
  ])('[SEC-989-FOOTER-SAVE-DENY] %s', (_label, user, role) => {
    it('is refused by saveFooterShared and nothing is read or written', async () => {
      sessionUser = user
      sessionRole = role
      switchedOn = new Set(['page.footer', 'page.settings', 'settings.manage'])
      const result = await (footer.saveFooterShared as Fn)(FOOTER_SHARED).catch(() => ({ error: 'thrown' })) as { error?: string }
      expect(result.error).toBeTruthy()
      expect(beyondRoleLookup()).toEqual([])
      expect(sideEffects).toEqual([])
    })
  })

  it('[SEC-989-FOOTER-SAVE-DENY] an administrator saves: the contacts and switches to site_settings, the social list to all four language rows', async () => {
    asAdmin()
    expect(await (footer.saveFooterShared as Fn)(FOOTER_SHARED)).toEqual({})
    const settingsWrite = writes().find((a) => a.table === 'site_settings')
    expect(settingsWrite?.op).toBe('upsert')
    const rows = settingsWrite?.payload as { key: string; value: string }[]
    expect(Object.fromEntries(rows.map((r) => [r.key, r.value]))).toEqual(FOOTER_SHARED.settings)
    const footerWrite = writes().find((a) => a.table === 'site_footer')
    expect(footerWrite?.op).toBe('update')
    expect(footerWrite?.inColumn).toBe('locale')
    expect([...(footerWrite?.inValues ?? [])].sort()).toEqual(['en', 'it', 'sq', 'uk'])
    expect((footerWrite?.payload as { social_links: unknown }).social_links).toEqual(FOOTER_SHARED.social_links)
    expect(sideEffects).toContain('revalidatePath')
  })

  it('a social link is written with its own fields only', async () => {
    asAdmin()
    const extra = { ...FOOTER_SHARED.social_links[0], role: 'admin', __proto__: { polluted: true } }
    expect(await (footer.saveFooterShared as Fn)({ ...FOOTER_SHARED, social_links: [extra] })).toEqual({})
    const footerWrite = writes().find((a) => a.table === 'site_footer')
    expect((footerWrite?.payload as { social_links: unknown }).social_links).toEqual([FOOTER_SHARED.social_links[0]])
  })

  // Revision 1, F4: both footer writes are bounded — at most 50 links per list; a link's id ≤ 64, label ≤ 200, address ≤ 2048 characters; each text field of a
  // language row ≤ 5000 characters. Each bound: exactly at it is saved, one over it is refused with `validation` and nothing is written.
  describe('Revision 1, F4 — the footer writes are bounded', () => {
    const linkOf = (i: number, over: Record<string, unknown> = {}) => ({ id: `l${i}`, label: `Link ${i}`, url: `https://x.example/${i}`, enabled: true, order: i, ...over })
    const urlOf = (length: number) => { const head = 'https://x.example/'; return head + 'a'.repeat(length - head.length) }
    const links = (count: number) => Array.from({ length: count }, (_, i) => linkOf(i))
    const LOCALE_ROW = { brand_title: 'B', tagline: '', nav_section_title: '', nav_links: [] as unknown[], info_section_title: '', info_links: [] as unknown[], social_section_title: '', copyright_template: '' }
    /** [bound, the value at the bound, the value one over it] — each a list of links */
    const LINK_BOUNDS: [string, unknown[], unknown[]][] = [
      ['50 links', links(50), links(51)],
      ['a link id of 64 characters', [linkOf(0, { id: 'i'.repeat(64) })], [linkOf(0, { id: 'i'.repeat(65) })]],
      ['a link label of 200 characters', [linkOf(0, { label: 'L'.repeat(200) })], [linkOf(0, { label: 'L'.repeat(201) })]],
      ['a link address of 2048 characters', [linkOf(0, { url: urlOf(2048) })], [linkOf(0, { url: urlOf(2049) })]],
    ]
    const TEXT_FIELDS = ['brand_title', 'tagline', 'nav_section_title', 'info_section_title', 'social_section_title', 'copyright_template'] as const

    it.each(LINK_BOUNDS)('saveFooterShared saves the social list at %s and refuses one over it, writing nothing', async (_bound, at, over) => {
      asAdmin()
      expect(await (footer.saveFooterShared as Fn)({ settings: {}, social_links: at })).toEqual({})
      expect(writes().some((a) => a.table === 'site_footer' && a.op === 'update')).toBe(true)
      access.length = 0
      sideEffects.length = 0
      expect(await (footer.saveFooterShared as Fn)({ settings: FOOTER_SHARED.settings, social_links: over })).toEqual({ error: 'validation' })
      expect(writes()).toEqual([])
      expect(sideEffects).toEqual([])
    })

    it.each(LINK_BOUNDS.flatMap(([bound, at, over]) => (['nav_links', 'info_links'] as const).map((list) => [`${list}: ${bound}`, list, at, over] as const)))(
      'upsertFooterContent saves %s and refuses one over it, writing nothing',
      async (_label, list, at, over) => {
        asAdmin()
        expect(await (footer.upsertFooterContent as Fn)('en', { ...LOCALE_ROW, [list]: at })).toEqual({})
        expect(writes().some((a) => a.table === 'site_footer' && a.op === 'upsert')).toBe(true)
        access.length = 0
        sideEffects.length = 0
        expect(await (footer.upsertFooterContent as Fn)('en', { ...LOCALE_ROW, [list]: over })).toEqual({ error: 'validation' })
        expect(writes()).toEqual([])
        expect(sideEffects).toEqual([])
      },
    )

    it.each(TEXT_FIELDS)('upsertFooterContent saves %s of 5000 characters and refuses 5001, writing nothing', async (field) => {
      asAdmin()
      expect(await (footer.upsertFooterContent as Fn)('en', { ...LOCALE_ROW, [field]: 'x'.repeat(5000) })).toEqual({})
      expect(writes().some((a) => a.table === 'site_footer' && a.op === 'upsert')).toBe(true)
      access.length = 0
      sideEffects.length = 0
      expect(await (footer.upsertFooterContent as Fn)('en', { ...LOCALE_ROW, [field]: 'x'.repeat(5001) })).toEqual({ error: 'validation' })
      expect(writes()).toEqual([])
      expect(sideEffects).toEqual([])
    })
  })

  it('upsertFooterContent no longer writes the social links of one language', async () => {
    asAdmin()
    await (footer.upsertFooterContent as Fn)('en', { ...FOOTER, brand_title: 'B', nav_section_title: '', info_section_title: '', social_section_title: '', copyright_template: '', social_links: [{ id: 's', label: 'X', url: 'https://x.example', enabled: true, order: 0 }] })
    const footerWrite = writes().find((a) => a.table === 'site_footer')
    expect(footerWrite).toBeDefined()
    expect(footerWrite?.payload).not.toHaveProperty('social_links')
  })
})
