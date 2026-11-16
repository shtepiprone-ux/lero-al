// @vitest-environment node
/**
 * Task 956 Part B, revisions after Review 3 and Review 4: what the text of the four SQL files of hardening v8b must say (the live proof is the preflight, the owner's apply and
 * v8b-verify.sql; the rollback proof is scripts/quality/db-sql-roundtrip.mjs, run by Opus). These tests read the files, as visibility.test.ts reads the public rule.
 *  - F4: a `users.website` that has no scheme is changed by a data step BEFORE the CHECK that would refuse it, and only such a row; the preflight counts the same rows with the same text;
 *  - AC15 (Review 4): no session inserts into `users` (no permissive INSERT policy exists, `handle_new_user` makes the row), so INSERT is taken from `authenticated` and no column is granted back;
 *  - F10: no row of v8b-verify.sql runs an access function (`has_column_privilege`, …) on the rows of `information_schema.columns` (the view lists the columns of `auth.users` too, and the
 *    function answered 42703 for `instance_id` before the schema filter ran);
 *  - F11: row 15 of v8b-verify.sql asks that the rule is IN the body of `record_listing_view`, not that a word is missing from it (the new body says "archived" in a comment);
 *  - F12: the rollback restores `prosrc` of `record_listing_view` byte for byte, from a file with LF and from a file with CRLF alike (the live body holds CRLF, md5 read on 2026-11-15).
 */
import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), 'supabase/sql_migrations/task956', file), 'utf8')
/** the file with its `--` comments removed and its layout collapsed (a comment may quote the very text a test looks for) */
const code = (file: string) => read(file).replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim()
const md5 = (text: string) => createHash('md5').update(Buffer.from(text, 'utf8')).digest('hex')

/** the ten columns a session never writes (scripts/quality/db-catalog-audit.mjs USERS_SERVER_ONLY_COLUMNS) */
const SERVER_ONLY = ['avatar_url', 'company_id', 'company_logo_url', 'created_at', 'inactivity_warning_sent_at', 'last_seen_at', 'location_request', 'pending_email', 'public_id', 'social_provider']

describe('F4: a users.website without a scheme is fixed by a data step before the CHECK', () => {
  const sql = code('v8b.sql')
  const step = /update public\.users set website = (.+?) where (.+?);/.exec(sql)

  it('v8b.sql has the data step', () => {
    expect(step, 'an `update public.users set website = … where …;` statement').not.toBeNull()
  })

  it('the data step stands after begin and before the first alter table of users (so before the CHECK that would refuse the row)', () => {
    const at = sql.indexOf('update public.users set website')
    expect(at, 'the data step exists').toBeGreaterThan(-1)
    expect(sql.indexOf('begin;'), 'after begin').toBeLessThan(at)
    expect(at, 'before the first alter table public.users').toBeLessThan(sql.indexOf('alter table public.users'))
    expect(at, 'before the CHECK of the website').toBeLessThan(sql.indexOf('add constraint users_website_check'))
    expect(at, 'before the column grants of users too').toBeLessThan(sql.indexOf('revoke update on table public.users'))
  })

  it('the data step selects only rows with a value and without a scheme, as normalizeWebsite reads a value (the HAS_SCHEME pattern of safeUrl.ts)', () => {
    const where = step![2]
    expect(where).toContain('website is not null')
    expect(where, 'a row that already has a scheme is never changed').toContain(`website !~* '^[a-z][a-z0-9+.-]*:'`)
    expect(where, 'only what looks like a host (safeExternalUrl: a dot, no space, no @)').toContain(`website ~ '^[^\\s/?#:@]+\\.[^\\s/?#@]+'`)
    expect(where, 'a value with a control character or white space is left to the preflight (the application trims and encodes it, the step does not)').toContain(`website !~ '[[:cntrl:][:space:]]'`)
    expect(where, 'an address with credentials (an `@` before the first / ? #) is left alone, as safeExternalUrl refuses it; so is a backslash there').toContain(`website !~ '^[^/?#]*[@\\\\]'`)
  })

  it('the data step stores what normalizeWebsite stores: https://, the host in lower case, a slash only when nothing follows the host', () => {
    const value = step![1]
    expect(value.startsWith(`'https://' || lower(substring(website from '^[^/?#]*'))`)).toBe(true)
    expect(value, 'a slash is added only when the rest is empty or starts with ? or #').toContain(`case when substring(website from '^[^/?#]*(.*)$') ~ '^([?#]|$)' then '/' else '' end`)
    expect(value, 'the rest of the address is kept as it is').toMatch(/\|\| substring\(website from '\^\[\^\/\?#\]\*\(\.\*\)\$'\)$/)
  })

  it('the comment says where the format comes from', () => {
    const text = read('v8b.sql')
    expect(text).toContain('normalizeWebsite')
    expect(text).toMatch(/https:\/\/lero\.al\//)
  })

  it('the comment names no task that does not exist: showing the website without its scheme is AC13 of this task, not "Task 981"', () => {
    expect(read('v8b.sql')).not.toContain('Task 981')
  })

  it('the preflight carries the same condition and the same value, and counts what the step cannot fix and what it changes', () => {
    const preflight = code('v8b-preflight.sql')
    expect(preflight, 'the same value').toContain(step![1])
    expect(preflight, 'the same condition').toContain(step![2])
    expect(preflight).toContain('users.website that the data step cannot fix')
    expect(preflight).toContain('users.website rows the data step changes')
    // the old row 5 counted every website that is not https; it must not count a row the step fixes any more
    expect(preflight).not.toContain(`'users.website that is not an https address of at most 200 characters'`)
  })

  it('the rollback does not undo the data step, and says why', () => {
    expect(code('v8b-rollback.sql')).not.toMatch(/update public\.users set website/)
    expect(read('v8b-rollback.sql')).toMatch(/data step/i)
  })
})

// Review 4, AC15. FACT (read-only query, 2026-11-15): `users` has only RESTRICTIVE INSERT policy `blocked_account_no_insert`, so a session INSERT always fails row-level security; the profile row is made by
// public.handle_new_user() (trigger on_auth_user_created on auth.users). The application's session upserts into `users` are removed (authCore.security.test.ts, the confirm route test), so nothing in a session inserts.
describe('AC15: a session inserts nothing into users, so no INSERT is granted to authenticated, on any column', () => {
  const sql = code('v8b.sql')
  const rollback = code('v8b-rollback.sql')

  it('v8b.sql takes the table-wide INSERT from authenticated', () => {
    expect(sql).toContain('revoke insert on table public.users from authenticated;')
  })

  it('v8b.sql grants no INSERT on users back, by column or by table, to any role (anon had its INSERT revoked in step 7 and keeps none)', () => {
    expect(sql).not.toMatch(/grant insert \([^)]*\) on table public\.users/)
    expect(sql).not.toMatch(/grant [^;]*\binsert\b[^;]*on (table )?public\.users[^;]*;/)
  })

  it('the comments of v8b.sql do not claim that a session inserts six columns', () => {
    const text = read('v8b.sql')
    expect(text).not.toContain('six columns')
    expect(text).not.toContain('ensureUserProfile in src/lib/auth/server.ts')
  })

  it('v8b-rollback.sql returns the table-wide INSERT grant, and has no column-level INSERT revoke left from the earlier revision', () => {
    expect(rollback).toContain('grant insert on table public.users to authenticated;')
    expect(rollback).not.toMatch(/revoke insert \(/)
  })

  it('v8b-verify.sql row 14 says that authenticated holds INSERT on no column of users, and names no column list', () => {
    const verify = code('v8b-verify.sql')
    expect(verify).toContain('a session holds no INSERT privilege on any column of users')
    expect(verify).not.toContain('a session can insert only the six columns')
    expect(verify).not.toContain(`'id,is_verified,name,preferred_locale,role,user_type'`)
    const row14 = verifyRows().find((r) => r.n === 14)!
    expect(row14.sql).toContain(`'INSERT'`)
    expect(row14.sql, 'every column of the table, from pg_attribute').toContain(`'public.users'::regclass`)
    expect(row14.sql).toMatch(/^select 14, .*\bnot exists \(/)
  })

  it('the ten server-only columns are still named by row 6 (a session cannot UPDATE them)', () => {
    const row6 = verifyRows().find((r) => r.n === 6)!
    for (const column of SERVER_ONLY) expect(row6.sql, column).toContain(`'${column}'`)
  })
})

/** the rows of v8b-verify.sql, comments removed: `{ n, sql }` where `sql` is the text of `select <n>, …` up to the next `union all` */
function verifyRows(): { n: number; sql: string }[] {
  const text = code('v8b-verify.sql')
  return text.split(/ union all (?=select \d+, )/).map((part) => {
    const m = /select (\d+)(?: as n)?, /.exec(part)
    expect(m, `a row starts with "select <n>, " in: ${part.slice(0, 80)}`).not.toBeNull()
    return { n: Number(m![1]), sql: part.slice(part.indexOf(m![0])) }
  })
}

const ACCESS_FUNCTION = /has_(?:column|table|any_column|function|schema|sequence|database|type|language|foreign_data_wrapper|server|tablespace|parameter|largeobject)_privilege\(/

// Review 4 F10: in v8b-verify.sql rows 6 and 14 `has_column_privilege('authenticated', 'public.users', k.column_name, …)` ran on the rows of information_schema.columns with the schema filter
// in the same WHERE; the access function was evaluated on a column of `auth.users` ("instance_id") before the filter, and the row failed with 42703 (column "instance_id" of relation "users" does not exist).
describe('F10: an access function in v8b-verify.sql meets only the columns of public.users', () => {
  const rows = verifyRows()

  it('the file has the sixteen rows, numbered 1 to 16', () => {
    expect(rows.map((r) => r.n)).toEqual(Array.from({ length: 16 }, (_, k) => k + 1))
  })

  it.each(Array.from({ length: 16 }, (_, k) => k + 1))('row %i: an access function is never applied to a row of information_schema', (n) => {
    const row = rows.find((r) => r.n === n)!
    if (!ACCESS_FUNCTION.test(row.sql)) return
    expect(row.sql, `row ${n} runs an access function, so it must not read information_schema (the filter is not applied before the function)`).not.toContain('information_schema')
  })

  it.each([6, 14])('row %i takes the columns from pg_attribute of public.users, live columns only, and passes the attribute to has_column_privilege', (n) => {
    const row = rows.find((r) => r.n === n)!
    expect(row.sql).toContain('from pg_attribute')
    expect(row.sql).toContain(`attrelid = 'public.users'::regclass`)
    expect(row.sql).toMatch(/attnum > 0/)
    expect(row.sql).toMatch(/not (?:\w+\.)?attisdropped/)
    expect(row.sql).toMatch(/has_column_privilege\('authenticated', \w+\.attrelid, \w+\.attnum, '(?:UPDATE|INSERT)'\)/)
    expect(row.sql, 'no name of a column is passed to the function (an unknown name answers 42703)').not.toMatch(/has_column_privilege\('authenticated', 'public\.users'/)
  })

  it('row 6 counts the nineteen columns a session can update', () => {
    expect(rows.find((r) => r.n === 6)!.sql).toMatch(/has_column_privilege\('authenticated', \w+\.attrelid, \w+\.attnum, 'UPDATE'\)\) = 19/)
  })

  it('row 15 reads the body from pg_proc.prosrc (a column), not from a function that fails on an aggregate', () => {
    const row = rows.find((r) => r.n === 15)!
    expect(row.sql).not.toContain('pg_get_functiondef')
    expect(row.sql).toContain('prosrc')
  })
})

// Review 4 F11: row 15 said `pg_get_functiondef(p.oid) not like '%archived%'` while the new body of record_listing_view says "archived" in a comment (v8b.sql: "archived is not counted"),
// so the row would be false after a correct apply. The row asks for the RULE in the body, as the body is stored (the comments are part of prosrc).
describe('F11: row 15 of v8b-verify.sql asks that the rule is in the body, not that a word is missing', () => {
  const row15 = () => verifyRows().find((r) => r.n === 15)!.sql
  /** every `[not] like '%…%'` of the row, with its text unescaped */
  const likes = (sql: string) => [...sql.matchAll(/(not )?like '%((?:[^']|'')*)%'/g)].map((m) => ({ negated: m[1] === 'not ', text: m[2].replace(/''/g, "'") }))
  /** the body `create or replace function public.record_listing_view` stores: the text between the dollar quotes, comments included (prosrc keeps them) */
  const bodyOf = (file: string) => {
    const m = /create or replace function public\.record_listing_view[\s\S]*?\bas \$function\$([\s\S]*?)\$function\$/i.exec(read(file))
    expect(m, `${file} defines public.record_listing_view`).not.toBeNull()
    return m![1]
  }

  it('the row has at least one positive `like` (the rule is there) and no `not like` over the body', () => {
    const l = likes(row15())
    expect(l.filter((x) => !x.negated).length, 'the rule is asked for').toBeGreaterThanOrEqual(1)
    expect(l.filter((x) => x.negated), 'no word is asked to be missing').toEqual([])
  })

  it('the body v8b.sql stores satisfies every `like` of the row, comments and all', () => {
    const body = bodyOf('v8b.sql')
    expect(body, 'the comment of v8b.sql that says "archived" is part of the stored body, which is what made the old row false').toContain('archived')
    for (const { negated, text } of likes(row15())) expect(body.includes(text), `${negated ? 'not like' : 'like'} ${JSON.stringify(text)}`).toBe(!negated)
  })

  it('the live body (the one the rollback restores) does NOT satisfy the row, so the row tells the two bodies apart', () => {
    const body = bodyOf('v8b-rollback.sql')
    const satisfied = likes(row15()).every(({ negated, text }) => body.includes(text) !== negated)
    expect(satisfied, 'the old body must fail the check').toBe(false)
  })

  it('the row still asks for the grants (the service role only)', () => {
    const sql = row15()
    expect(sql).toContain(`has_function_privilege('service_role', 'public.record_listing_view(uuid,uuid,text)', 'execute')`)
    expect(sql).toContain(`not has_function_privilege('authenticated', 'public.record_listing_view(uuid,uuid,text)', 'execute')`)
    expect(sql).toContain(`not has_function_privilege('anon', 'public.record_listing_view(uuid,uuid,text)', 'execute')`)
  })
})

// Review 4 F12. FACT, read-only on 2026-11-15:
//   select md5(prosrc), position(E'\r' in prosrc) > 0, length(prosrc) from pg_proc where oid = 'public.record_listing_view(uuid,uuid,text)'::regprocedure
//   → 7d50dca26919d2465d99cdf188b8a973 | true | 1026; the body holds 16 CR and 16 LF (every LF after a CR), begins with CR LF and ends with "end ".
// The rollback must give the database exactly that text whether the file has LF or CRLF line endings.
describe('F12: the rollback restores prosrc of record_listing_view byte for byte, from a file with LF and with CRLF', () => {
  const LIVE_MD5 = '7d50dca26919d2465d99cdf188b8a973'
  const LIVE_LENGTH = 1026
  const raw = read('v8b-rollback.sql')
  /** the text between the dollar quotes of the CREATE OR REPLACE statement, as the file spells it */
  const bodyOf = (text: string) => {
    const m = /create or replace function public\.record_listing_view[\s\S]*?\bas \$function\$([\s\S]*?)\$function\$/i.exec(text)
    expect(m, 'v8b-rollback.sql defines public.record_listing_view').not.toBeNull()
    return m![1]
  }
  /**
   * What the rollback leaves stored: the repair block takes `pg_get_functiondef` of the function, removes every CR and turns every LF into CR LF, and executes it again. The same replace as in
   * the file, applied in the same order (the SQL of it is asserted below).
   */
  const stored = (body: string) => body.replace(/\r/g, '').replace(/\n/g, '\r\n')
  const asLf = raw.replace(/\r\n/g, '\n')
  const asCrlf = asLf.replace(/\n/g, '\r\n')

  it.each([['LF', asLf], ['CRLF', asCrlf]])('the body stored after a file with %s endings has the md5 and the length the live body has', (_name, text) => {
    const body = stored(bodyOf(text))
    expect(md5(body)).toBe(LIVE_MD5)
    expect(body.length).toBe(LIVE_LENGTH)
  })

  it('the file as committed has no CR (LF only), and the two spellings differ before the repair block, so the block is what makes them equal', () => {
    expect(raw.includes('\r')).toBe(false)
    expect(md5(bodyOf(asLf))).not.toBe(md5(bodyOf(asCrlf)))
  })

  it('the repair block turns every LF of the stored function into CR LF after removing every CR (the order matters: no CR CR LF)', () => {
    const rollback = code('v8b-rollback.sql')
    expect(rollback).toContain(
      `replace(replace(pg_catalog.pg_get_functiondef('public.record_listing_view(uuid, uuid, text)'::pg_catalog.regprocedure), E'\\r', ''), E'\\n', E'\\r\\n')`,
    )
  })

  it('there is no block left that only removes the carriage returns (the opposite of what the live text needs)', () => {
    const rollback = code('v8b-rollback.sql')
    // the block of Review 3 was `execute replace(pg_catalog.pg_get_functiondef(…), E'\r', '')`, run only `like E'%\r%'`: it left no CR in a body that has them
    expect(rollback).not.toMatch(/execute replace\(pg_catalog\./)
    expect(rollback).not.toContain(`like E'%\\r%'`)
    expect(rollback).toContain('execute replace(replace(pg_catalog.pg_get_functiondef(')
  })

  it('the SQL comment names the result of the read-only query that decides the way', () => {
    expect(raw).toContain(LIVE_MD5)
    expect(raw).toContain('1026')
    expect(raw).toMatch(/CRLF/)
  })

  it('the repair block comes after the create statement and before the policy step (it repairs the function just written)', () => {
    const at = raw.indexOf('pg_catalog.pg_get_functiondef')
    expect(at).toBeGreaterThan(raw.indexOf('create or replace function public.record_listing_view'))
    expect(at).toBeLessThan(raw.indexOf('-- 6. the public-listing rule as it was.'))
  })
})
