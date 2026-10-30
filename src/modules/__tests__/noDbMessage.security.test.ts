// @vitest-environment node
/**
 * Security (Task 923 R71 (f)): no database message reaches the browser.
 *  - SEC-X-SRV-NO-DB-MESSAGE: a database error's `message` can name tables, columns, constraints and policies. Every Server Action and route handler returns a FIXED code and
 *    logs the message. Two proofs:
 *      1. a scan of every action file and API route lists each place where a caught error's `.message` is put into an answer, and fails on any that is not in the short list
 *         of places that are on purpose (an Auth message the form maps itself) or still open with the reason;
 *      2. the actions that were changed are run against a database in which every write fails with a marker message: the marker is in no answer.
 * The real actions run; the identity, the permission helpers and the database are doubles. The marker is synthetic.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const MARKER = 'MARKER-DB-MESSAGE relation "secret_table" violates constraint "secret_fk"'

// ── a database whose every write fails with the marker, and whose reads answer with a plausible row ──────────────────────────────────
function failingChain(): unknown {
  const answer = { data: null, error: { message: MARKER, code: 'XX000' } }
  const chain: unknown = new Proxy(function () {}, {
    get: (_t, key) => {
      if (key === 'then') return (resolve: (v: unknown) => void) => resolve(answer)
      return chain
    },
    apply: () => chain,
  })
  return chain
}
function rowChain(row: Record<string, unknown>): unknown {
  const chain: unknown = new Proxy(function () {}, {
    get: (_t, key) => {
      if (key === 'then') return (resolve: (v: unknown) => void) => resolve({ data: [row], error: null, count: 1 })
      if (key === 'single' || key === 'maybeSingle') return async () => ({ data: row, error: null })
      if (['insert', 'update', 'delete', 'upsert'].includes(String(key))) return () => failingChain()
      return chain
    },
    apply: () => chain,
  })
  return chain
}
const db = { from: () => rowChain({ id: 1, user_id: 'user-1', is_active: true, is_default: false, code: 'EUR', role: 'admin', status: 'active', slug: 'x' }), rpc: () => failingChain(), auth: { admin: {} } }

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: 'user-1', email: 'person@example.com' }) }))
vi.mock('@/lib/auth/requireViewer', () => ({ requireViewer: async () => ({ ok: true, userId: 'user-1', role: 'admin' }) }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('@/lib/auth/permissions', () => ({ hasPermission: async () => true, assertPermission: async () => undefined, roleHasPermission: async () => true }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ get: () => undefined, set: () => undefined, getAll: () => [] }) }))
vi.mock('@/lib/cloudinaryDelete', () => ({ deleteAsset: async () => undefined }))
vi.mock('@/lib/getExchangeRateServer', () => ({ isRatePublished: async () => true }))   // the single rate source (Task 923 R79): published, so the catalogue actions reach their database

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })

// ── 1. the scan ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function files(dir: string, test: (path: string) => boolean, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) { if (entry.name !== '__tests__' && entry.name !== 'node_modules') files(full, test, out) }
    else if (test(full)) out.push(full)
  }
  return out.sort()
}
const rel = (path: string) => path.slice(process.cwd().length + 1).split('\\').join('/')

/** places where a caught error's message is deliberately returned, with the reason */
const ON_PURPOSE: Record<string, string> = {
  'src/modules/auth/actions/captcha.ts': 'the sign-up and reset forms map Supabase AUTH\'s own message (not a database message) to their text; the action also tests it for the word "captcha"',
}
/** places still open at the time of Revision 16, with the reason: they are outside both security contracts of Task 923 and are reported to Opus */
const STILL_OPEN: Record<string, string> = {
  'src/modules/listings/actions/favoriteActions.ts': 'outside the scope of both contracts (two `return { error: error.message }`)',
  'src/app/api/cron/listing-activity/route.ts': 'a cron-secret caller reads it, not a browser; outside the scope of both contracts',
}

describe('noDbMessage', () => {
  it('[SEC-X-SRV-NO-DB-MESSAGE] database messages stay on the server', async () => {
    const sources = [
      ...files(join(process.cwd(), 'src', 'modules'), (p) => /[\\/]actions[\\/][^\\/]+\.ts$/.test(p) && !/\.(test|stories)\./.test(p)),
      ...files(join(process.cwd(), 'src', 'app', 'api'), (p) => /route\.ts$/.test(p)),
    ]
    expect(sources.length, 'the scanner found the action files').toBeGreaterThan(20)
    const offenders: string[] = []
    for (const file of sources) {
      const path = rel(file)
      if (path in ON_PURPOSE) continue
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        // a returned answer that carries a caught error's message: `{ error: error.message }`, `error: e.message`, `${e.message}` inside a JSON answer
        if (/\b(?:error|err|e)\??\.message\b/.test(line) && /(?:return|NextResponse\.json|error:|reason:)/.test(line) && !/console\./.test(line)) {
          if (!(path in STILL_OPEN)) offenders.push(`${path}:${i + 1}: ${line.trim()}`)
        }
      })
    }
    expect(offenders, offenders.join('\n')).toEqual([])
    // the open places must still exist (a fixed one leaves the list)
    for (const path of Object.keys(STILL_OPEN)) {
      const text = readFileSync(join(process.cwd(), path), 'utf8')
      expect(/\.message\b/.test(text), `${path} no longer returns a message: remove it from STILL_OPEN`).toBe(true)
    }

    // 2. the changed actions, with every write failing with the marker
    const answers: unknown[] = []
    const run = async (fn: () => Promise<unknown>) => { try { answers.push(await fn()) } catch (e) { answers.push(String(e)) } }
    const currencies = await import('@/modules/admin/actions/currencies')
    const types = await import('@/modules/admin/actions/propertyTypes')
    const admin = await import('@/modules/admin/actions')
    const collections = await import('@/modules/listings/actions/collectionActions')
    const cabinet = await import('@/modules/cabinet/actions')
    const listings = { create: await import('@/modules/listings/actions/createListing'), update: await import('@/modules/listings/actions/updateListing'), remove: await import('@/modules/listings/actions/deleteListing') }
    const CUR = { code: 'EUR', symbol: '€', name_sq: 'Euro', name_en: 'Euro', name_uk: 'Євро', name_it: 'Euro' }
    await run(() => currencies.createCurrency(CUR))
    await run(() => currencies.updateCurrency(1, CUR))
    await run(() => currencies.toggleCurrencyActive(1, true))
    await run(() => currencies.setDefaultCurrency(1))
    await run(() => currencies.deleteCurrency(1))
    await run(() => types.createPropertyType({ name_sq: 'a', name_en: 'a', name_uk: 'a', name_it: 'a' }))
    await run(() => types.togglePropertyTypeActive(1, true))
    await run(() => types.deletePropertyType(1))
    await run(() => admin.createLocation({ name_al: 'A', type: 'city', slug: 'a' } as never))
    await run(() => admin.updateLocation(1, { name_al: 'B' } as never))
    await run(() => admin.toggleLocationFeatured(1, true))
    await run(() => admin.deleteLocation(1))
    await run(() => collections.renameCollection('c1', 'Name'))
    await run(() => collections.deleteCollection('c1'))
    await run(() => collections.addToCollection('c1', 'l1'))
    await run(() => collections.removeFromCollection('c1', 'l1'))
    await run(() => cabinet.updateLastViewed('s1'))
    await run(() => cabinet.deleteSavedSearch('s1'))
    await run(() => cabinet.deleteAllSavedSearches())
    await run(() => cabinet.updateSavedSearchFrequency('s1', 'daily'))
    await run(() => cabinet.updateSavedSearchNotify('s1', true))
    await run(() => listings.remove.deleteListingAction('00000000-0000-4000-8000-000000000001'))
    await run(() => admin.deleteListing('00000000-0000-4000-8000-000000000001'))
    expect(answers.length).toBeGreaterThan(20)
    expect(JSON.stringify(answers)).not.toContain('MARKER-DB-MESSAGE')
    expect(JSON.stringify(answers)).not.toContain('secret_table')
    void listings.create; void listings.update
  })
})
