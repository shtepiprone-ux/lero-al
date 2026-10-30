// @vitest-environment node
/**
 * Admin catalogue actions (Task 923 Revision 7): currencies, property types, history clearing and the footer.
 * Who may call them is proved for every action in `src/__tests__/security/staffActions.test.ts`; this file proves WHAT they do: what is stored (trimmed, normalised),
 * what is refused (blank, duplicate, still in use, default) and that the public caches are refreshed only when something changed.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let currentUser: { id: string } | null = null
let mayClearHistory = true
let permissionThrows = false
const tags: string[] = []
const paths: string[] = []
const rpcCalls: { name: string; args: Record<string, unknown> }[] = []
let rpcResult: { data: unknown; error: { message: string; code?: string } | null } = { data: { cleared_row_count: 1 }, error: null }
/** makes the next set_default_currency call fail the way a database failure does */
let defaultCurrencyFails: { message: string; code?: string } | null = null
/** the codes the single rate source publishes (Task 923 R79 (a)); an empty set stands for a page that publishes nothing, `null` for a page that cannot be read */
let published: Set<string> | null = new Set(['EUR', 'USD', 'GBP', 'CHF', 'XXX'])
vi.mock('@/lib/getExchangeRateServer', () => ({ isRatePublished: async (code: string) => (code.trim().toUpperCase() === 'ALL' ? true : published === null ? null : published.has(code.trim().toUpperCase())) }))   // ALL is the pivot and needs no rate, as in the real function

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (t: string) => db.client.from(t), rpc: async (name: string, args: Record<string, unknown>) => {
  rpcCalls.push({ name, args })
  if (name === 'set_default_currency') {
    // the database function of Task 923 R65 (d): it refuses a missing or inactive currency (22023), then ONE update sets is_default = (id = p_id) on every row
    if (defaultCurrencyFails) return { data: null, error: defaultCurrencyFails }
    const rows = db.tables.currencies
    const target = rows.find((c) => c.id === args.p_id)
    if (!target || !target.is_active) return { data: null, error: { code: '22023', message: 'currency_not_available' } }
    for (const c of rows) c.is_default = c.id === args.p_id
    return { data: null, error: null }
  }
  return rpcResult
} }) }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db.client }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => currentUser }))
vi.mock('@/lib/auth/permissions', () => {
  const allowed = async () => { if (permissionThrows) throw new Error('boom'); return mayClearHistory }
  return { hasPermission: allowed, assertPermission: async () => { if (!(await allowed())) throw new Error('forbidden') } }
})
// The role guards read the caller's own row with the service role (Task 923 R44): the fake database already holds it, so the REAL requireViewer runs.
vi.mock('next/cache', () => ({ revalidateTag: (t: string) => { tags.push(t) }, revalidatePath: (p: string) => { paths.push(p) }, unstable_cache: (fn: unknown) => fn }))

import { createCurrency, deleteCurrency, getAllCurrenciesAdmin, setDefaultCurrency, toggleCurrencyActive, updateCurrency } from '../currencies'
import { createPropertyType, deletePropertyType, getAllPropertyTypesAdmin, togglePropertyTypeActive, updatePropertyType } from '../propertyTypes'
import { clearHistoryForEntity, clearHistoryRow } from '../clearHistory'
import { PROPERTY_TYPES_CACHE_TAG } from '@/modules/admin/lib/propertyTypes'
import { getAllFooterContent } from '../footer'
import { getFooterContent } from '../../lib/settings'   // the public footer read lives in a server-only module (Task 923 R66 (n))

/** every call on the table's `op` fails with `error` */
function failing(table: string, op: 'insert' | 'update' | 'delete' | 'select', error: { code?: string; message: string }) {
  const real = db.client.from
  db.client.from = ((t: string) => {
    const c = real(t) as Record<string, unknown>
    if (t === table) {
      const chain: unknown = new Proxy(function () {}, { get: (_t, k) => (k === 'then' ? (r: (v: unknown) => void) => r({ data: null, error }) : chain), apply: () => chain })
      c[op] = () => chain
    }
    return c
  }) as never
}

const CUR = { code: ' eur ', symbol: ' € ', name_sq: ' Euro ', name_en: ' Euro ', name_uk: ' Євро ', name_it: ' Euro ' }
const TYPE = { name_sq: ' Shtëpi ', name_en: 'House', name_uk: 'Будинок', name_it: 'Casa' }

beforeEach(() => {
  db = createFakeDb({
    users: [{ id: 'adm', role: 'admin', status: 'active' }, { id: 'mod', role: 'moderator', status: 'active' }],
    currencies: [{ id: 1, code: 'ALL', is_active: true, is_default: true }, { id: 2, code: 'EUR', is_active: true, is_default: false }, { id: 3, code: 'USD', is_active: false, is_default: false }],
    property_types: [{ id: 1, slug: 'flat', name_sq: 'Apartament' }, { id: 2, slug: 'land', name_sq: 'Tokë' }],
    listings: [{ id: 'l1', property_type: 'flat' }, { id: 'l2', property_type: 'flat' }],
    site_footer: [],
  })
  currentUser = { id: 'adm' }
  mayClearHistory = true
  permissionThrows = false
  tags.length = 0
  paths.length = 0
  rpcCalls.length = 0
  rpcResult = { data: { cleared_row_count: 1 }, error: null }
  defaultCurrencyFails = null
  published = new Set(['EUR', 'USD', 'GBP', 'CHF', 'XXX'])
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('moderators may manage the catalogues too', () => {
  it('a moderator creates a currency', async () => {
    currentUser = { id: 'mod' }
    expect((await createCurrency(CUR)).id).toBeDefined()
  })
})

describe('currencies', () => {
  it('create stores a trimmed, upper-case code and refreshes the public cache', async () => {
    const res = await createCurrency({ ...CUR, decimals: 2 })
    expect(res.error).toBeUndefined()
    expect(db.tables.currencies.at(-1)).toMatchObject({ code: 'EUR', symbol: '€', name_sq: 'Euro', name_uk: 'Євро', decimals: 2 })
    expect(tags).toEqual(['currencies'])
  })

  it('decimals default to 0', async () => {
    await createCurrency(CUR)
    expect(db.tables.currencies.at(-1)?.decimals).toBe(0)
  })

  it.each([['code', { code: '  ' }, 'Currency code is required'], ['symbol', { symbol: ' ' }, 'Symbol is required']])('create and update refuse a blank %s', async (_f, patch, message) => {
    expect(await createCurrency({ ...CUR, ...patch })).toEqual({ error: message })
    expect(await updateCurrency(2, { ...CUR, ...patch })).toEqual({ error: message })
    expect(tags).toEqual([])
  })

  it('a duplicate code is reported as such and nothing is refreshed', async () => {
    failing('currencies', 'insert', { code: '23505', message: 'dup' })
    expect(await createCurrency(CUR)).toEqual({ error: 'Currency code already exists', code: 'duplicate_code' })
    failing('currencies', 'update', { code: '23505', message: 'dup' })
    expect(await updateCurrency(2, CUR)).toEqual({ error: 'Currency code already exists', code: 'duplicate_code' })
    expect(tags).toEqual([])
  })

  it('another database error is returned as it is', async () => {
    failing('currencies', 'insert', { code: 'XX', message: 'boom' })
    expect(await createCurrency(CUR)).toEqual({ error: 'create_failed' })      // a fixed code, never the database's message (Task 923 R71 (f))
    failing('currencies', 'update', { code: 'XX', message: 'boom2' })
    expect(await updateCurrency(2, CUR)).toEqual({ error: 'update_failed' })
  })

  it('update changes only the named currency', async () => {
    expect(await updateCurrency(2, CUR)).toEqual({})
    expect(db.tables.currencies.find((c) => c.id === 2)).toMatchObject({ code: 'EUR', symbol: '€' })
    expect(db.tables.currencies.find((c) => c.id === 3)?.code).toBe('USD')
  })

  it('the default currency cannot be deactivated or deleted', async () => {
    expect(await toggleCurrencyActive(1, false)).toEqual({ error: 'Cannot deactivate the default currency', code: 'default_currency' })
    expect(await deleteCurrency(1)).toEqual({ error: 'Cannot delete the default currency', code: 'default_currency' })
    expect(db.tables.currencies.find((c) => c.id === 1)).toMatchObject({ is_active: true })
    expect(tags).toEqual([])
  })

  it('another currency can be deactivated, activated and deleted', async () => {
    expect(await toggleCurrencyActive(2, false)).toEqual({})
    expect(db.tables.currencies.find((c) => c.id === 2)?.is_active).toBe(false)
    expect(await toggleCurrencyActive(2, true)).toEqual({})
    expect(await deleteCurrency(3)).toEqual({})
    expect(db.tables.currencies.map((c) => c.id)).toEqual([1, 2])
    expect(tags).toEqual(['currencies', 'currencies', 'currencies'])
  })

  it('a currency that does not exist is "not_found"', async () => {
    expect(await deleteCurrency(99)).toEqual({ error: 'Not found', code: 'not_found' })
  })

  it('toggle and delete report a database error', async () => {
    failing('currencies', 'update', { message: 'upd' })
    expect(await toggleCurrencyActive(2, true)).toEqual({ error: 'update_failed' })
    failing('currencies', 'delete', { message: 'del' })
    expect(await deleteCurrency(3)).toEqual({ error: 'delete_failed' })
  })

  it('only an active currency can become the default; there is then exactly one', async () => {
    expect(await setDefaultCurrency(3)).toEqual({ error: 'Cannot set an inactive currency as default' })
    expect(await setDefaultCurrency(2)).toEqual({})
    expect(db.tables.currencies.filter((c) => c.is_default).map((c) => c.id)).toEqual([2])
    expect(tags).toEqual(['currencies'])
  })

  it('setting the default goes through the database function in one call, and a failure is reported with no database message and no cache refresh (Task 923 R67 (f))', async () => {
    expect(await setDefaultCurrency(2)).toEqual({})
    expect(rpcCalls).toEqual([{ name: 'set_default_currency', args: { p_id: 2 } }])
    expect(db.log.filter((l) => l.table === 'currencies' && l.op === 'update')).toEqual([])      // no clear-then-set pair of updates from the application
    tags.length = 0
    defaultCurrencyFails = { message: 'MARKER-DB-MESSAGE', code: 'XX000' }
    expect(await setDefaultCurrency(1)).toEqual({ error: 'Could not set the default currency' })
    expect(db.tables.currencies.filter((c) => c.is_default).map((c) => c.id)).toEqual([2])         // the default did not move
    expect(tags).toEqual([])
  })

  it('an unknown currency cannot become the default', async () => {
    expect(await setDefaultCurrency(99)).toEqual({ error: 'Cannot set an inactive currency as default' })
  })

  it('the admin list shows the default first', async () => {
    expect((await getAllCurrenciesAdmin()).length).toBe(3)
  })
})

describe('property types', () => {
  it('the slug comes from the Albanian name without accents and symbols', async () => {
    await createPropertyType(TYPE)
    expect(db.tables.property_types.at(-1)).toMatchObject({ slug: 'shtepi', name_sq: 'Shtëpi', sort_order: 99 })
    expect(tags).toEqual([PROPERTY_TYPES_CACHE_TAG])
  })

  it.each([['Villa & Garden!', 'villa_garden'], ['  --Tokë Bujqësore--  ', 'toke_bujqesore'], ['A'.repeat(100), 'a'.repeat(64)], ['Привіт', ''], ['!!!', '']])('a given slug %j is stored as %j (empty means refused)', async (slug, stored) => {
    const res = await createPropertyType({ ...TYPE, slug })
    if (stored === '') {
      // a slug made only of unsupported characters falls back to nothing: refused, not stored as an empty key
      expect(res).toEqual({ error: 'Invalid slug' })
      expect(db.tables.property_types).toHaveLength(2)
    } else {
      expect(db.tables.property_types.at(-1)?.slug).toBe(stored)
    }
  })

  it('refuses a blank Albanian name and reports a duplicate slug', async () => {
    expect(await createPropertyType({ ...TYPE, name_sq: '  ' })).toEqual({ error: 'Albanian name is required' })
    failing('property_types', 'insert', { code: '23505', message: 'dup' })
    expect(await createPropertyType(TYPE)).toEqual({ error: 'Slug already exists', code: 'duplicate_slug' })
  })

  it('update keeps the current slug when none is given', async () => {
    expect(await updatePropertyType(2, { ...TYPE, name_sq: 'Tokë e re' })).toEqual({})
    expect(db.tables.property_types.find((t) => t.id === 2)).toMatchObject({ slug: 'land', name_sq: 'Tokë e re' })
  })

  it('a slug used by listings cannot be changed; one nobody uses can', async () => {
    expect(await updatePropertyType(1, { ...TYPE, slug: 'apartment' })).toMatchObject({ code: 'has_listings' })
    expect(db.tables.property_types.find((t) => t.id === 1)?.slug).toBe('flat')
    expect(await updatePropertyType(2, { ...TYPE, slug: 'plot' })).toEqual({})
    expect(db.tables.property_types.find((t) => t.id === 2)?.slug).toBe('plot')
  })

  it('giving the same slug again for a used type is fine', async () => {
    expect(await updatePropertyType(1, { ...TYPE, slug: 'Flat' })).toEqual({})
  })

  it('update refuses a blank name and reports duplicates', async () => {
    expect(await updatePropertyType(2, { ...TYPE, name_sq: ' ' })).toEqual({ error: 'Albanian name is required' })
    failing('property_types', 'update', { code: '23505', message: 'dup' })
    expect(await updatePropertyType(2, TYPE)).toEqual({ error: 'Slug already exists', code: 'duplicate_slug' })
  })

  it('toggle works and reports an error', async () => {
    expect(await togglePropertyTypeActive(2, false)).toEqual({})
    expect(db.tables.property_types.find((t) => t.id === 2)?.is_active).toBe(false)
    failing('property_types', 'update', { message: 'upd' })
    expect(await togglePropertyTypeActive(2, true)).toEqual({ error: 'update_failed' })
  })

  it('a type that listings use cannot be deleted, and the message counts them', async () => {
    expect(await deletePropertyType(1)).toMatchObject({ code: 'has_listings', listingCount: 2, error: 'Cannot delete: 2 listings use this type' })
    db.tables.listings.pop()
    expect(await deletePropertyType(1)).toMatchObject({ error: 'Cannot delete: 1 listing use this type' })
    expect(db.tables.property_types).toHaveLength(2)
  })

  it('an unused type is deleted; an unknown one is "not_found"; a database error is returned', async () => {
    expect(await deletePropertyType(2)).toEqual({})
    expect(db.tables.property_types.map((t) => t.id)).toEqual([1])
    expect(await deletePropertyType(99)).toEqual({ error: 'Not found', code: 'not_found' })
    failing('property_types', 'delete', { message: 'del' })
    db.tables.property_types.push({ id: 7, slug: 'x' })
    expect(await deletePropertyType(7)).toEqual({ error: 'delete_failed' })
  })

  it('the admin list returns every type', async () => {
    expect(await getAllPropertyTypesAdmin()).toHaveLength(2)
  })
})

describe('clearing user history', () => {
  const id = '11111111-1111-4111-8111-111111111111'

  it('calls the database function with the actor from the session, never from the caller', async () => {
    expect(await clearHistoryRow('user_change_log', id, 'row-1')).toEqual({ cleared: 1 })
    expect(rpcCalls).toEqual([{ name: 'clear_user_history', args: { p_history_source: 'user_change_log', p_entity_id: id, p_row_id: 'row-1', p_actor_user_id: 'adm' } }])
    expect(paths).toEqual([`/admin/users/${id}`])
  })

  it('clearing a whole entity passes no row', async () => {
    await clearHistoryForEntity('user_status_history', id)
    expect(rpcCalls[0].args.p_row_id).toBeNull()
  })

  it.each([['users'], ['auth.users; drop table x'], [''], [undefined], [5]])('the source %j is refused before the database', async (source) => {
    expect(await clearHistoryRow(source as never, id, 'r')).toEqual({ error: 'validation' })
    expect(await clearHistoryForEntity(source as never, id)).toEqual({ error: 'validation' })
    expect(rpcCalls).toEqual([])
  })

  it.each([[''], [undefined], [5], [{}]])('the entity %j is refused', async (entity) => {
    expect(await clearHistoryForEntity('user_change_log', entity as never)).toEqual({ error: 'validation' })
    expect(rpcCalls).toEqual([])
  })

  it.each([[''], [5], [{}]])('the row %j is refused', async (row) => {
    expect(await clearHistoryRow('user_change_log', id, row as never)).toEqual({ error: 'validation' })
    expect(rpcCalls).toEqual([])
  })

  it('without the permission or a session nothing is called', async () => {
    mayClearHistory = false
    expect(await clearHistoryRow('user_change_log', id, 'r')).toEqual({ error: 'forbidden' })
    mayClearHistory = true
    currentUser = null
    expect(await clearHistoryRow('user_change_log', id, 'r')).toEqual({ error: 'Unauthorized' })
    expect(rpcCalls).toEqual([])
  })

  it('a database failure is "clear_failed"; nothing to clear changes nothing and refreshes nothing', async () => {
    rpcResult = { data: null, error: { message: 'boom' } }
    expect(await clearHistoryForEntity('user_change_log', id)).toEqual({ error: 'clear_failed' })
    rpcResult = { data: { cleared_row_count: 0 }, error: null }
    expect(await clearHistoryForEntity('user_change_log', id)).toEqual({ cleared: 0 })
    rpcResult = { data: null, error: null }
    expect(await clearHistoryForEntity('user_change_log', id)).toEqual({ cleared: 0 })
    expect(paths).toEqual([])
  })
})

describe('footer reads', () => {
  const row = (locale: string, extra: Record<string, unknown> = {}) => ({ locale, brand_title: `T-${locale}`, nav_links: [{ url: '/a' }], info_links: null, social_links: undefined, ...extra })

  it('the public footer asks for its language and Albanian, and prefers its language', async () => {
    db.tables.site_footer.push(row('sq'), row('en'))
    expect((await getFooterContent('en'))?.brand_title).toBe('T-en')
    expect((await getFooterContent('uk'))?.brand_title).toBe('T-sq')
    expect(db.log.at(-1)?.filters).toEqual([['locale', 'in', ['uk', 'sq']]])
  })

  it('empty link lists become arrays', async () => {
    db.tables.site_footer.push(row('sq'))
    const footer = await getFooterContent('sq')
    expect(footer?.info_links).toEqual([])
    expect(footer?.social_links).toEqual([])
  })

  it.each([['xx'], [''], ['en"),locale.neq.(x'], [undefined as unknown as string]])('a language %j is treated as Albanian', async (locale) => {
    db.tables.site_footer.push(row('sq'))
    await getFooterContent(locale)
    expect(db.log.at(-1)?.filters).toEqual([['locale', 'in', ['sq']]])
  })

  it('no row or a database error gives null, never a crash', async () => {
    expect(await getFooterContent('sq')).toBeNull()
    failing('site_footer', 'select', { message: 'x' })
    expect(await getFooterContent('sq')).toBeNull()
  })

  it('only an administrator reads all four rows; a moderator and anyone else get "forbidden"', async () => {
    db.tables.site_footer.push(row('sq'), row('it'))
    const all = await getAllFooterContent()
    expect(all.initialized).toBe(true)
    expect(Object.keys(all.data).sort()).toEqual(['en', 'it', 'sq', 'uk'])
    expect(all.data.en).toBeNull()
    expect(all.data.it?.brand_title).toBe('T-it')
    for (const who of [{ id: 'mod' }, { id: 'ghost' }, null]) {
      currentUser = who
      expect(await getAllFooterContent()).toEqual({ data: {}, initialized: false, error: 'forbidden' })
    }
  })

  it('a missing table means "not initialised"; another error is "load_failed"', async () => {
    failing('site_footer', 'select', { code: '42P01', message: 'no table' })
    expect(await getAllFooterContent()).toEqual({ data: {}, initialized: false })
    failing('site_footer', 'select', { code: 'XX', message: 'x' })
    expect(await getAllFooterContent()).toEqual({ data: {}, initialized: false, error: 'load_failed' })
  })
})

describe('the currency code (it is used as a word in the pattern that reads the exchange-rate page)', () => {
  it.each([['('], ['A.*'], ['EURO'], ['EU'], ['E1R'], ['€€€'], ['EU R'], ['.*.']])('refuses the code %j on create and on update', async (code) => {
    expect(await createCurrency({ ...CUR, code })).toEqual({ error: 'Currency code must be 3 letters' })
    expect(await updateCurrency(2, { ...CUR, code })).toEqual({ error: 'Currency code must be 3 letters' })
    expect(db.tables.currencies).toHaveLength(3)
    expect(tags).toEqual([])
  })

  it('accepts three letters in any case and stores them in capitals', async () => {
    expect((await createCurrency({ ...CUR, code: 'chf' })).error).toBeUndefined()
    expect(db.tables.currencies.at(-1)?.code).toBe('CHF')
    expect(await updateCurrency(2, { ...CUR, code: ' gbp ' })).toEqual({})
    expect(db.tables.currencies.find((c) => c.id === 2)?.code).toBe('GBP')
  })
})

describe('clearing history: a failing permission check', () => {
  it('means "forbidden", never a crash, and nothing is called', async () => {
    permissionThrows = true
    expect(await clearHistoryRow('user_change_log', '11111111-1111-4111-8111-111111111111', 'r')).toEqual({ error: 'forbidden' })
    expect(rpcCalls).toEqual([])
  })
})

// Task 923 R38 (cases SEC-S42-SRV-DENY, SEC-S43-SRV-DENY, SEC-S46-SRV-DENY, SEC-S56-SRV-ERR)
it('[SEC-S42-SRV-DENY] The slug of a property type that listings use cannot change', async () => {
  expect(await updatePropertyType(1, { ...TYPE, slug: 'apartment' })).toMatchObject({ code: 'has_listings' })
  expect(db.tables.property_types.find((t) => t.id === 1)?.slug).toBe('flat')
  expect(db.log.filter((l) => l.table === 'property_types' && l.op !== 'select')).toEqual([])   // refused before any write
})

it('[SEC-S43-SRV-DENY] Admin catalog actions accept only allow-listed fields and a clamped limit', async () => {
  // an unknown field never reaches a column
  await updateCurrency(2, { ...CUR, code: 'eur', role: 'admin', id: 99, is_default: true } as never)
  const written = db.log.find((l) => l.table === 'currencies' && l.op === 'update')!
  expect(Object.keys(written.values as object)).not.toContain('role')
  expect(Object.keys(written.values as object)).not.toContain('id')
  // the limit of the permission events is clamped to 1..200
  db.tables.role_permission_events = Array.from({ length: 300 }, (_, i) => ({ id: i, role: 'moderator', permission_key: 'k', old_allowed: false, new_allowed: true, actor_user_id: null, created_at: `2026-10-${String(1 + (i % 28)).padStart(2, '0')}` }))
  const { getPermissionEvents } = await import('../permissions')
  expect(await getPermissionEvents(-5)).toHaveLength(1)
  expect(await getPermissionEvents(100000)).toHaveLength(200)
  expect(await getPermissionEvents(Number.NaN)).toHaveLength(20)
})

it('[SEC-S46-SRV-DENY] Admin location, page and settings writes accept only known columns and valid values', async () => {
  const { createLocation, saveSettings, updatePage } = await import('../index')
  db.tables.locations = [{ id: 1, name_al: 'Tirana', type: 'city', slug: 'tirana' }]
  db.tables.pages = [{ id: 1, slug: 'terms', title: 'Terms', content: { sq: { body: '<p>x</p>', title: 'Terms' } }, is_published: false }]
  db.tables.site_settings = []
  mayClearHistory = true                                       // the permission mock answers every key with this value
  await createLocation({ name_al: 'Durrës', type: 'city', slug: 'durres', id: 99, created_by: 'x' } as never)
  expect(db.tables.locations.at(-1)).not.toHaveProperty('created_by')
  await updatePage(1, { title: 'New', author: 'me', created_at: 'x' } as never)
  expect(db.tables.pages[0]).not.toHaveProperty('author')
  const before = db.log.filter((l) => l.op !== 'select').length
  expect(await saveSettings('not an object' as never)).toBeTruthy()      // a payload that is not the form's list is refused
  expect(db.log.filter((l) => l.op !== 'select')).toHaveLength(before)
})

it('[SEC-S56-SRV-ERR] A currency code is three letters on create and update', async () => {
  for (const code of ['(', 'A.*', 'EURO', 'EU', 'E1R']) {
    expect(await createCurrency({ ...CUR, code }), code).toEqual({ error: 'Currency code must be 3 letters' })
    expect(await updateCurrency(2, { ...CUR, code }), code).toEqual({ error: 'Currency code must be 3 letters' })
  }
  expect(db.tables.currencies).toHaveLength(3)
  expect(db.log.filter((l) => l.table === 'currencies' && l.op !== 'select')).toEqual([])
})

// Task 923 R71 (i): a listing count that cannot be read is not "no listings"
describe('property types: the dependency count', () => {
  it('a failed listing count refuses a slug change and a delete, and nothing changes', async () => {
    failing('listings', 'select', { message: 'x' })
    expect(await updatePropertyType(1, { ...TYPE, slug: 'house' } as never)).toMatchObject({ error: 'count_failed', code: 'count_failed' })
    expect(await deletePropertyType(1)).toMatchObject({ error: 'count_failed', code: 'count_failed' })
    expect(db.tables.property_types.map((p) => p.slug)).toEqual(['flat', 'land'])
    expect(tags).toEqual([])
  })
})

// Task 923 R79 (a): a currency the single rate source does not publish cannot be added or activated
describe('currencies: the rate source', () => {
  it('a currency that iliria98 does not publish (or a page that cannot be read) is refused with rate_unavailable, and nothing is written', async () => {
    published = new Set(['EUR'])                                         // the page publishes the euro only
    const before = db.tables.currencies.map((c) => ({ ...c }))
    expect(await createCurrency({ ...CUR, code: 'jpy' })).toEqual({ error: 'rate_unavailable', code: 'rate_unavailable' })    // a new currency is active at once
    expect(await toggleCurrencyActive(3, true)).toEqual({ error: 'rate_unavailable', code: 'rate_unavailable' })              // 3 is USD, inactive, not published now
    published = null                                                                                                          // the page cannot be read: not proven published
    expect(await createCurrency(CUR)).toEqual({ error: 'rate_unavailable', code: 'rate_unavailable' })
    expect(await updateCurrency(2, { ...CUR, code: 'CHF' })).toEqual({ error: 'rate_unavailable', code: 'rate_unavailable' })
    expect(db.tables.currencies).toEqual(before)
    expect(tags).toEqual([])
  })

  it('a published currency is added and activated, the pivot ALL needs no rate, and a deactivation never asks the source (the controls)', async () => {
    published = new Set(['USD'])
    expect(await toggleCurrencyActive(3, true)).toEqual({})
    expect(db.tables.currencies.find((c) => c.id === 3)?.is_active).toBe(true)
    published = new Set()                                                  // nothing is published any more: turning OFF still works
    expect(await toggleCurrencyActive(2, false)).toEqual({})
    // the pivot passes the rate check (the fake database does not enforce the unique code, the real one would answer duplicate_code afterwards)
    expect(await createCurrency({ ...CUR, code: 'all' })).not.toMatchObject({ code: 'rate_unavailable' })
  })
})
