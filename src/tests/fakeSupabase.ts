/**
 * A tiny in-memory stand-in for the Supabase query builder, for tests that must prove an ACTION (not the database) keeps one person's data from another
 * (Task 923 Revision 7). It does NOT simulate row-level security: the point is that application code must not depend on a policy it cannot see.
 *
 * Supported: `from(t).select().insert().update().upsert().delete()`, filters `eq` `in` `is` `neq` `gte` `lte` `not`, `select(cols, { count: 'exact', head })`, `order`, `limit`, `single`, `maybeSingle`, and awaiting the builder.
 * Every call is recorded in `db.log` (`{ table, op, filters, values }`) so a test can also assert what was NOT touched.
 */
export type Row = Record<string, unknown>
export interface LogEntry { table: string; op: 'select' | 'insert' | 'update' | 'upsert' | 'delete'; filters: [string, string, unknown][]; values?: unknown; affected: number }

export function createFakeDb(seed: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = Object.fromEntries(Object.entries(seed).map(([k, v]) => [k, v.map((r) => ({ ...r }))]))
  const log: LogEntry[] = []
  let nextId = 1

  function from(table: string) {
    tables[table] ??= []
    let op: LogEntry['op'] = 'select'
    let values: unknown
    const filters: [string, string, unknown][] = []
    let limit: number | null = null
    let rangeOpt: [number, number] | null = null
    const orders: { column: string; ascending: boolean }[] = []
    let total = 0
    let wantOne: 'single' | 'maybe' | null = null
    let conflictOn: string[] = []
    let countOpt: { head?: boolean } | null = null

    const match = (r: Row) => filters.every(([c, kind, v]) => {
      if (kind === 'eq') return r[c] === v
      if (kind === 'neq') return r[c] !== v
      if (kind === 'in') return (v as unknown[]).includes(r[c])
      if (kind === 'is') return v === null ? r[c] === null || r[c] === undefined : r[c] === v
      if (kind === 'gte') return r[c] !== undefined && r[c] !== null && (r[c] as string | number) >= (v as string | number)
      if (kind === 'lte') return r[c] !== undefined && r[c] !== null && (r[c] as string | number) <= (v as string | number)
      if (kind === 'notin') return !(v as unknown[]).includes(r[c])
      if (kind === 'notis') return v === null ? !(r[c] === null || r[c] === undefined) : r[c] !== v
      if (kind === 'noteq') return r[c] !== v
      if (kind === 'or') return true // the text of an .or() filter is recorded in the log, not evaluated
      return true
    })

    function run(): { data: unknown; error: { message: string; code?: string } | null } {
      let affected = 0
      let data: unknown = null
      if (op === 'insert') {
        const rows = (Array.isArray(values) ? values : [values]) as Row[]
        const made = rows.map((r) => ({ id: `row-${nextId++}`, created_at: new Date().toISOString(), ...r }))
        tables[table].push(...made)
        affected = made.length
        data = made
      } else if (op === 'upsert') {
        const rows = (Array.isArray(values) ? values : [values]) as Row[]
        const made: Row[] = []
        for (const r of rows) {
          const hit = conflictOn.length ? tables[table].find((x) => conflictOn.every((c) => x[c] === r[c])) : undefined
          if (hit) { Object.assign(hit, r); made.push(hit) } else { const row = { id: `row-${nextId++}`, created_at: new Date().toISOString(), ...r }; tables[table].push(row); made.push(row) }
        }
        affected = made.length
        data = made
      } else if (op === 'update') {
        const hit = tables[table].filter(match)
        for (const r of hit) Object.assign(r, values as Row)
        affected = hit.length
        data = hit
      } else if (op === 'delete') {
        const keep = tables[table].filter((r) => !match(r))
        affected = tables[table].length - keep.length
        tables[table] = keep
        data = []
      } else {
        let hit = tables[table].filter(match)
        total = hit.length
        if (orders.length) {
          hit = [...hit].sort((a, b) => {
            for (const { column, ascending } of orders) {
              const x = a[column] as string | number | boolean | null | undefined
              const y = b[column] as string | number | boolean | null | undefined
              if (x === y) continue
              if (x == null) return 1
              if (y == null) return -1
              return (x < y ? -1 : 1) * (ascending ? 1 : -1)
            }
            return 0
          })
        }
        if (rangeOpt) hit = hit.slice(rangeOpt[0], rangeOpt[1] + 1)
        if (limit !== null) hit = hit.slice(0, limit)
        affected = hit.length
        // copies, as a real database returns: a later update must not change a row that was already read
        data = hit.map((r) => ({ ...r }))
      }
      log.push({ table, op, filters: [...filters], values, affected })
      if (wantOne) {
        const rows = (data as Row[]) ?? []
        if (rows.length === 0) return wantOne === 'single' ? { data: null, error: { message: 'no rows', code: 'PGRST116' } } : { data: null, error: null }
        return { data: rows[0], error: null }
      }
      if (countOpt) return { data: countOpt.head ? null : data, count: op === 'select' ? total : (data as Row[]).length, error: null } as never
      return { data, error: null }
    }

    const chain: Record<string, unknown> = {
      select: (_cols?: string, opts?: { count?: string; head?: boolean }) => { if (opts?.count) countOpt = { head: opts.head }; return chain },
      insert: (v: unknown) => { op = 'insert'; values = v; return chain },
      update: (v: unknown) => { op = 'update'; values = v; return chain },
      upsert: (v: unknown, o?: { onConflict?: string }) => { op = 'upsert'; values = v; conflictOn = (o?.onConflict ?? '').split(',').map((s) => s.trim()).filter(Boolean); return chain },
      delete: () => { op = 'delete'; return chain },
      eq: (c: string, v: unknown) => { filters.push([c, 'eq', v]); return chain },
      neq: (c: string, v: unknown) => { filters.push([c, 'neq', v]); return chain },
      in: (c: string, v: unknown) => { filters.push([c, 'in', v]); return chain },
      is: (c: string, v: unknown) => { filters.push([c, 'is', v]); return chain },
      gte: (c: string, v: unknown) => { filters.push([c, 'gte', v]); return chain },
      lte: (c: string, v: unknown) => { filters.push([c, 'lte', v]); return chain },
      not: (c: string, op: string, v: unknown) => {
        // PostgREST syntax: .not('status', 'in', '("a","b")') / .not('col', 'is', null) / .not('col', 'eq', x)
        if (op === 'in') filters.push([c, 'notin', String(v).replace(/[()"]/g, '').split(',').filter(Boolean)])
        else if (op === 'is') filters.push([c, 'notis', v])
        else filters.push([c, 'noteq', v])
        return chain
      },
      or: (expression: string) => { filters.push(['', 'or', expression]); return chain },
      order: (column: string, o?: { ascending?: boolean }) => { orders.push({ column, ascending: o?.ascending !== false }); return chain },
      range: (from: number, to: number) => { rangeOpt = [from, to]; return chain },
      limit: (n: number) => { limit = n; return chain },
      single: () => { wantOne = 'single'; return Promise.resolve(run()) },
      maybeSingle: () => { wantOne = 'maybe'; return Promise.resolve(run()) },
      then: (resolve: (v: unknown) => void) => resolve(run()),
    }
    return chain
  }

  return { from, tables, log, client: { from } }
}
