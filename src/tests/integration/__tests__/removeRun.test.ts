// @vitest-environment node
/**
 * Task 1080 — `removeRun` (`src/tests/integration/fixtures.ts`), the one clean-up of `createRun().cleanup()` and of `scripts/sweep-synthetic.mjs`.
 *
 * A run stopped before a suite's own `afterAll` left its rows in every table that suite writes by the run prefix (the run `zz_synth_mwyrxpon6e49`, 2026-11-27: 79 rows).
 * `removeRun` now deletes and counts the run's rows of every pair of `PREFIXED_COLUMNS`, before the listings and the users:
 *  - AC1 `[1080-REMOVE]`: every listed pair is deleted and counted; a row left gives `verified: false`;
 *  - AC1 `[SEC-1080-UNKNOWN]`: a failed delete, a failed or thrown count, or a count the database did not give is "unknown", never "zero left";
 *  - AC2 `[SEC-1080-PREFIX-ONLY]`: every delete and count of a listed pair uses the escaped pattern of the whole prefix (`zz\_synth\_<8><4>%`).
 * The admin client is a recording fake, so every case runs without a database (the real schema is AC4, the integration run).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import { PREFIXED_COLUMNS, removeRun } from '../fixtures'

const RUN = `zz_synth_${Date.UTC(2026, 10, 28, 12).toString(36)}a1b2`
const ESCAPED = `zz\\_synth\\_${RUN.slice('zz_synth_'.length)}%`

type Result = { data: unknown[] | null; count?: number | null; error: { message: string } | null }
type Call = { kind: 'query'; table: string; op: 'delete' | 'select'; columns?: string; options?: { count?: string; head?: boolean }; filter?: 'like' | 'in'; column?: string; value?: unknown } | { kind: 'deleteUser'; id: string }
type Options = { failDelete?: string[]; failCount?: string[]; throwCount?: string[]; nullCount?: string[]; left?: Record<string, number> }

function fakeAdmin({ failDelete = [], failCount = [], throwCount = [], nullCount = [], left = {} }: Options = {}) {
  const calls: Call[] = []
  const from = (table: string) => {
    const call: Extract<Call, { kind: 'query' }> = { kind: 'query', table, op: 'select' }
    const settle = (): Promise<Result> => {
      if (call.op === 'delete') return Promise.resolve({ data: null, error: failDelete.includes(table) ? { message: `${table} delete refused` } : null })
      if (call.options?.head) {
        if (throwCount.includes(table)) return Promise.reject(new Error(`${table} count threw`))
        if (failCount.includes(table)) return Promise.resolve({ data: null, count: null, error: { message: `${table} count refused` } })
        if (nullCount.includes(table)) return Promise.resolve({ data: null, count: null, error: null })
        return Promise.resolve({ data: null, count: left[table] ?? 0, error: null })
      }
      return Promise.resolve({ data: [], error: null })
    }
    const builder = {
      delete() { call.op = 'delete'; calls.push(call); return builder },
      select(columns: string, options?: { count?: string; head?: boolean }) { call.op = 'select'; call.columns = columns; call.options = options; calls.push(call); return builder },
      like(column: string, value: string) { call.filter = 'like'; call.column = column; call.value = value; return builder },
      in(column: string, value: unknown[]) { call.filter = 'in'; call.column = column; call.value = value; return builder },
      then<T1 = Result, T2 = never>(onFulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null, onRejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null) {
        return settle().then(onFulfilled, onRejected)
      },
    }
    return builder
  }
  const admin = {
    from,
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: [] as { id: string; email?: string }[] }, error: null }),
        deleteUser: async (id: string) => { calls.push({ kind: 'deleteUser', id }); return { data: {}, error: null } },
      },
    },
  }
  return { admin: admin as unknown as SupabaseClient, calls }
}

const tracked = () => ({ userIds: new Set(['user-1']), listingIds: new Set(['listing-1']) })
const isQuery = (call: Call): call is Extract<Call, { kind: 'query' }> => call.kind === 'query'
const deletesOf = (calls: Call[], table: string) => calls.filter(isQuery).filter((c) => c.table === table && c.op === 'delete')
const countsOf = (calls: Call[], table: string) => calls.filter(isQuery).filter((c) => c.table === table && c.op === 'select' && c.options?.head === true)

describe('removeRun: the rows a suite writes by the run prefix (Task 1080)', () => {
  it('[1080-REMOVE] PREFIXED_COLUMNS names every (table, column) a suite writes the run prefix to', () => {
    expect(PREFIXED_COLUMNS.map(([table, column]) => `${table}.${column}`)).toEqual([
      'amenities.name_al', 'companies.name', 'contact_inquiries.name', 'email_templates.key', 'listing_reports.comment', 'locations.name_al', 'pages.slug',
      'rate_limit_hits.bucket', 'site_settings.key', 'support_tickets.subject', 'verification_requests.document_url',
    ])
  })

  it('[1080-REMOVE] every listed pair is deleted and counted by the prefix, before the listings and the users; nothing left is verified', async () => {
    const { admin, calls } = fakeAdmin()
    const result = await removeRun(admin, RUN, tracked())
    expect(result).toEqual({ verified: true, remaining: 0, errors: [] })
    const listingsDelete = calls.indexOf(deletesOf(calls, 'listings')[0])
    const firstUserDelete = calls.findIndex((c) => c.kind === 'deleteUser')
    expect(listingsDelete, 'the listings are deleted').toBeGreaterThan(-1)
    expect(firstUserDelete, 'the users are deleted').toBeGreaterThan(-1)
    for (const [table, column] of PREFIXED_COLUMNS) {
      const [del] = deletesOf(calls, table)
      expect(del, `${table}: deleted`).toMatchObject({ filter: 'like', column })
      expect(calls.indexOf(del), `${table}: deleted before the listings`).toBeLessThan(listingsDelete)
      expect(calls.indexOf(del), `${table}: deleted before the users`).toBeLessThan(firstUserDelete)
      const [counted] = countsOf(calls, table)
      expect(counted, `${table}: counted`).toMatchObject({ columns: '*', options: { count: 'exact', head: true }, filter: 'like', column })
    }
  })

  it('[1080-REMOVE] a row of the run left in a listed table is counted and gives verified: false', async () => {
    const { admin } = fakeAdmin({ left: { pages: 2, site_settings: 1 } })
    const result = await removeRun(admin, RUN, tracked())
    expect(result.verified).toBe(false)
    expect(result.remaining).toBe(3)
  })

  it('[SEC-1080-UNKNOWN] a failed delete, a failed count, a count that throws or a count the database did not give is an error, never "zero left"', async () => {
    const cases: [string, Options][] = [
      ['a failed delete', { failDelete: ['pages'] }],
      ['a failed count', { failCount: ['email_templates'] }],
      ['a count that throws', { throwCount: ['site_settings'] }],
      ['no count', { nullCount: ['amenities'] }],
    ]
    for (const [label, options] of cases) {
      const { admin } = fakeAdmin(options)
      const result = await removeRun(admin, RUN, tracked())
      expect(result.verified, label).toBe(false)
      expect(result.errors.length, label).toBeGreaterThan(0)
    }
  })
})

describe('removeRun: only the rows of this one run (Task 1080, T1)', () => {
  it('[SEC-1080-PREFIX-ONLY] every delete and count of a listed pair uses the escaped pattern of the whole prefix, never a shorter or unescaped one', async () => {
    const { admin, calls } = fakeAdmin()
    await removeRun(admin, RUN, tracked())
    const listed = calls.filter(isQuery).filter((c) => PREFIXED_COLUMNS.some(([table]) => table === c.table))
    expect(listed.length, 'a delete and a count per listed pair').toBe(PREFIXED_COLUMNS.length * 2)
    for (const call of listed) {
      expect(call.filter, `${call.table} ${call.op}`).toBe('like')
      expect(call.value, `${call.table} ${call.op}`).toBe(ESCAPED)
      expect(String(call.value), `${call.table} ${call.op}`).toMatch(/^zz\\_synth\\_[0-9a-z]{8}[0-9a-f]{4}%$/)
    }
  })
})
