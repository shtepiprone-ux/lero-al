// @vitest-environment node
/**
 * Security (Task 923 R75, owner decisions D48 / D55): every action that admits a moderator checks a permission key the administrator sets.
 *  - SEC-X-SRV-MOD-KEYS: two proofs.
 *      1. A scan of every action file lists each exported action whose guard admits a moderator and fails on one that names no key (the key may be in the action or in the
 *         one guard it calls). The upload routes that admit a moderator are checked the same way.
 *      2. A moderator is refused WITHOUT the key and reaches the database WITH it, for one action of every key (eight keys); an administrator needs no row; the permission is read
 *         on every check (a switch changed between two calls applies to the second one: it is never cached).
 * The real guards, permission helpers and actions run; the identity, the `role_permissions` table and the rest of the database are doubles. Every id is synthetic.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  role: 'moderator' as string,
  allowedKeys: new Set<string>(),
  /** database accesses that are not the permission read or the viewer / rank reads */
  reached: [] as string[],
}))

function chain(table: string): unknown {
  // the `users` table answers the rank read of an account action (the acting staff member and an ordinary target), so a call that passes its guard is not stopped by the rank rule
  const rows = table === 'users' ? [{ id: 'staff-1', role: state.role }, { id: 'u1', role: 'user' }]
    : table === 'listings' ? [{ id: 'l1', user_id: 'another-owner', status: 'active' }]   // a listing of ANOTHER person: the moderator is not its owner
    : []
  const answer = { data: rows, error: null, count: 0 }
  const proxy: unknown = new Proxy(function () {}, {
    get: (_t, key) => {
      if (key === 'then') return (resolve: (v: unknown) => void) => resolve(answer)
      if (key === 'single' || key === 'maybeSingle') return async () => ({ data: (table === 'users' ? rows[1] : rows[0]) ?? null, error: null })
      return () => proxy
    },
    apply: () => proxy,
  })
  return proxy
}

vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: true, userId: 'staff-1', role: state.role }) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: 'staff-1' }) }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'role_permissions') {
        let key = ''
        const c: Record<string, unknown> = {}
        c.select = () => c
        c.eq = (column: string, value: string) => { if (column === 'permission_key') key = value; return c }
        c.maybeSingle = async () => ({ data: { allowed: state.allowedKeys.has(key) }, error: null })
        return c
      }
      // the rank / role reads of an account are part of the guard's own work; everything else is "the action got past its guard"
      if (table !== 'users') state.reached.push(table)
      return chain(table)
    },
    rpc: () => { state.reached.push('rpc'); return chain('rpc') },
    auth: { admin: new Proxy({}, { get: () => async () => { state.reached.push('auth.admin'); return { data: { user: null, users: [] }, error: null } } }) },
  }),
}))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: (t: string) => { state.reached.push(`session.${t}`); return chain(t) } }) }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, set: () => undefined, getAll: () => [] }), headers: async () => ({ get: () => null }) }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: async () => undefined }))
vi.mock('@/lib/getExchangeRateServer', () => ({ isRatePublished: async () => true }))   // the single rate source (Task 923 R79): published, so the catalogue actions reach their database
vi.mock('@/modules/notifications/lib/createNotification', () => ({ createNotification: async () => undefined }))
vi.mock('@/modules/notifications/lib/emails/send', () => ({ sendEmail: async () => ({ id: 'x' }) }))
vi.mock('@/modules/notifications/lib/emails/contactInquiry', () => ({ sendContactInquiryReply: async () => ({ ok: true }), sendContactInquiryNotification: async () => ({ ok: true }) }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => { state.reached.push('gateway'); return { ok: true, nextStatus: 'inactive', listingId: 'l1' } } }))

const CURRENCY = { code: 'XXX', symbol: 'x', name_sq: 'a', name_en: 'a', name_uk: 'a', name_it: 'a' }

// ── 1. the scan ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** the action files (a Server Action file keeps its guard in the file) */
const ACTION_FILES = [
  'src/modules/admin/actions/index.ts',
  'src/modules/admin/actions/currencies.ts',
  'src/modules/admin/actions/propertyTypes.ts',
  'src/modules/admin/actions/clearHistory.ts',
  'src/modules/admin/actions/footer.ts',
  'src/modules/companies/actions.ts',
  'src/modules/contacts/actions/index.ts',
  'src/modules/locations/actions/popularLocationActions.ts',
  'src/modules/notifications/actions/emailTemplates.ts',
  'src/modules/listings/actions/changeListingStatus.ts',
]
/** the calls that admit a moderator: the staff guard without `adminOnly`, and the local wrappers around it */
const ADMITS = /\b(checkStaff\((?![^)]*adminOnly)|resolveAdminActor\(|assertAdminAccess\(|requireViewer\()/
const HAS_KEY = /\b(assertPermission|hasPermission|roleHasPermission)\(\s*'|permission:\s*'|resolveAdminActor\('|assertAdminAccess\('/

function functions(text: string): Array<{ name: string; exported: boolean; body: string }> {
  const out: Array<{ name: string; exported: boolean; body: string; start: number }> = []
  const re = /^(export )?(?:async )?function (\w+)\s*\(/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) out.push({ name: m[2], exported: !!m[1], body: '', start: m.index })
  out.forEach((f, i) => { f.body = text.slice(f.start, i + 1 < out.length ? out[i + 1].start : text.length) })
  return out
}

describe('moderatorKeys', () => {
  // the title is the exact name the D8_D9 contract maps (`moderatorKeys [SEC-X-SRV-MOD-KEYS] every moderator action checks its key`); the body is unchanged
  it('[SEC-X-SRV-MOD-KEYS] every moderator action checks its key', async () => {
    const offenders: string[] = []
    let admitting = 0
    for (const file of ACTION_FILES) {
      const text = readFileSync(join(process.cwd(), file), 'utf8')
      const fns = functions(text)
      const helper = new Map(fns.filter((f) => !f.exported).map((f) => [f.name, f]))
      const admits = (body: string, seen = new Set<string>()): boolean => ADMITS.test(body) || [...helper.keys()].some((h) => !seen.has(h) && new RegExp(`\\b${h}\\(`).test(body) && admits(helper.get(h)!.body, seen.add(h)))
      const keyed = (body: string, seen = new Set<string>()): boolean => HAS_KEY.test(body) || [...helper.keys()].some((h) => !seen.has(h) && new RegExp(`\\b${h}\\(`).test(body) && keyed(helper.get(h)!.body, seen.add(h)))
      for (const fn of fns.filter((f) => f.exported)) {
        if (!admits(fn.body)) continue
        admitting++
        if (!keyed(fn.body)) offenders.push(`${file}#${fn.name}`)
      }
    }
    expect(admitting, 'the scanner found the actions that admit a moderator').toBeGreaterThan(20)
    // the actions that admit a moderator by design but need no key of their own are none: an exception would be listed here with its reason
    expect(offenders, `these actions admit a moderator and check no key:\n${offenders.join('\n')}`).toEqual([])

    // the routes that admit a moderator
    const logo = readFileSync(join(process.cwd(), 'src/app/api/upload-company-logo/route.ts'), 'utf8')
    const avatar = readFileSync(join(process.cwd(), 'src/app/api/upload-avatar/route.ts'), 'utf8')
    const popular = readFileSync(join(process.cwd(), 'src/app/api/upload-popular-location-photo/route.ts'), 'utf8')
    const cms = readFileSync(join(process.cwd(), 'src/app/api/upload-cms-image/route.ts'), 'utf8')
    expect(logo).toMatch(/checkStaff\(\{ permission: 'companies\.manage' \}\)/)
    expect(avatar).toMatch(/roleHasPermission\([^)]*'users\.edit'\)/)
    expect(popular).toMatch(/roleHasPermission\(role, 'locations\.manage'\)/)
    expect(cms).toMatch(/assertPermission\('legal\.manage'\)/)

    // every key has a label and a hint in the four locales
    const { PERMISSION_KEYS } = await import('@/lib/auth/permissionKeys')
    for (const locale of ['sq', 'en', 'uk', 'it']) {
      const messages = JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8')) as { admin: { permissions: { keys: Record<string, string>; descriptions: Record<string, string> } } }
      for (const key of PERMISSION_KEYS) {
        const slug = key.replace('.', '_')
        expect(messages.admin.permissions.keys[slug], `${locale} label of ${key}`).toBeTruthy()
        expect(messages.admin.permissions.descriptions[slug], `${locale} hint of ${key}`).toBeTruthy()
      }
    }
  })

  // ── 2. the keys at work ───────────────────────────────────────────────────────────────────────────────────────────────────────
  it('a moderator is refused without the key and passes the guard with it; an administrator needs none; a switch applies to the very next call', async () => {
    const admin = await import('@/modules/admin/actions')
    const currencies = await import('@/modules/admin/actions/currencies')
    const types = await import('@/modules/admin/actions/propertyTypes')
    const templates = await import('@/modules/notifications/actions/emailTemplates')
    const contacts = await import('@/modules/contacts/actions')
    const companies = await import('@/modules/companies/actions')
    const listings = await import('@/modules/listings/actions/changeListingStatus')

    const CASES: Array<[string, string, () => Promise<unknown>]> = [
      ['users.edit', 'updateUserProfile', () => admin.updateUserProfile('u1', { name: 'X' })],
      ['users.edit', 'removeUserAvatar', () => admin.removeUserAvatar('u1')],
      ['users.verify', 'toggleUserVerified', () => admin.toggleUserVerified('u1', true)],
      ['support.manage', 'updateTicketStatus', () => admin.updateTicketStatus('t1', 'open')],
      ['support.manage', 'searchUsersForPicker', () => admin.searchUsersForPicker('alba')],
      ['inquiries.manage', 'updateInquiryStatus', () => contacts.updateInquiryStatus('q1', 'closed')],
      ['catalog.manage', 'createCurrency', () => currencies.createCurrency(CURRENCY)],
      ['catalog.manage', 'createPropertyType', () => types.createPropertyType({ name_sq: 'a', name_en: 'a', name_uk: 'a', name_it: 'a' })],
      ['email_templates.manage', 'upsertEmailTemplateAction', () => templates.upsertEmailTemplateAction({ key: 'k', locale: 'en', subject: 's', html_body: '<p>x</p>', variables: [], is_active: true })],
      ['companies.manage', 'updateCompanyAction', () => companies.updateCompanyAction('c1', { name: 'N' } as never)],
      ['listings.moderate', 'updateListingStatus', () => admin.updateListingStatus('l1', 'inactive')],
      ['listings.moderate', 'changeListingStatusAction', () => listings.changeListingStatusAction('l1', 'inactive')],
      ['locations.manage', 'approveLocationRequest', () => admin.approveLocationRequest('u1', 1)],
    ]
    const run = async (fn: () => Promise<unknown>) => { try { return await fn() } catch (e) { return `threw:${(e as Error).message}` } }
    const keysCovered = new Set(CASES.map((c) => c[0]))
    for (const key of ['users.edit', 'users.verify', 'support.manage', 'inquiries.manage', 'catalog.manage', 'email_templates.manage', 'companies.manage', 'listings.moderate']) {
      expect(keysCovered.has(key), `a case for ${key}`).toBe(true)
    }

    for (const [key, name, call] of CASES) {
      // a moderator WITHOUT the key
      state.role = 'moderator'; state.allowedKeys = new Set(); state.reached = []
      const refused = await run(call)
      expect(JSON.stringify(refused).toLowerCase(), `${name} without ${key}`).toMatch(/forbidden|unauthori/)
      // (the status action reads the listing's OWNER to know whether the moderator is acting on another person's listing; it never reaches the gateway)
      expect(state.reached.filter((r) => r !== 'listings'), `${name} without ${key}: nothing was written and the gateway was not reached`).toEqual([])

      // the same moderator WITH the key (switched on between the two calls: nothing is cached)
      state.allowedKeys = new Set([key]); state.reached = []
      const allowed = await run(call)
      expect(JSON.stringify(allowed ?? '').toLowerCase(), `${name} with ${key}`).not.toMatch(/forbidden|unauthori/)

      // an administrator needs no row at all
      state.role = 'admin'; state.allowedKeys = new Set(); state.reached = []
      const admin_ = await run(call)
      expect(JSON.stringify(admin_ ?? '').toLowerCase(), `${name} as administrator`).not.toMatch(/forbidden|unauthori/)
    }

    // and switched off again: the very next call is refused
    state.role = 'moderator'; state.allowedKeys = new Set(['catalog.manage'])
    expect(await run(() => currencies.createCurrency(CURRENCY))).not.toMatchObject({ error: 'forbidden' })
    state.allowedKeys = new Set()
    expect(await run(() => currencies.createCurrency(CURRENCY))).toMatchObject({ error: 'forbidden' })
  })

  beforeEach(() => {
    state.role = 'moderator'
    state.allowedKeys = new Set()
    state.reached = []
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })
})
