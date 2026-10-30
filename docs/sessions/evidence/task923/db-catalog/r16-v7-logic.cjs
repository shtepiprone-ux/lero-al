/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Revision 16 (R63, R64, R65; AC63, AC64, AC65): runs the REAL text of the hardening v7 functions from proposed-hardening.sql on real PostgreSQL, against TEMPORARY objects only:
//   guard_listings_protected_columns()   (R63 (a), R65 (b))   as the role `authenticated`; the one stub is labelled: caller_is_admin() answers false (an administrator is not tested here)
//   listings_price_rule()                (R64 (a))            the old-price trigger
//   end_user_sessions(uuid)              (R65 (c))            against a temporary table that stands for auth.sessions; function privileges checked with has_function_privilege
//   set_default_currency(integer)        (R65 (d))            against a temporary table that stands for public.currencies
//   get_listing_owner_contact             (R65 (a), R82)      O1 a static check of the generated text; O2-O7 (v7.1, R82 (e)) its REAL text against temporary tables for listings and owners: it answers for an ACTIVE
//                                                             listing and for no other status, refuses a guest and an account without access, and has NO quota (30 different listings in a row all answer); two labelled stubs
//                                                             replace auth.uid() and caller_is_active() (the real ones are proved by the harness against the real database, V720-V723); O8 no counting branch in the text
//   the apply and rollback texts (R82 (a), (b))           D1-D4: v7.1 creates neither caller_access_state() nor restore_inactive_account() nor the quota table and function, the preflight still refuses if
//                                                             any of them exists, and the rollback still drops them with if exists
//   reauth_failures (R81 (b), change 16)  the table, its index, RLS and grants, created as a TEMPORARY table from the text of proposed-hardening.sql (the one replacement: the foreign key to
//                                         auth.users is dropped from the copy, which has no auth.users to point at; the real text is checked statically for it)
// Nothing of the application schema is touched: one transaction creates pg_temp objects (copies of the texts with the table and function names replaced, nothing else), exercises them and
// ROLLBACKs. No row of any public table is read or written. Each case prints ok / FAIL / INFO.
//   node docs/sessions/evidence/task923/db-catalog/r16-v7-logic.cjs --i-confirm-dev-database
const fs = require('fs')
const { connect, scrub } = require('./lib.cjs')

if (!process.argv.includes('--i-confirm-dev-database')) {
  console.log('Refusing to run: pass --i-confirm-dev-database to confirm that DATABASE_URL points at the development project.')
  process.exit(2)
}
const D = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/db-catalog/'
const sql = fs.readFileSync(D + 'proposed-hardening.sql', 'utf8')
const pick = (re, what) => { const m = re.exec(sql); if (!m) throw new Error(`${what} not found in proposed-hardening.sql`); return m[0] }
const guardText = pick(/create function public\.guard_listings_protected_columns\(\) returns trigger[\s\S]*?end \$\$;/, 'guard_listings_protected_columns()')
const priceText = pick(/create function public\.listings_price_rule\(\) returns trigger[\s\S]*?end \$\$;/, 'listings_price_rule()')
const eusText = pick(/create function public\.end_user_sessions\(p_user uuid\) returns integer[\s\S]*?end \$\$;/, 'end_user_sessions()')
const eusGrants = pick(/^revoke all on function public\.end_user_sessions\(uuid\) from public, anon, authenticated;\r?\ngrant execute on function public\.end_user_sessions\(uuid\) to service_role;$/m, 'end_user_sessions grants')
const sdcText = pick(/create function public\.set_default_currency\(p_id integer\) returns void[\s\S]*?end \$\$;/, 'set_default_currency()')
const sdcGrants = pick(/^revoke all on function public\.set_default_currency\(integer\) from public, anon, authenticated;\r?\ngrant execute on function public\.set_default_currency\(integer\) to service_role;$/m, 'set_default_currency grants')
const reauthTable = pick(/create table public\.reauth_failures \([\s\S]*?\);/, 'create table public.reauth_failures')
const reauthIndex = pick(/create index reauth_failures_user_created_idx on public\.reauth_failures \(user_id, created_at\);/, 'the reauth_failures index')
const reauthRls = pick(/alter table public\.reauth_failures enable row level security;/, 'reauth_failures RLS')
const reauthGrants = pick(/^revoke all on table public\.reauth_failures from public, anon, authenticated;\r?\ngrant select, insert, delete on table public\.reauth_failures to service_role;$/m, 'reauth_failures grants')
const ownerContact = pick(/create or replace function public\.get_listing_owner_contact\(listing_id_param uuid\)[\s\S]*?end \$\$;/, 'get_listing_owner_contact()')
const preflightText = pick(/do \$pre\$[\s\S]*?end \$pre\$;/, 'the preflight block')
const rollbackSql = fs.readFileSync(D + 'proposed-hardening-rollback.sql', 'utf8')

const guardFor = guardText.replace('public.guard_listings_protected_columns()', 'pg_temp.guard_t()').replace('public.caller_is_admin()', 'pg_temp.stub_admin()').replace("nextval('public.listings_public_id_seq'::regclass)", "nextval('pg_temp.lseq'::regclass)")
const priceFor = priceText.replace('public.listings_price_rule()', 'pg_temp.price_rule_t()')
const eusFor = eusText.replace('public.end_user_sessions(p_user uuid)', 'pg_temp.eus(p_user uuid)').replace('delete from auth.sessions', 'delete from pg_temp.sess')
const eusGrantsFor = eusGrants.split('public.end_user_sessions(uuid)').join('pg_temp.eus(uuid)')
const sdcFor = sdcText.replace('public.set_default_currency(p_id integer)', 'pg_temp.sdc(p_id integer)').split('public.currencies').join('pg_temp.cur')
const sdcGrantsFor = sdcGrants.split('public.set_default_currency(integer)').join('pg_temp.sdc(integer)')
// R82 (e): the real text of get_listing_owner_contact with the table and function names replaced and nothing else; the two stubs are labelled where they are created
const ocFor = ownerContact.replace('public.get_listing_owner_contact(listing_id_param uuid)', 'pg_temp.golc(listing_id_param uuid)')
  .split('auth.uid()').join('pg_temp.stub_uid()').split('public.caller_is_active()').join('pg_temp.stub_active()').split('public.listings').join('pg_temp.ol').split('public.users').join('pg_temp.ou')
for (const t of [guardFor, priceFor, eusFor, sdcFor, ocFor]) {
  if (/public\.|auth\./.test(t.replace(/--.*$/gm, ''))) throw new Error('a table or function name of an extracted text was not replaced:\n' + t)
}

let fails = 0
const check = (id, what, ok, observed) => { if (!ok) fails++; console.log(`${ok ? ' ok ' : 'FAIL'} ${id} ${what} | observed: ${scrub(observed)}`) }
const info = (id, what, observed) => console.log(` INFO ${id} ${what} | observed: ${scrub(observed)}`)

;(async () => {
  const c = await connect()
  const one = async (s, p) => (await c.query(s, p)).rows[0]
  // run a statement under a role inside a savepoint: a refusal is returned, never thrown, and the transaction goes on
  const as = async (role, s, p) => {
    await c.query('SAVEPOINT s')
    try {
      if (role) await c.query(`set local role ${role}`)
      const x = await c.query(s, p)
      if (role) await c.query('RESET ROLE')
      await c.query('RELEASE SAVEPOINT s')
      return { ok: true, rows: x.rows }
    } catch (e) {
      await c.query('ROLLBACK TO SAVEPOINT s'); await c.query('RESET ROLE')
      return { ok: false, code: e.code, message: String(e.message) }
    }
  }
  try {
    await c.query('BEGIN')
    await c.query('set local search_path = public, pg_temp')

    // ── G: the listings guard (R63 (a), R65 (b)) ─────────────────────────────────────────────────────────────────────────────────────────
    await c.query(`create sequence pg_temp.lseq`)
    await c.query(`create function pg_temp.stub_admin() returns boolean language sql as $$ select false $$`)    // STUB (labelled): no administrator is tested here
    await c.query(guardFor)
    await c.query(`create temp table lt (id serial primary key, user_id uuid, slug text, title text, status listing_status not null default 'pending', is_premium boolean not null default false,
      premium_until timestamptz, views_count integer not null default 0, expires_at timestamptz default (now() + interval '60 days'), created_at timestamptz default now(), public_id bigint not null default nextval('pg_temp.lseq'))`)
    await c.query(`create trigger lt_guard before insert or update on pg_temp.lt for each row execute function pg_temp.guard_t()`)
    await c.query(`grant all on pg_temp.lt to authenticated`)
    await c.query(`grant all on all sequences in schema pg_temp to authenticated`)
    const U = '11111111-1111-1111-1111-111111111111'
    const ins = (slug, cols = {}) => {
      const k = ['user_id', 'slug', 'title', ...Object.keys(cols)]
      const v = [U, slug, 't', ...Object.values(cols)]
      return as('authenticated', `insert into pg_temp.lt (${k.join(', ')}) values (${v.map((_, i) => '$' + (i + 1)).join(', ')}) returning id, public_id, created_at, slug`, v)
    }
    let r = await ins('plain-slug-1')
    check('G1', 'a session INSERT exactly as createListing sends it (no created_at, no public_id, a plain slug) works', r.ok && r.rows.length === 1, r.ok ? `public_id ${r.rows[0].public_id}` : `error ${r.code}`)
    const first = r.ok ? Number(r.rows[0].public_id) : null
    r = await ins('plain-slug-2')
    const second = r.ok ? Number(r.rows[0].public_id) : null
    info('G1b', 'NOT BEHAVIOUR-NEUTRAL item 6: the column default and the guard each take a sequence value, so two consecutive listings differ by more than 1', `public_id ${first} then ${second} (difference ${second - first})`)
    r = await ins('future-created', { created_at: new Date(Date.now() + 3650 * 864e5).toISOString() })
    check('G2', 'a session INSERT with a created_at ten years ahead is refused with 42501', !r.ok && r.code === '42501', r.ok ? 'WORKED' : `error ${r.code}`)
    r = await ins('null-created', { created_at: null })
    check('G2b', 'a session INSERT with an explicit null created_at is refused (null is not now())', !r.ok && r.code === '42501', r.ok ? 'WORKED' : `error ${r.code}`)
    r = await ins('supplied-public-id', { public_id: 9000000000000 })
    check('G3', 'a session INSERT that supplies a public_id stores the sequence\'s value, not the supplied one', r.ok && Number(r.rows[0].public_id) !== 9000000000000, r.ok ? `public_id ${r.rows[0].public_id}` : `error ${r.code}`)
    r = await ins('Bad Slug!')
    check('G4', 'a slug with a capital, a space and a punctuation mark is refused', !r.ok && r.code === '42501', r.ok ? 'WORKED' : `error ${r.code}`)
    r = await ins('double--hyphen')
    check('G4b', 'a slug with two hyphens in a row is refused (what generateSlug makes for "A - B")', !r.ok && r.code === '42501', r.ok ? 'WORKED' : `error ${r.code}`)
    r = await ins('-leading-hyphen')
    check('G4c', 'a slug with a leading hyphen is refused (what generateSlug makes for a title with no Latin letter)', !r.ok && r.code === '42501', r.ok ? 'WORKED' : `error ${r.code}`)
    r = await ins('a'.repeat(121))
    check('G4d', 'a slug of 121 characters is refused', !r.ok && r.code === '42501', r.ok ? 'WORKED' : `error ${r.code}`)
    r = await ins('a'.repeat(120))
    check('G4e', 'a slug of exactly 120 characters is accepted', r.ok, r.ok ? 'accepted' : `error ${r.code}`)
    r = await ins(null)
    check('G4f', 'a null slug is refused', !r.ok, r.ok ? 'WORKED' : `error ${r.code}`)
    const row = await one(`select id, slug, created_at from pg_temp.lt where slug = 'plain-slug-1'`)
    r = await as('authenticated', `update pg_temp.lt set created_at = '2000-01-01T00:00:00Z' where id = $1`, [row.id])
    check('G5', 'a session UPDATE of created_at is refused with 42501', !r.ok && r.code === '42501', r.ok ? 'WORKED' : `error ${r.code}`)
    r = await as('authenticated', `update pg_temp.lt set slug = 'changed-slug' where id = $1`, [row.id])
    check('G6', 'a session UPDATE of slug is refused with 42501', !r.ok && r.code === '42501', r.ok ? 'WORKED' : `error ${r.code}`)
    r = await as('authenticated', `update pg_temp.lt set title = 'edited' where id = $1 returning title`, [row.id])
    check('G7', 'a session UPDATE of an unprotected column (title) still works', r.ok && r.rows[0].title === 'edited', r.ok ? 'worked' : `error ${r.code}`)
    r = await as(null, `update pg_temp.lt set slug = 'changed-by-server', created_at = '2000-01-01T00:00:00Z' where id = $1 returning slug`, [row.id])
    check('G8', 'a trusted server role (the connection role, not authenticated / anon) may still change slug and created_at', r.ok && r.rows[0].slug === 'changed-by-server', r.ok ? 'worked' : `error ${r.code}`)

    // ── P: the old price (R64 (a)) ───────────────────────────────────────────────────────────────────────────────────────────────────────
    await c.query(priceFor)
    await c.query(`create temp table pt (id serial primary key, price numeric not null, price_old numeric, price_initial numeric, currency text not null default 'ALL')`)
    await c.query(`create trigger pt_rule before insert or update on pg_temp.pt for each row execute function pg_temp.price_rule_t()`)
    const mk = async (price, extra = '') => (await one(`insert into pg_temp.pt (price${extra ? ', ' + extra.cols : ''}) values ($1${extra ? ', ' + extra.vals : ''}) returning id, price_initial, price_old`, [price])).id
    const st = async (id) => one(`select price::float8 as price, price_old::float8 as price_old, price_initial::float8 as price_initial, currency from pg_temp.pt where id = $1`, [id])
    const set = async (id, price) => c.query(`update pg_temp.pt set price = $2 where id = $1`, [id, price])
    let a = await mk(100)
    let s = await st(a)
    check('P1', 'INSERT at 100: price_initial 100, no old price', s.price_initial === 100 && s.price_old === null, JSON.stringify(s))
    await set(a, 80); s = await st(a)
    check('P2', '100 -> 80: the old price is the starting price, 100', s.price_old === 100 && s.price_initial === 100, JSON.stringify(s))
    await set(a, 120); s = await st(a)
    check('P3', '80 -> 120: no old price', s.price_old === null && s.price_initial === 100, JSON.stringify(s))
    await set(a, 110); s = await st(a)
    check('P4', '120 -> 110: no old price (110 is above the start)', s.price_old === null && s.price_initial === 100, JSON.stringify(s))
    await set(a, 90); s = await st(a)
    check('P5', '110 -> 90: the old price is 100 again', s.price_old === 100 && s.price_initial === 100, JSON.stringify(s))
    await set(a, 100); s = await st(a)
    check('P5b', '90 -> 100 (back to the start): no old price', s.price_old === null, JSON.stringify(s))
    const b = await mk(100); await set(b, 120); await set(b, 99); s = await st(b)
    check('P6', 'the owner\'s example 100 -> 120 -> 99: the old price is 100 (the rule of today, computeNextPriceOld, would store 120)', s.price_old === 100 && s.price_initial === 100, JSON.stringify(s))
    const cc = (await one(`insert into pg_temp.pt (price, price_old, price_initial) values (100, 7, 3) returning id`)).id; s = await st(cc)
    check('P7', 'an INSERT that supplies price_old 7 and price_initial 3 stores price_initial 100 and no old price', s.price_initial === 100 && s.price_old === null, JSON.stringify(s))
    await c.query(`update pg_temp.pt set price_old = 999, price_initial = 5 where id = $1`, [cc]); s = await st(cc)
    check('P8', 'an UPDATE that patches price_old 999 and price_initial 5 keeps the trigger\'s values (initial 100, no old price)', s.price_initial === 100 && s.price_old === null, JSON.stringify(s))
    await c.query(`update pg_temp.pt set price = 70, price_old = 999, price_initial = 5 where id = $1`, [cc]); s = await st(cc)
    check('P9', 'the same patch together with a price of 70: the old price is the starting price 100, not 999', s.price_old === 100 && s.price_initial === 100, JSON.stringify(s))
    const d = await mk(100); await c.query(`update pg_temp.pt set currency = 'EUR', price = 50 where id = $1`, [d]); s = await st(d)
    check('P10', 'R64 (a) BLOCKED (no conversion possible): the DRAFT\'S FAIL-SAFE on a currency change - the new price is the new start, no old price', s.currency === 'EUR' && s.price_initial === 50 && s.price_old === null, JSON.stringify(s))
    await set(d, 40); s = await st(d)
    check('P11', 'after the fail-safe, a reduction in the new currency compares with the new start: 50 -> 40 shows the old price 50', s.price_old === 50 && s.price_initial === 50, JSON.stringify(s))

    // ── E: end_user_sessions (R65 (c)) ───────────────────────────────────────────────────────────────────────────────────────────────────
    await c.query(`create temp table sess (id serial primary key, user_id uuid not null)`)
    await c.query(eusFor)
    await c.query(eusGrantsFor)
    const U1 = '22222222-2222-2222-2222-222222222222', U2 = '33333333-3333-3333-3333-333333333333'
    const U_R1 = '55555555-5555-5555-5555-555555555555', U_R2 = '66666666-6666-6666-6666-666666666666'
    await c.query(`insert into pg_temp.sess (user_id) values ('${U1}'), ('${U1}'), ('${U1}'), ('${U2}')`)
    const n = (await one(`select pg_temp.eus($1::uuid) as n`, [U1])).n
    const left = (await c.query(`select user_id from pg_temp.sess`)).rows.map((x) => x.user_id)
    check('E1', 'end_user_sessions deletes every session row of the one user and returns the count (3)', n === 3 && left.length === 1 && left[0] === U2, `returned ${n}; rows left for: ${left.join(',')}`)
    const n0 = (await one(`select pg_temp.eus($1::uuid) as n`, ['44444444-4444-4444-4444-444444444444'])).n
    check('E2', 'a user with no session: 0 is returned and nothing else changes', n0 === 0 && (await one(`select count(*)::int as n from pg_temp.sess`)).n === 1, `returned ${n0}`)
    const fp = async (role, sig) => (await one(`select has_function_privilege($1::name, $2::text, 'EXECUTE') as ok`, [role, sig])).ok
    check('E3', 'only service_role may execute end_user_sessions (anon, authenticated, PUBLIC cannot)', !(await fp('anon', 'pg_temp.eus(uuid)')) && !(await fp('authenticated', 'pg_temp.eus(uuid)')) && (await fp('service_role', 'pg_temp.eus(uuid)')),
      `anon ${await fp('anon', 'pg_temp.eus(uuid)')}, authenticated ${await fp('authenticated', 'pg_temp.eus(uuid)')}, service_role ${await fp('service_role', 'pg_temp.eus(uuid)')}`)

    // ── C: set_default_currency (R65 (d)) ────────────────────────────────────────────────────────────────────────────────────────────────
    await c.query(`create temp table cur (id integer primary key, code text, is_active boolean not null default true, is_default boolean not null default false)`)
    await c.query(sdcFor)
    await c.query(sdcGrantsFor)
    await c.query(`insert into pg_temp.cur values (1, 'ALL', true, true), (2, 'EUR', true, false), (3, 'USD', true, false), (4, 'OLD', false, false)`)
    const defaults = async () => (await c.query(`select code from pg_temp.cur where is_default order by code`)).rows.map((x) => x.code).join(',')
    let x = await as(null, `select pg_temp.sdc(2)`)
    check('C1', 'an active currency becomes the one default (ALL -> EUR)', x.ok && (await defaults()) === 'EUR', `defaults: ${await defaults()}`)
    x = await as(null, `select pg_temp.sdc(2)`)
    check('C2', 'calling it again for the same currency changes nothing', x.ok && (await defaults()) === 'EUR', `defaults: ${await defaults()}`)
    await c.query(`update pg_temp.cur set is_default = true`)    // a corrupt state: every currency is the default
    x = await as(null, `select pg_temp.sdc(3)`)
    check('C3', 'from a state with several defaults it leaves exactly one, the chosen one (USD)', x.ok && (await defaults()) === 'USD', `defaults: ${await defaults()}`)
    x = await as(null, `select pg_temp.sdc(99)`)
    check('C4', 'a missing currency is refused with 22023 and the default stays', !x.ok && x.code === '22023' && (await defaults()) === 'USD', x.ok ? 'WORKED' : `error ${x.code}; defaults: ${await defaults()}`)
    x = await as(null, `select pg_temp.sdc(4)`)
    check('C5', 'an inactive currency is refused with 22023 and the default stays', !x.ok && x.code === '22023' && (await defaults()) === 'USD', x.ok ? 'WORKED' : `error ${x.code}; defaults: ${await defaults()}`)
    check('C6', 'only service_role may execute set_default_currency (anon, authenticated, PUBLIC cannot)', !(await fp('anon', 'pg_temp.sdc(integer)')) && !(await fp('authenticated', 'pg_temp.sdc(integer)')) && (await fp('service_role', 'pg_temp.sdc(integer)')),
      `anon ${await fp('anon', 'pg_temp.sdc(integer)')}, authenticated ${await fp('authenticated', 'pg_temp.sdc(integer)')}, service_role ${await fp('service_role', 'pg_temp.sdc(integer)')}`)

    // ── R: reauth_failures (R81 (b), change 16) ───────────────────────────────────────────────────────────────────────────────────────
    const fkText = /references auth\.users \(id\) on delete cascade/
    const policyText = /create policy[^;]*reauth_failures/i
    check('R0', 'the real table text references auth.users (id) with on delete cascade, and the real text has no policy at all', fkText.test(reauthTable) && !policyText.test(sql),
      'foreign key text ' + (fkText.test(reauthTable) ? 'present' : 'absent') + '; policy text ' + (policyText.test(sql) ? 'present' : 'absent'))
    const tableFor = reauthTable.replace('create table public.reauth_failures (', 'create temp table reauth_failures (').replace(/ references auth\.users \(id\) on delete cascade/, '')
    if (/public\.|auth\./.test(tableFor.replace(/--.*$/gm, ''))) throw new Error('a name of the extracted table text was not replaced:' + String.fromCharCode(10) + tableFor)
    await c.query(tableFor)
    await c.query(reauthIndex.split('public.reauth_failures').join('pg_temp.reauth_failures'))
    await c.query(reauthRls.split('public.reauth_failures').join('pg_temp.reauth_failures'))
    await c.query(reauthGrants.split('public.reauth_failures').join('pg_temp.reauth_failures'))
    const tp = async (role, priv) => (await one("select has_table_privilege($1::name, 'pg_temp.reauth_failures', $2::text) as ok", [role, priv])).ok
    const rel = await one("select c.relrowsecurity as rls, (select count(*)::int from pg_policy p where p.polrelid = c.oid) as policies from pg_class c where c.oid = 'pg_temp.reauth_failures'::regclass")
    check('R1', 'row level security is on and no policy exists', rel.rls === true && rel.policies === 0, 'rls ' + rel.rls + ', policies ' + rel.policies)
    const privs = {}
    for (const role of ['anon', 'authenticated']) for (const priv of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) privs[role + ' ' + priv] = await tp(role, priv)
    check('R2', 'anon and authenticated hold no privilege on the table', Object.values(privs).every((v) => v === false), JSON.stringify(privs))
    const sp = { select: await tp('service_role', 'SELECT'), insert: await tp('service_role', 'INSERT'), delete: await tp('service_role', 'DELETE'), update: await tp('service_role', 'UPDATE') }
    check('R3', 'on the TEMPORARY table (it gets no default privileges, so this proves the grants this file writes and NOT the real table\'s grantees, which rls-harness V753 checks after the apply, S5): service_role holds select, insert and delete and not update', sp.select && sp.insert && sp.delete && !sp.update, JSON.stringify(sp))
    const acl = (await one("select coalesce(string_agg(distinct case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end, ','), '') as who from pg_class c, aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a where c.oid = 'pg_temp.reauth_failures'::regclass")).who
    check('R4', 'the grantees of the TEMPORARY table are the owner and service_role only (no PUBLIC; the real table: rls-harness V753)',!/PUBLIC|anon|authenticated/.test(acl), 'grantees: ' + acl)
    const idx = (await one("select pg_get_indexdef(i.indexrelid) as def from pg_index i where i.indrelid = 'pg_temp.reauth_failures'::regclass and not i.indisprimary")).def
    check('R5', 'the secondary index is on (user_id, created_at)', /\(user_id, created_at\)/.test(idx), idx)
    // behaviour as the roles (inside savepoints): a session role is refused with 42501 before it can touch a row; service_role writes and counts
    const refused = []
    for (const role of ['anon', 'authenticated']) {
      for (const [what, stmt] of [['select', 'select count(*) from pg_temp.reauth_failures'], ['insert', "insert into pg_temp.reauth_failures (user_id) values ('" + U_R1 + "')"], ['delete', 'delete from pg_temp.reauth_failures']]) {
        const y = await as(role, stmt)
        refused.push(role + ' ' + what + ': ' + (y.ok ? 'WORKED' : y.code))
      }
    }
    check('R6', 'anon and authenticated are refused with 42501 for select, insert and delete', refused.every((r) => /42501$/.test(r)), refused.join('; '))
    const rIns = await as('service_role', "insert into pg_temp.reauth_failures (user_id) values ('" + U_R1 + "'), ('" + U_R1 + "'), ('" + U_R2 + "')")
    const rCnt = await as('service_role', "select count(*)::int as n from pg_temp.reauth_failures where user_id = '" + U_R1 + "' and created_at >= now() - interval '15 minutes'")
    if (!rIns.ok || !rCnt.ok) info('R7', 'service_role writes and counts through the temporary table', 'insert ' + (rIns.ok ? 'ok' : rIns.code + ' ' + rIns.message) + '; count ' + (rCnt.ok ? rCnt.rows[0].n : rCnt.code + ' ' + rCnt.message) + ' (the role may lack USAGE on the temporary schema: the privilege checks R1-R4 stand)')
    else check('R7', 'service_role inserts without an id (the identity column) and counts the rows of one person of the last 15 minutes (2 of 3)', rCnt.rows[0].n === 2, 'count ' + rCnt.rows[0].n)

    // ── O: get_listing_owner_contact (R65 (a)), a static check of the generated text ─────────────────────────────────────────────────────
    const code = ownerContact.replace(/--.*$/gm, '')
    const actives = (code.match(/l\.status = 'active'/g) || []).length
    check('O1', 'both selects of get_listing_owner_contact take only status = active', actives === 2 && !/'sold'|'rented'|'archived'/.test(code), `${actives} active conditions; sold / rented / archived ${/'sold'|'rented'|'archived'/.test(code) ? 'present' : 'absent'}`)

    // ── O2-O8 (v7.1, R82 (e)): the REAL text of get_listing_owner_contact against TEMPORARY tables for listings (ol) and owners (ou) ────────────────────────────────────────────
    // Two STUBS, labelled: pg_temp.stub_uid() stands for auth.uid() (it reads the setting lero.test_uid) and pg_temp.stub_active() for caller_is_active() (the setting lero.test_active, true when unset).
    // The real ones are proved by rls-harness.cjs against the real database (V720-V723, the N-section). The names of the tables and functions are the only replacement made in the text (ocFor).
    await c.query(`create function pg_temp.stub_uid() returns uuid language sql stable as $$ select nullif(current_setting('lero.test_uid', true), '')::uuid $$`)
    await c.query(`create function pg_temp.stub_active() returns boolean language sql stable as $$ select coalesce(nullif(current_setting('lero.test_active', true), '')::boolean, true) $$`)
    await c.query(`create temp table ou (id uuid primary key, phone text, whatsapp text, deleted_at timestamptz)`)
    await c.query(`create temp table ol (id uuid primary key, user_id uuid not null, status listing_status not null)`)
    await c.query(ocFor)
    const OWNER = 'aaaaaaaa-0000-0000-0000-000000000001', GONE = 'aaaaaaaa-0000-0000-0000-000000000002', CALLER = '77777777-7777-7777-7777-777777777777'
    const LST = (n) => `bbbbbbbb-0000-0000-0000-${String(n).padStart(12, '0')}`
    await c.query(`insert into pg_temp.ou values ($1, '+355690000001', '+355690000002', null), ($2, '+355690000003', '+355690000004', now())`, [OWNER, GONE])
    for (const [n, status, owner] of [[1, 'active', OWNER], [2, 'sold', OWNER], [3, 'rented', OWNER], [4, 'archived', OWNER], [5, 'pending', OWNER], [6, 'active', GONE]]) {
      await c.query(`insert into pg_temp.ol (id, user_id, status) values ($1, $2, $3::listing_status)`, [LST(n), owner, status])
    }
    await c.query(`select set_config('lero.test_uid', $1, true)`, [CALLER])
    const contact = (n) => as(null, `select phone, whatsapp from pg_temp.golc($1::uuid)`, [LST(n)])
    const seen = (o) => (o.ok ? `${o.rows.length} row(s)` : `error ${o.code} ${String(o.message).slice(0, 40)}`)
    let o = await contact(1)
    check('O2', 'an ACTIVE listing of a live owner: the signed-in, active caller gets the phone and the WhatsApp number', o.ok && o.rows.length === 1 && o.rows[0].phone === '+355690000001' && o.rows[0].whatsapp === '+355690000002', seen(o))
    for (const [id, n, label] of [['O3', 2, 'SOLD'], ['O3b', 3, 'RENTED'], ['O3c', 4, 'ARCHIVED'], ['O3d', 5, 'PENDING']]) {
      o = await contact(n)
      check(id, `a ${label} listing: no row (the function answers for no status but active)`, o.ok && o.rows.length === 0, seen(o))
    }
    o = await contact(6)
    check('O4', 'an ACTIVE listing whose owner is deleted (deleted_at set): no row', o.ok && o.rows.length === 0, seen(o))
    await c.query(`select set_config('lero.test_uid', '', true)`)
    o = await contact(1)
    check('O5', 'a guest (no session): refused with 42501 "unauthenticated", no row', !o.ok && o.code === '42501' && /unauthenticated/.test(o.message), seen(o))
    await c.query(`select set_config('lero.test_uid', $1, true)`, [CALLER])
    await c.query(`select set_config('lero.test_active', 'false', true)`)
    o = await contact(1)
    check('O6', 'a signed-in account without access (the stub says so): refused with 42501 "account_blocked", no row', !o.ok && o.code === '42501' && /account_blocked/.test(o.message), seen(o))
    await c.query(`select set_config('lero.test_active', 'true', true)`)
    // no quota (owner decision D49): one caller opens 30 different active listings in a row and every call answers
    for (let n = 100; n < 130; n++) await c.query(`insert into pg_temp.ol (id, user_id, status) values ($1, $2, 'active')`, [LST(n), OWNER])
    let answered = 0
    const notAnswered = []
    for (let n = 100; n < 130; n++) { o = await contact(n); if (o.ok && o.rows.length === 1) answered++; else notAnswered.push(`${n}: ${seen(o)}`) }
    check('O7', 'no quota (owner decision D49): one caller opens 30 different active listings in a row and all 30 answer', answered === 30, `${answered} of 30 answered${notAnswered.length ? '; first miss ' + notAnswered[0] : ''}`)
    const quotaWords = /owner_contact_access|owner_contact_daily_limit|pg_advisory|rate_limited|54000/
    check('O8', 'the text has no counting branch: no owner_contact_access, no owner_contact_daily_limit, no advisory lock and no rate_limited error', !quotaWords.test(code), quotaWords.test(code) ? 'a quota word is present' : 'absent')

    // ── D1-D4 (v7.1, R82 (a), (b)): the apply and rollback TEXTS ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    const body = sql.replace(preflightText, '').replace(/--.*$/gm, '')
    check('D1', 'outside the preflight the apply text names neither caller_access_state nor restore_inactive_account: neither is created or granted (S1)', !/caller_access_state|restore_inactive_account/.test(body), /caller_access_state|restore_inactive_account/.test(body) ? 'present' : 'absent')
    check('D2', 'outside the preflight the apply text names neither owner_contact_access nor owner_contact_daily_limit: no quota table, index or function is created (S3)', !/owner_contact_access|owner_contact_daily_limit/.test(body), /owner_contact_access|owner_contact_daily_limit/.test(body) ? 'present' : 'absent')
    const pre = preflightText.replace(/--.*$/gm, '')
    const refuseBlock = /if to_regclass\('public\.owner_contact_access'\) is not null[\s\S]*?raise exception 'preflight failed: hardening objects already exist';/.exec(pre)
    check('D3', 'the preflight still refuses to run when owner_contact_access, caller_access_state() or restore_inactive_account() exists', !!refuseBlock && /to_regprocedure\('public\.caller_access_state\(\)'\) is not null/.test(refuseBlock[0]) && /to_regprocedure\('public\.restore_inactive_account\(\)'\) is not null/.test(refuseBlock[0]), refuseBlock ? 'the three tests are in the refusing condition' : 'the refusing condition was not found')
    const rb = rollbackSql.replace(/--.*$/gm, '')
    const dropsAll = ['drop function if exists public.restore_inactive_account();', 'drop function if exists public.caller_access_state();', 'drop function if exists public.owner_contact_daily_limit();', 'drop table if exists public.owner_contact_access;'].every((t) => rb.includes(t))
    const restoreAt = rb.search(/create or replace function public\.get_listing_owner_contact\(/i)
    const dropQuotaAt = rb.indexOf('drop function if exists public.owner_contact_daily_limit();')
    check('D4', 'the rollback still drops the four objects with if exists and restores the audited get_listing_owner_contact before it drops the quota function', dropsAll && restoreAt >= 0 && restoreAt < dropQuotaAt, `drops ${dropsAll ? 'all four' : 'MISSING'}; audited body at ${restoreAt}, quota drop at ${dropQuotaAt}`)
  } catch (e) {
    fails++
    console.log('ERROR:', scrub(e.message))
  }
  try { await c.query('ROLLBACK') } catch { /* temp objects vanish with the session */ }
  await c.end()
  console.log(fails ? `RESULT: ${fails} FAILED` : 'RESULT: all cases hold')
  process.exit(fails ? 1 : 0)
})()
