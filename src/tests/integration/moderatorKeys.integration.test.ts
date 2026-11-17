/**
 * Real-boundary control for the moderator switches (Task 923 R75, owner decision D55; cases SEC-X-INT-MOD-KEYS-* and SEC-X-INT-PERMS-ADMIN-ALLOW): the REAL `updateUserProfile`
 * and `setModeratorPermission`, with the REAL `requireViewer`, `checkStaff` and the REAL read and write of `role_permissions` / `role_permission_events`, run against REAL
 * Supabase Auth and the REAL database of the approved development project. The only doubles are the cookie-bound client factory (outside a Next request it returns the client
 * that holds the REAL session of the chosen synthetic person) and the cache refresh. The stored switch of `users.edit` is read first and put back exactly as it was, and the audit
 * rows the cases write (they carry the synthetic administrator as actor) are removed and counted here. Synthetic rows only, verified clean-up.
 *  - SEC-X-INT-MOD-KEYS-ALLOW / -DENY: a moderator acts on a profile only while the administrator's switch for `users.edit` is on;
 *  - SEC-X-INT-PERMS-ADMIN-ALLOW: the administrator switches a key off and on again, two values stored and two audit rows;
 *  - SEC-X-INT-MOD-KEYS-<table> (Task 956 AC2, hardening v8b): every write policy that admits a moderator follows the key the application checks for the same write. For each table
 *    and command a moderator SESSION sends the write straight to PostgREST (no action in between): with the key switched off it changes nothing, with the key switched on it
 *    changes the row, and an administrator session changes it with every key off. The 13 stored switches are put back exactly as they were, and the rows of the run are removed and counted.
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> npm run test:security-integration
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { escapeLike } from '@/lib/postgrest/escape'
import { createRun, type Run, type SyntheticUser } from '@/tests/integration/fixtures'

const acting = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => acting.client }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined, updateTag: () => undefined, unstable_cache: (fn: unknown) => fn }))

import { updateUserProfile } from '@/modules/admin/actions'
import { setModeratorPermission } from '@/modules/admin/actions/permissions'

const KEY = 'users.edit'
/** the keys the write policies of hardening v8b ask for (Task 956): each is switched off and on by the matrix below, and put back as it was */
const MATRIX_KEYS = ['listings.moderate', 'listings.delete', 'legal.manage', 'locations.manage', 'catalog.manage', 'reports.manage', 'reports.delete', 'settings.manage',
  'support.manage', 'users.verify', 'companies.manage', 'email_templates.manage', 'inquiries.manage'] as const
/** every table whose rows the matrix writes, with the column the run's prefix is in (the clean-up deletes by it, the final check counts by it) */
const PREFIXED: [table: string, column: string][] = [['amenities', 'name_al'], ['companies', 'name'], ['contact_inquiries', 'name'], ['email_templates', 'key'],
  ['listing_reports', 'comment'], ['locations', 'slug'], ['pages', 'slug'], ['site_settings', 'key'], ['support_tickets', 'subject'], ['verification_requests', 'document_url']]
let run: Run
let moderator: SyntheticUser
let administrator: SyntheticUser
let target: SyntheticUser
let storedSwitch: Record<string, unknown> | null
const storedKeys = new Map<string, Record<string, unknown> | null>()
let matrixListingId = ''

beforeAll(async () => {
  run = createRun()
  moderator = await run.makeUser('keys-moderator', { role: 'moderator' })
  administrator = await run.makeUser('keys-administrator', { role: 'admin' })
  target = await run.makeUser('keys-target', { role: 'user' })
  const row = await run.admin.from('role_permissions').select('*').eq('role', 'moderator').eq('permission_key', KEY).maybeSingle()
  expect(row.error, 'the stored switch is readable').toBeNull()
  storedSwitch = row.data
  for (const key of MATRIX_KEYS) {
    const stored = await run.admin.from('role_permissions').select('*').eq('role', 'moderator').eq('permission_key', key).maybeSingle()
    expect(stored.error, `the stored switch ${key} is readable`).toBeNull()
    storedKeys.set(key, stored.data)
  }
  matrixListingId = (await run.makeListing(target.id, 'active', 'keys-parent')).id
})
afterAll(async () => {
  // the stored switch goes back exactly as it was; the audit rows of this run (their actor is the synthetic administrator) are removed
  const restored = storedSwitch
    ? await run.admin.from('role_permissions').upsert(storedSwitch, { onConflict: 'role,permission_key' })
    : await run.admin.from('role_permissions').delete().eq('role', 'moderator').eq('permission_key', KEY)
  expect(restored.error, 'the stored switch is restored').toBeNull()
  for (const [key, stored] of storedKeys) {
    const back = stored
      ? await run.admin.from('role_permissions').upsert(stored, { onConflict: 'role,permission_key' })
      : await run.admin.from('role_permissions').delete().eq('role', 'moderator').eq('permission_key', key)
    expect(back.error, `the stored switch ${key} is restored`).toBeNull()
  }
  await run.admin.from('role_permission_events').delete().eq('actor_user_id', administrator.id)
  const events = await run.admin.from('role_permission_events').select('id').eq('actor_user_id', administrator.id)
  expect(events.error).toBeNull()
  expect(events.data, 'no audit row of this run is left').toEqual([])
  // the rows of the matrix: deleted by the run's prefix (translations, replies, actions and events go with their parents), then counted
  for (const [table, column] of PREFIXED) await run.admin.from(table).delete().like(column, `${escapeLike(run.RUN)}%`)
  for (const [table, column] of PREFIXED) {
    const left = await run.admin.from(table).select('*', { count: 'exact', head: true }).like(column, `${escapeLike(run.RUN)}%`)
    expect(left.error, `${table}: the remaining rows of this run can be counted`).toBeNull()
    expect(left.count, `${table}: no row of this run is left`).toBe(0)
  }
  const result = await run.cleanup()
  expect(result, 'the synthetic rows of this run are removed and that is verified').toEqual({ verified: true, remaining: 0, errors: [] })
})

const setSwitch = async (allowed: boolean) => {
  const written = await run.admin.from('role_permissions').upsert({ role: 'moderator', permission_key: KEY, allowed }, { onConflict: 'role,permission_key' })
  expect(written.error, `the switch ${KEY} is set to ${allowed} for this case`).toBeNull()
}
const nameOf = async () => (await run.admin.from('users').select('name').eq('id', target.id).single()).data?.name

describe('moderatorKeys', () => {
  it('[SEC-X-INT-MOD-KEYS-ALLOW] a moderator with the key acts', async () => {
    await setSwitch(true)
    acting.client = moderator.client
    const original = await nameOf()
    const renamed = `${run.RUN} keyed rename`
    expect(await updateUserProfile(target.id, { name: renamed }), 'the moderator with users.edit changes the profile').toEqual({})
    expect(await nameOf(), 'the change is stored').toBe(renamed)
    // restored by the test
    expect((await run.admin.from('users').update({ name: original }).eq('id', target.id)).error).toBeNull()
    expect(await nameOf(), 'the name is back as it was').toBe(original)
  })

  it('[SEC-X-INT-MOD-KEYS-DENY] a moderator without the key is refused', async () => {
    await setSwitch(false)
    acting.client = moderator.client
    const before = await nameOf()
    await expect(updateUserProfile(target.id, { name: `${run.RUN} refused rename` }), 'the action refuses a moderator whose switch is off').rejects.toThrow('forbidden')
    expect(await nameOf(), 'the profile is unchanged').toBe(before)
  })

  it('[SEC-X-INT-PERMS-ADMIN-ALLOW] the administrator changes a switch on the real project', async () => {
    acting.client = administrator.client
    const eventsOfRun = async () => (await run.admin.from('role_permission_events').select('old_allowed, new_allowed, permission_key, actor_user_id').eq('actor_user_id', administrator.id).order('created_at', { ascending: true })).data ?? []
    await setSwitch(true)
    expect(await setModeratorPermission(KEY, false), 'the administrator switches the key off').toEqual({})
    expect((await run.admin.from('role_permissions').select('allowed').eq('role', 'moderator').eq('permission_key', KEY).single()).data?.allowed, 'the value false is stored').toBe(false)
    expect(await setModeratorPermission(KEY, true), 'the administrator switches the key on again').toEqual({})
    expect((await run.admin.from('role_permissions').select('allowed').eq('role', 'moderator').eq('permission_key', KEY).single()).data?.allowed, 'the value true is stored').toBe(true)
    const events = await eventsOfRun()
    expect(events, 'two audit rows, each with its old and new value and the administrator as actor').toEqual([
      { permission_key: KEY, old_allowed: true, new_allowed: false, actor_user_id: administrator.id },
      { permission_key: KEY, old_allowed: false, new_allowed: true, actor_user_id: administrator.id },
    ])
  })
})

// ── Task 956 AC2: every write policy that admits a moderator follows its key, straight through PostgREST ─────────────────────────────────────────────────────────────
type Row = Record<string, unknown>
type Find = Record<string, string | number>
type Op = 'insert' | 'update' | 'delete'
interface Spec {
  /** the key the application checks for the same write (kickoff Scope; `grep -rnE "'(listings|legal|...)\.[a-z_]+'" src`) */
  keys: Partial<Record<Op, string>>
  /**
   * The commands for which `authenticated` holds a table privilege (the live catalog of 2026-11-15, `db-catalog-audit.mjs` tableGrants and columnGrants). A session reaches the policy of a
   * command only through that privilege: for the others every session, administrator included, is refused by the grant whatever the key says (the application writes those tables with the
   * service role), so the policy is a second lock that no PostgREST call can show open. If a later migration grants one of them, the case for it fails and says so: move the command here.
   */
  granted?: Partial<Record<Op, boolean>>
  /** a row the service role makes new for one attempt (with its parents); the columns that find it again */
  seed: (s: string) => Promise<Find>
  /** the row a session inserts, and the columns that find it again */
  insert?: (s: string) => Promise<{ row: Row; find: Find }>
  /** the one column a session updates, and the value it writes (it keeps the run's prefix, so the clean-up still finds the row by it) */
  patch?: { column: string; value: (s: string) => string }
}
const full = (s: string) => `${run.RUN}-${s}`
const made = async (table: string, row: Row): Promise<Row> => {
  const stored = await run.admin.from(table).insert(row).select('*').single()
  if (stored.error || !stored.data) throw new Error(`fixture: could not create a row of ${table}: ${stored.error?.message}`)
  return stored.data as Row
}
const amenityRow = (s: string): Row => ({ name_al: full(s), name_en: full(s), category: 'zz' })
const locationRow = (s: string): Row => ({ name_al: full(s), slug: full(s), type: 'city' })
const pageRow = (s: string): Row => ({ title: full(s), slug: full(s), content: {}, is_published: false })
const reportRow = (s: string): Row => ({ listing_id: matrixListingId, reason: 'spam', status: 'pending', comment: full(s) })
const inquiryRow = (s: string): Row => ({ topic: 'general', name: full(s), email: 'zz@example.com', message: 'm', target_mailbox: 'info', status: 'new' })
const ticketRow = (s: string): Row => ({ user_id: target.id, subject: full(s), ticket_type: 'support', complaint_type: 'other', status: 'open' })

const SPECS: Record<string, Spec> = {
  amenities: {
    keys: { insert: 'catalog.manage', update: 'catalog.manage', delete: 'catalog.manage' },
    seed: async (s) => ({ id: (await made('amenities', amenityRow(s))).id as number }),
    insert: async (s) => ({ row: amenityRow(s), find: { name_al: full(s) } }),
    patch: { column: 'name_en', value: (s) => `${full(s)} patched` },
  },
  amenity_translations: {
    keys: { insert: 'catalog.manage', update: 'catalog.manage', delete: 'catalog.manage' },
    seed: async (s) => {
      const parent = await made('amenities', amenityRow(s))
      return { id: (await made('amenity_translations', { amenity_id: parent.id, language_code: 'en', name: full(s) })).id as number }
    },
    insert: async (s) => {
      const parent = await made('amenities', amenityRow(s))
      return { row: { amenity_id: parent.id, language_code: 'it', name: full(s) }, find: { amenity_id: parent.id as number, language_code: 'it' } }
    },
    patch: { column: 'name', value: (s) => `${full(s)} patched` },
  },
  companies: {
    keys: { update: 'companies.manage', delete: 'companies.manage' },
    seed: async (s) => ({ id: (await made('companies', { name: full(s) })).id as string }),
    patch: { column: 'name', value: (s) => `${full(s)} patched` },
  },
  contact_inquiries: {
    keys: { update: 'inquiries.manage' },
    seed: async (s) => ({ id: (await made('contact_inquiries', inquiryRow(s))).id as string }),
    patch: { column: 'status', value: () => 'in_progress' },
  },
  contact_inquiry_replies: {
    keys: { insert: 'inquiries.manage' },
    seed: async () => { throw new Error('contact_inquiry_replies has no update or delete policy of staff') },
    insert: async (s) => ({ row: { inquiry_id: (await made('contact_inquiries', inquiryRow(s))).id, body: full(s) }, find: { body: full(s) } }),
  },
  email_templates: {
    keys: { insert: 'email_templates.manage', update: 'email_templates.manage' },
    seed: async (s) => ({ id: (await made('email_templates', { key: full(s), locale: 'en', subject: 's', html_body: 'b' })).id as string }),
    insert: async (s) => ({ row: { key: full(s), locale: 'en', subject: 's', html_body: 'b' }, find: { key: full(s) } }),
    patch: { column: 'subject', value: (s) => `${full(s)} patched` },
  },
  listing_reports: {
    keys: { insert: 'reports.manage', update: 'reports.manage', delete: 'reports.delete' },
    granted: { insert: true },
    seed: async (s) => ({ id: (await made('listing_reports', reportRow(s))).id as string }),
    insert: async (s) => ({ row: reportRow(s), find: { comment: full(s) } }),
    patch: { column: 'comment', value: (s) => `${full(s)} patched` },
  },
  listings: {
    keys: { update: 'listings.moderate', delete: 'listings.delete' },
    granted: { update: true, delete: true },
    seed: async (s) => ({ id: (await run.makeListing(target.id, 'active', s)).id }),
    patch: { column: 'title', value: (s) => `${full(s)} patched` },
  },
  location_translations: {
    keys: { insert: 'locations.manage', update: 'locations.manage', delete: 'locations.manage' },
    seed: async (s) => {
      const parent = await made('locations', locationRow(s))
      return { id: (await made('location_translations', { location_id: parent.id, language_code: 'en', name: full(s) })).id as number }
    },
    insert: async (s) => {
      const parent = await made('locations', locationRow(s))
      return { row: { location_id: parent.id, language_code: 'it', name: full(s) }, find: { location_id: parent.id as number, language_code: 'it' } }
    },
    patch: { column: 'name', value: (s) => `${full(s)} patched` },
  },
  locations: {
    keys: { insert: 'locations.manage', update: 'locations.manage', delete: 'locations.manage' },
    seed: async (s) => ({ id: (await made('locations', locationRow(s))).id as number }),
    insert: async (s) => ({ row: locationRow(s), find: { slug: full(s) } }),
    patch: { column: 'name_en', value: (s) => `${full(s)} patched` },
  },
  page_translations: {
    keys: { insert: 'legal.manage', update: 'legal.manage', delete: 'legal.manage' },
    seed: async (s) => {
      const parent = await made('pages', pageRow(s))
      return { id: (await made('page_translations', { page_id: parent.id, language_code: 'en', title: full(s), content: {} })).id as number }
    },
    insert: async (s) => {
      const parent = await made('pages', pageRow(s))
      return { row: { page_id: parent.id, language_code: 'it', title: full(s), content: {} }, find: { page_id: parent.id as number, language_code: 'it' } }
    },
    patch: { column: 'title', value: (s) => `${full(s)} patched` },
  },
  pages: {
    keys: { insert: 'legal.manage', update: 'legal.manage', delete: 'legal.manage' },
    seed: async (s) => ({ id: (await made('pages', pageRow(s))).id as number }),
    insert: async (s) => ({ row: pageRow(s), find: { slug: full(s) } }),
    patch: { column: 'title', value: (s) => `${full(s)} patched` },
  },
  report_actions: {
    keys: { insert: 'reports.manage', update: 'reports.manage', delete: 'reports.delete' },
    seed: async (s) => {
      const report = await made('listing_reports', reportRow(s))
      return { id: (await made('report_actions', { report_id: report.id, actor_role: 'admin', old_status: 'pending', new_status: 'reviewed', notes: full(s) })).id as string }
    },
    insert: async (s) => {
      const report = await made('listing_reports', reportRow(s))
      return { row: { report_id: report.id, actor_role: 'admin', old_status: 'pending', new_status: 'reviewed', notes: full(s) }, find: { notes: full(s) } }
    },
    patch: { column: 'notes', value: (s) => `${full(s)} patched` },
  },
  site_settings: {
    keys: { insert: 'settings.manage', update: 'settings.manage', delete: 'settings.manage' },
    seed: async (s) => ({ key: (await made('site_settings', { key: full(s), value: 'v' })).key as string }),
    insert: async (s) => ({ row: { key: full(s), value: 'v' }, find: { key: full(s) } }),
    patch: { column: 'value', value: (s) => `${full(s)} patched` },
  },
  support_tickets: {
    keys: { insert: 'support.manage', update: 'support.manage', delete: 'support.manage' },
    seed: async (s) => ({ id: (await made('support_tickets', ticketRow(s))).id as string }),
    insert: async (s) => ({ row: ticketRow(s), find: { subject: full(s) } }),
    patch: { column: 'subject', value: (s) => `${full(s)} patched` },
  },
  support_ticket_events: {
    keys: { insert: 'support.manage' },
    seed: async () => { throw new Error('support_ticket_events has no update or delete policy of staff') },
    insert: async (s) => ({ row: { ticket_id: (await made('support_tickets', ticketRow(s))).id, event_type: 'note_added', note: full(s) }, find: { note: full(s) } }),
  },
  verification_requests: {
    keys: { insert: 'users.verify', update: 'users.verify', delete: 'users.verify' },
    seed: async (s) => ({ id: (await made('verification_requests', { user_id: target.id, document_url: full(s), status: 'pending' })).id as string }),
    insert: async (s) => ({ row: { user_id: target.id, document_url: full(s), status: 'pending' }, find: { document_url: full(s) } }),
    patch: { column: 'document_url', value: (s) => `${full(s)} patched` },
  },
}

const setKey = async (key: string, allowed: boolean) => {
  const written = await run.admin.from('role_permissions').upsert({ role: 'moderator', permission_key: key, allowed }, { onConflict: 'role,permission_key' })
  expect(written.error, `the switch ${key} is set to ${allowed} for this case`).toBeNull()
}
const countOf = async (table: string, find: Find) => {
  const counted = await run.admin.from(table).select('*', { count: 'exact', head: true }).match(find)
  expect(counted.error, `${table}: the rows can be counted`).toBeNull()
  return counted.count
}
/** one write sent by `client` straight to PostgREST; `took` says whether the stored rows changed (a refused update or delete is an empty answer, not an error) */
async function attempt(client: SupabaseClient, table: string, op: Op, s: string): Promise<{ took: boolean; code?: string; message?: string }> {
  const spec = SPECS[table]
  if (op === 'insert') {
    const { row, find } = await spec.insert!(s)
    const answer = await client.from(table).insert(row)
    return { took: (await countOf(table, find)) === 1, code: answer.error?.code, message: answer.error?.message }
  }
  const find = await spec.seed(s)
  if (op === 'update') {
    const column = spec.patch!.column
    const value = spec.patch!.value(s)
    const answer = await client.from(table).update({ [column]: value }).match(find)
    const stored = await run.admin.from(table).select(column).match(find).single<Row>()
    expect(stored.error, `${table}: the row of the attempt can be read back`).toBeNull()
    return { took: stored.data?.[column] === value, code: answer.error?.code, message: answer.error?.message }
  }
  const answer = await client.from(table).delete().match(find)
  return { took: (await countOf(table, find)) === 0, code: answer.error?.code, message: answer.error?.message }
}

describe('moderatorKeys matrix (Task 956 AC2)', () => {
  for (const table of Object.keys(SPECS)) {
    it(`[SEC-X-INT-MOD-KEYS-${table.toUpperCase()}] ${table}: the key decides for a moderator, an administrator needs none`, async () => {
      for (const [op, key] of Object.entries(SPECS[table].keys) as [Op, string][]) {
        const name = `${table}-${op}`
        const reachable = SPECS[table].granted?.[op] === true
        await setKey(key, false)
        const refused = await attempt(moderator.client, table, op, `${name}-off`)
        expect(refused.took, `${table} ${op}: a moderator with ${key} switched off changes nothing`).toBe(false)
        if (op === 'insert') expect(refused.code, `${table} insert: refused with 42501`).toBe('42501')

        // with the key on: the write goes through where `authenticated` holds the privilege; where it does not, the grant refuses it (the policy sits behind it)
        await setKey(key, true)
        const keyed = await attempt(moderator.client, table, op, `${name}-on`)
        if (reachable) expect(keyed.took, `${table} ${op}: a moderator with ${key} switched on writes (answer code ${keyed.code})`).toBe(true)
        else {
          expect(keyed.took, `${table} ${op}: no table privilege for a session, so the grant refuses it even with ${key} on`).toBe(false)
          expect(keyed.message, `${table} ${op}: refused by the grant`).toMatch(/permission denied for table/i)
        }

        await setKey(key, false)
        const admin = await attempt(administrator.client, table, op, `${name}-admin`)
        if (reachable) expect(admin.took, `${table} ${op}: an administrator writes with ${key} switched off (answer code ${admin.code})`).toBe(true)
        else {
          expect(admin.took, `${table} ${op}: no table privilege for a session, so the grant refuses an administrator too`).toBe(false)
          expect(admin.message, `${table} ${op}: refused by the grant`).toMatch(/permission denied for table/i)
        }
      }
    })
  }

  it('[SEC-X-INT-MOD-KEYS-NO-ROW] a key with no row is off for a moderator', async () => {
    const key = 'listings.moderate'
    const removed = await run.admin.from('role_permissions').delete().eq('role', 'moderator').eq('permission_key', key)
    expect(removed.error).toBeNull()
    const refused = await attempt(moderator.client, 'listings', 'update', 'no-row')
    expect(refused.took, 'listings update: a moderator whose key has no row changes nothing').toBe(false)
    const asked = await moderator.client.rpc('caller_has_permission', { key })
    expect(asked.error, 'the function answers').toBeNull()
    expect(asked.data, 'a key with no row is false').toBe(false)
  })

  // The function every policy calls, asked straight through PostgREST: it answers about the caller only, and the answer is the stored switch for a moderator.
  it('[SEC-X-INT-MOD-KEYS-FUNCTION] caller_has_permission is the stored switch for a moderator, true for an administrator, false for everyone else', async () => {
    const plain = await run.makeUser('keys-plain', { role: 'user' })
    const blocked = await run.makeUser('keys-blocked-moderator', { role: 'moderator' })
    expect((await run.admin.from('users').update({ status: 'blocked', block_reason: 'integration run' }).eq('id', blocked.id)).error).toBeNull()
    const ask = async (client: SupabaseClient, key: string) => {
      const answer = await client.rpc('caller_has_permission', { key })
      expect(answer.error, `caller_has_permission(${key}) answers (code ${answer.error?.code})`).toBeNull()
      return answer.data
    }
    for (const key of MATRIX_KEYS) {
      await setKey(key, false)
      expect(await ask(moderator.client, key), `${key} off: a moderator holds it`).toBe(false)
      expect(await ask(administrator.client, key), `${key} off: an administrator holds every key`).toBe(true)
      await setKey(key, true)
      expect(await ask(moderator.client, key), `${key} on: a moderator holds it`).toBe(true)
      expect(await ask(plain.client, key), `${key} on: an ordinary user holds no key`).toBe(false)
      expect(await ask(blocked.client, key), `${key} on: a blocked moderator holds no key`).toBe(false)
      await setKey(key, false)
    }
    expect(await ask(moderator.client, 'zz.not_a_key'), 'a key nobody switched is off').toBe(false)
    // anon cannot ask at all
    const guest = await run.anonymousClient().rpc('caller_has_permission', { key: 'listings.moderate' })
    expect(guest.error?.code, 'a guest is refused by the grant').toBe('42501')
    expect(guest.data).toBeNull()
  })
})
