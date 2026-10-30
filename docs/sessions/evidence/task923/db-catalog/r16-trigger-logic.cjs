/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Revision 16 (R62 (a), (b), (c); AC62): runs the REAL text of account_display_name() and set_actor_name() from proposed-account-deletion.sql (v3) and the REAL grant / revoke statements of the
// v3 apply and rollback files on real PostgreSQL, against TEMPORARY objects only. Nothing of the application schema is touched: one transaction on the approved development database
// creates pg_temp tables, copies the function texts with the table names replaced (nothing else), exercises them and ROLLBACKs; temp objects vanish with the session in any case. No row
// of any public table is read or written.
//   node docs/sessions/evidence/task923/db-catalog/r16-trigger-logic.cjs --i-confirm-dev-database
// Cases (each prints ok / FAIL / INFO):
//   A  R62 (a)  account_display_name(): the person's name and last name trimmed; both empty is null and an e-mail address is NEVER the name (a person with an Auth row and no profile row is null)
//   B  R62 (c)  set_actor_name(): INSERT and UPDATE as in R59 (b); an empty name stores null; clearing the id of a LIVE account (a row in the public.users-like or only in the auth.users-like
//               table) stores null; once the old account is gone, clearing the id keeps the old name
//   R  R62 (c)  the deletion itself, on temporary tables shaped like the real keys (an auth.users-like parent, a public.users-like child that cascades, a staff table with a key to each):
//               deleting the parent keeps the name in both tables (the order the real database has, captured in r16-00-capture.json); INFO cases show what depends on that order
//   O, U        the order of backfill and trigger (R59 (b)) and the updated_at technique (R59 (a)), unchanged from Revision 14
//   G  R62 (b)  the apply statements revoke the table-level SELECT of anon and authenticated and grant every column but updated_by_name; the rollback statements restore the captured ACL text exactly
const fs = require('fs')
const { connect, scrub } = require('./lib.cjs')

if (!process.argv.includes('--i-confirm-dev-database')) {
  console.log('Refusing to run: pass --i-confirm-dev-database to confirm that DATABASE_URL points at the development project.')
  process.exit(2)
}
const D = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/db-catalog/'
const sql = fs.readFileSync(D + 'proposed-account-deletion.sql', 'utf8')
const rollbackSql = fs.readFileSync(D + 'proposed-account-deletion-rollback.sql', 'utf8')

const pick = (text, re, what) => { const m = re.exec(text); if (!m) throw new Error(`${what} not found in the generated file`); return m[0] }
const adnText = pick(sql, /create function public\.account_display_name\(p_user uuid\) returns text[\s\S]*?\$\$;/, 'account_display_name()')
const setText = pick(sql, /create function public\.set_actor_name\(\) returns trigger[\s\S]*?end \$\$;/, 'set_actor_name()')
// the real text with ONLY its names replaced: the function names and the two tables it reads
const adnFor = (sfx, users) => adnText.replace('public.account_display_name(p_user uuid)', `pg_temp.adn_${sfx}(p_user uuid)`).split('public.users u').join(`${users} u`)
const setFor = (sfx, users, auth) => setText.replace('public.set_actor_name()', `pg_temp.set_actor_${sfx}()`).split('public.account_display_name(').join(`pg_temp.adn_${sfx}(`)
  .split('public.users u').join(`${users} u`).split('auth.users a').join(`${auth} a`)
// only a comment may still say public. or auth.: the code of the copied text must name no application table or function any more
for (const t of [adnFor('x', 'pg_temp.tu'), setFor('x', 'pg_temp.tu', 'pg_temp.ta')]) {
  if (/public\.|auth\./.test(t.replace(/--.*$/gm, ''))) throw new Error('a table or function name of the extracted text was not replaced')
}

// the statements of the apply and the rollback file that change the grants (R62 (b)), with the two table names replaced by the temporary ones
const statements = (text, res) => res.map((re) => pick(text, re, String(re)))
const toTemp = (s) => s.split('public.pages').join('pg_temp.pages_t').split('public.site_footer').join('pg_temp.footer_t')
const applyGrants = statements(sql, [/^revoke select on public\.pages, public\.site_footer from anon, authenticated;$/m, /^grant select \([^)]*\) on public\.pages to anon, authenticated;$/m, /^grant select \([^)]*\) on public\.site_footer to anon, authenticated;$/m]).map(toTemp)
const rollbackGrants = statements(rollbackSql, [/^revoke select \([^)]*\) on public\.pages from anon, authenticated;$/m, /^revoke select \([^)]*\) on public\.site_footer from anon, authenticated;$/m, /^grant select on public\.pages, public\.site_footer to anon, authenticated;$/m]).map(toTemp)

let fails = 0
const check = (id, what, ok, observed) => { if (!ok) fails++; console.log(`${ok ? ' ok ' : 'FAIL'} ${id} ${what} | observed: ${scrub(observed)}`) }
const info = (id, what, observed) => console.log(` INFO ${id} ${what} | observed: ${scrub(observed)}`)

;(async () => {
  const c = await connect()
  const A = '11111111-1111-1111-1111-111111111111'   // Alice Staff, live in the users-like table
  const B = '22222222-2222-2222-2222-222222222222'   // Bob Staff
  const E = '33333333-3333-3333-3333-333333333333'   // a person whose names are empty (only an e-mail address exists)
  const X = '44444444-4444-4444-4444-444444444444'   // only an Auth-like row (no profile row)
  const T = '55555555-5555-5555-5555-555555555555'   // padded names
  const Dd = '66666666-6666-6666-6666-666666666666'  // Dora Staff: deleted from both tables during the test
  const one = async (s, p) => (await c.query(s, p)).rows[0]
  try {
    await c.query('BEGIN')
    await c.query('set local search_path = public, pg_temp')
    // the two parents of the first block: a public.users-like table and an auth.users-like table with no foreign key (the cases of A and B set the rows by hand)
    await c.query(`create temp table tu (id uuid primary key, name text, last_name text)`)
    await c.query(`create temp table ta (id uuid primary key, email text)`)
    await c.query(`insert into pg_temp.tu values ('${A}', 'Alice', 'Staff'), ('${B}', 'Bob', 'Staff'), ('${E}', null, '  '), ('${T}', '  Tina ', ' Padded  '), ('${Dd}', 'Dora', 'Staff')`)
    await c.query(`insert into pg_temp.ta values ('${A}', 'alice@example.invalid'), ('${B}', 'bob@example.invalid'), ('${E}', 'empty@example.invalid'), ('${X}', 'only-auth@example.invalid'), ('${T}', 'tina@example.invalid'), ('${Dd}', 'dora@example.invalid')`)
    await c.query(adnFor('main', 'pg_temp.tu'))
    await c.query(setFor('main', 'pg_temp.tu', 'pg_temp.ta'))

    // ── A: account_display_name (R62 (a)) ────────────────────────────────────────────────────────────────────────────────────────────────
    const adn = async (id) => (await one(`select pg_temp.adn_main($1::uuid) as n`, [id])).n
    let v = await adn(A)
    check('A1', 'name and last name joined by one space', v === 'Alice Staff', JSON.stringify(v))
    v = await adn(T)
    check('A2', 'name and last name are each trimmed ("  Tina " + " Padded  ")', v === 'Tina Padded', JSON.stringify(v))
    await c.query(`insert into pg_temp.tu values ('77777777-7777-7777-7777-777777777777', 'Solo', null)`)
    v = await adn('77777777-7777-7777-7777-777777777777')
    check('A2b', 'only a name (the last name is null): the name alone, no stray space', v === 'Solo', JSON.stringify(v))
    v = await adn(E)
    check('A3', 'both names empty: null, although an Auth row with an e-mail address exists', v === null, JSON.stringify(v))
    v = await adn(X)
    check('A4', 'a person with an Auth row and no profile row: null, never the e-mail address', v === null, JSON.stringify(v))
    v = await adn('99999999-9999-9999-9999-999999999999')
    check('A5', 'an unknown id: null', v === null, JSON.stringify(v))
    check('A6', 'the generated function text never reads auth.users', !/auth\.users/.test(adnText.replace(/--.*$/gm, '')), adnText.includes('auth.users') ? 'auth.users appears' : 'no auth.users in the code')

    // ── B: set_actor_name (R59 (b), R62 (c)) ─────────────────────────────────────────────────────────────────────────────────────────────
    await c.query(`create temp table t (id serial primary key, actor uuid, actor_name text, note text)`)
    await c.query(`create trigger t_actor_name before insert or update on pg_temp.t for each row execute function pg_temp.set_actor_main('actor', 'actor_name')`)
    let r = await one(`insert into pg_temp.t (actor, actor_name) values ($1, 'Forged') returning id, actor_name`, [A])
    check('B1', 'INSERT with an id and a supplied name: the name is the trigger\'s', r.actor_name === 'Alice Staff', JSON.stringify(r.actor_name))
    const id1 = r.id
    r = await one(`insert into pg_temp.t (actor, actor_name) values (null, 'Forged') returning actor_name`)
    check('B2', 'INSERT with a null id and a supplied name: the name is null', r.actor_name === null, JSON.stringify(r.actor_name))
    r = await one(`insert into pg_temp.t (actor, actor_name) values ($1, 'Forged') returning actor_name`, [E])
    check('B3', 'INSERT with the id of a person whose names are empty: the name is null (an empty name stores null)', r.actor_name === null, JSON.stringify(r.actor_name))
    r = await one(`update pg_temp.t set actor_name = 'Forged2' where id = $1 returning actor_name`, [id1])
    check('B4', 'UPDATE of the name alone (id unchanged): the old name stays', r.actor_name === 'Alice Staff', JSON.stringify(r.actor_name))
    r = await one(`update pg_temp.t set note = 'x' where id = $1 returning actor_name`, [id1])
    check('B5', 'UPDATE of another column: the name stays', r.actor_name === 'Alice Staff', JSON.stringify(r.actor_name))
    r = await one(`update pg_temp.t set actor = $2, actor_name = 'Forged3' where id = $1 returning actor_name`, [id1, B])
    check('B6', 'UPDATE changing the id to another person (with a supplied name): recomputed from the new id', r.actor_name === 'Bob Staff', JSON.stringify(r.actor_name))
    r = await one(`update pg_temp.t set actor = null where id = $1 returning actor, actor_name`, [id1])
    check('B7', 'UPDATE clearing the id of a LIVE account (a profile row exists): the name becomes null, Bob\'s name is not kept', r.actor === null && r.actor_name === null, JSON.stringify(r))
    r = await one(`insert into pg_temp.t (actor) values ($1) returning id, actor_name`, [A])
    const idAuth = r.id
    r = await one(`update pg_temp.t set actor = $2 where id = $1 returning actor_name`, [idAuth, X])
    check('B7a', 'UPDATE changing the id to a person who has only an Auth row (X exists in the Auth-like table alone): the name is null (no profile, no name)', r.actor_name === null, JSON.stringify(r.actor_name))
    // a row that holds a real name for a person who then loses the profile row but keeps the Auth row
    r = await one(`update pg_temp.t set actor = $2 where id = $1 returning actor_name`, [idAuth, B])
    check('B7b-1', 'control: the id changes to Bob: his name', r.actor_name === 'Bob Staff', JSON.stringify(r.actor_name))
    await c.query(`insert into pg_temp.tu values ('${X}', 'Xavier', 'Auth')`)
    r = await one(`update pg_temp.t set actor = $2 where id = $1 returning actor_name`, [idAuth, X])
    check('B7b0', 'control: the id changes to X once X has a profile row: the name is recomputed', r.actor_name === 'Xavier Auth', JSON.stringify(r.actor_name))
    await c.query(`delete from pg_temp.tu where id = '${X}'`)                              // the profile row goes, the Auth-like row stays: the account is still live
    r = await one(`update pg_temp.t set actor = null where id = $1 returning actor_name`, [idAuth])
    check('B7b', 'UPDATE clearing the id of an account whose profile row is gone but whose Auth row still exists: the name becomes null (the account is live)', r.actor_name === null, JSON.stringify(r.actor_name))
    r = await one(`insert into pg_temp.t (actor) values ($1) returning id, actor_name`, [Dd])
    const idDora = r.id
    check('B8a', 'control: Dora\'s row carries her name', r.actor_name === 'Dora Staff', JSON.stringify(r.actor_name))
    await c.query(`delete from pg_temp.tu where id = '${Dd}'`)
    await c.query(`delete from pg_temp.ta where id = '${Dd}'`)
    r = await one(`update pg_temp.t set actor = null where id = $1 returning actor, actor_name`, [idDora])
    check('B8', 'UPDATE clearing the id once the old account is gone from both tables (the SET NULL of a deletion): the old name stays', r.actor === null && r.actor_name === 'Dora Staff', JSON.stringify(r))
    r = await one(`update pg_temp.t set actor_name = 'Forged4' where id = $1 returning actor_name`, [idDora])
    check('B9', 'UPDATE of the name alone while the id is null: the old name stays', r.actor_name === 'Dora Staff', JSON.stringify(r.actor_name))
    r = await one(`update pg_temp.t set actor = null, actor_name = 'Forged5' where id = $1 returning actor_name`, [idDora])
    check('B10', 'UPDATE keeping the id null and supplying a name: the old name stays', r.actor_name === 'Dora Staff', JSON.stringify(r.actor_name))
    r = await one(`update pg_temp.t set actor = $2 where id = $1 returning actor_name`, [idDora, A])
    check('B11', 'UPDATE from a null id to a person: recomputed from the new id', r.actor_name === 'Alice Staff', JSON.stringify(r.actor_name))

    // ── R: the deletion itself, on temporary tables shaped like the real keys ────────────────────────────────────────────────────────────
    // real shape (r16-00-capture.json): public.users.id -> auth.users ON DELETE CASCADE; staff tables with a key to public.users (SET NULL) or to auth.users (SET NULL after the v3 file).
    const scenario = async (sfx, authKeyFirst) => {
      await c.query(`create temp table a_${sfx} (id uuid primary key, email text)`)
      await c.query(`create temp table u_${sfx} (id uuid primary key, name text, last_name text)`)
      await c.query(adnFor(sfx, `pg_temp.u_${sfx}`))
      await c.query(setFor(sfx, `pg_temp.u_${sfx}`, `pg_temp.a_${sfx}`))
      const keyToAuth = () => c.query(`create temp table ts_a_${sfx} (id serial primary key, actor uuid references pg_temp.a_${sfx}(id) on delete set null, actor_name text)`)
      const cascade = () => c.query(`alter table pg_temp.u_${sfx} add constraint u_${sfx}_fk foreign key (id) references pg_temp.a_${sfx}(id) on delete cascade`)
      if (authKeyFirst) { await keyToAuth(); await cascade() } else { await cascade(); await keyToAuth() }
      await c.query(`create temp table ts_u_${sfx} (id serial primary key, actor uuid references pg_temp.u_${sfx}(id) on delete set null, actor_name text)`)
      for (const t of [`ts_a_${sfx}`, `ts_u_${sfx}`]) await c.query(`create trigger ${t}_name before insert or update on pg_temp.${t} for each row execute function pg_temp.set_actor_${sfx}('actor', 'actor_name')`)
      await c.query(`insert into pg_temp.a_${sfx} values ('${A}', 'a@example.invalid'), ('${B}', 'b@example.invalid')`)
      await c.query(`insert into pg_temp.u_${sfx} values ('${A}', 'Alice', 'Staff'), ('${B}', 'Bob', 'Staff')`)
      await c.query(`insert into pg_temp.ts_a_${sfx} (actor) values ('${A}'), ('${B}')`)
      await c.query(`insert into pg_temp.ts_u_${sfx} (actor) values ('${A}'), ('${B}')`)
      return { a: await one(`select count(*)::int as n from pg_temp.ts_a_${sfx} where actor_name in ('Alice Staff', 'Bob Staff')`), u: await one(`select count(*)::int as n from pg_temp.ts_u_${sfx} where actor_name in ('Alice Staff', 'Bob Staff')`) }
    }
    let s = await scenario('fav', false)
    check('R0', 'control: both staff tables carry the names before the deletion', s.a.n === 2 && s.u.n === 2, `ts_a ${s.a.n}, ts_u ${s.u.n}`)
    await c.query(`delete from pg_temp.a_fav where id = '${A}'`)
    let ra = (await c.query(`select actor, actor_name from pg_temp.ts_a_fav order by id`)).rows
    let ru = (await c.query(`select actor, actor_name from pg_temp.ts_u_fav order by id`)).rows
    check('R1', 'deleting an auth.users-like parent (the profile row cascades first, as in the real database): the staff table with a key to the PROFILE keeps the name with a null id', ru[0].actor === null && ru[0].actor_name === 'Alice Staff' && ru[1].actor_name === 'Bob Staff', JSON.stringify(ru))
    check('R2', 'the same deletion: the staff table with a key to the AUTH parent keeps the name with a null id', ra[0].actor === null && ra[0].actor_name === 'Alice Staff' && ra[1].actor_name === 'Bob Staff', JSON.stringify(ra))
    // INFO: what the rule depends on
    s = await scenario('unf', true)
    await c.query(`delete from pg_temp.a_unf where id = '${A}'`)
    ra = (await c.query(`select actor, actor_name from pg_temp.ts_a_unf order by id`)).rows
    info('R3', 'ORDER DEPENDENCE: the key to the Auth parent was created BEFORE the profile cascade, so its SET NULL fires while the profile row still exists', `name kept: ${JSON.stringify(ra[0].actor_name)} (null means the rule saw a live account); the real database has the cascade first: r16-00-capture.json, position 9 against 10, 14, 15`)
    s = await scenario('prof', false)
    await c.query(`delete from pg_temp.u_prof where id = '${A}'`)
    ru = (await c.query(`select actor, actor_name from pg_temp.ts_u_prof order by id`)).rows
    info('R4', 'a PROFILE row deleted while its Auth row still exists (not the path of deleteAccount, which deletes the Auth user)', `name kept: ${JSON.stringify(ru[0].actor_name)} (null: the account still exists in the Auth-like table)`)

    // ── O: the order of a backfill and the trigger (R59 (b)); U: the updated_at technique (R59 (a)), both unchanged ─────────────────────────
    await c.query(`create temp table pre (id serial primary key, actor uuid, actor_name text)`)
    await c.query(`create temp table post (id serial primary key, actor uuid, actor_name text)`)
    await c.query(`insert into pg_temp.pre (actor) values ('${A}'), ('${B}')`)
    await c.query(`insert into pg_temp.post (actor) values ('${A}'), ('${B}')`)
    await c.query(`update pg_temp.pre set actor_name = pg_temp.adn_main(actor) where actor is not null`)
    await c.query(`create trigger pre_actor_name before insert or update on pg_temp.pre for each row execute function pg_temp.set_actor_main('actor', 'actor_name')`)
    await c.query(`create trigger post_actor_name before insert or update on pg_temp.post for each row execute function pg_temp.set_actor_main('actor', 'actor_name')`)
    await c.query(`update pg_temp.post set actor_name = pg_temp.adn_main(actor) where actor is not null`)
    const pre = (await c.query(`select actor_name from pg_temp.pre order by id`)).rows.map((x) => x.actor_name)
    const post = (await c.query(`select actor_name from pg_temp.post order by id`)).rows.map((x) => x.actor_name)
    check('O1', 'a backfill that runs BEFORE the trigger is created fills the names', pre[0] === 'Alice Staff' && pre[1] === 'Bob Staff', JSON.stringify(pre))
    check('O2', 'the same backfill AFTER the trigger exists is overridden by the trigger (names stay null): the order matters', post[0] === null && post[1] === null, JSON.stringify(post))
    await c.query(`create temp table tpl (id serial primary key, actor uuid, actor_name text, updated_at timestamptz not null default now())`)
    await c.query(`create function pg_temp.touch() returns trigger language plpgsql as $$ begin new.updated_at := clock_timestamp(); return new; end $$`)
    await c.query(`create trigger trg_tpl_updated_at before update on pg_temp.tpl for each row execute function pg_temp.touch()`)
    await c.query(`insert into pg_temp.tpl (actor, updated_at) values ('${A}', '2020-01-01T00:00:00Z'), ('${B}', '2020-01-01T00:00:00Z')`)
    await c.query(`update pg_temp.tpl set actor_name = pg_temp.adn_main(actor) where actor is not null`)
    let n = (await one(`select count(*)::int as n from pg_temp.tpl where updated_at <> '2020-01-01T00:00:00Z'`)).n
    check('U1', 'a backfill under the BEFORE UPDATE trigger rewrites updated_at (the hazard R59 (a) names)', n === 2, `rows changed: ${n}`)
    await c.query(`alter table pg_temp.tpl disable trigger trg_tpl_updated_at`)
    await c.query(`update pg_temp.tpl set updated_at = '2020-01-01T00:00:00Z', actor_name = null`)
    await c.query(`update pg_temp.tpl set actor_name = pg_temp.adn_main(actor) where actor is not null`)
    await c.query(`alter table pg_temp.tpl enable trigger trg_tpl_updated_at`)
    n = (await one(`select count(*)::int as n from pg_temp.tpl where updated_at <> '2020-01-01T00:00:00Z'`)).n
    const named = (await one(`select count(*)::int as n from pg_temp.tpl where actor_name is not null`)).n
    check('U2', 'the same backfill with the trigger disabled around it leaves updated_at alone and still fills the names', n === 0 && named === 2, `rows changed: ${n}; named: ${named}`)
    const en = (await one(`select t.tgenabled as e from pg_trigger t where t.tgrelid = 'pg_temp.tpl'::regclass and t.tgname = 'trg_tpl_updated_at'`)).e
    check('U3', 'the trigger is enabled again afterwards (tgenabled = O, as the preflight requires)', en === 'O', JSON.stringify(en))

    // ── G: the grants of R62 (b), on temporary tables that carry the captured ACL shape ──────────────────────────────────────────────────
    const ver = Number((await one(`show server_version_num`)).server_version_num)
    const ownerPriv = ver >= 170000 ? 'select, maintain' : 'select'
    const PAGES = ['id', 'title', 'slug', 'content', 'is_published', 'updated_by', 'updated_at']
    const FOOTER = ['locale', 'brand_title', 'tagline', 'nav_section_title', 'nav_links', 'info_section_title', 'info_links', 'social_section_title', 'social_links', 'copyright_template', 'updated_at', 'updated_by']
    await c.query(`create temp table pages_t (${PAGES.map((x) => `${x} text`).join(', ')}, updated_by_name text)`)
    await c.query(`create temp table footer_t (${FOOTER.map((x) => `${x} text`).join(', ')}, updated_by_name text)`)
    await c.query(`grant ${ownerPriv} on pg_temp.pages_t to anon, authenticated`)           // like the captured `anon=rm`, `authenticated=rm`
    await c.query(`grant all on pg_temp.footer_t to anon, authenticated`)                  // like the captured `anon=arwdDxtm`, `authenticated=arwdDxtm`
    const acl = async (t) => (await one(`select relacl::text as a from pg_class where oid = 'pg_temp.${t}'::regclass`)).a
    const colAcls = async (t) => (await one(`select count(*)::int as n from pg_attribute where attrelid = 'pg_temp.${t}'::regclass and attnum > 0 and not attisdropped and attacl is not null`)).n
    const acl0 = { p: await acl('pages_t'), f: await acl('footer_t') }
    const priv = async (role, t, kind, col) => (await one(col ? `select has_column_privilege($1::name, 'pg_temp.${t}'::text, $2::text, $3::text) as ok` : `select has_table_privilege($1::name, 'pg_temp.${t}'::text, $2::text) as ok`, col ? [role, col, kind] : [role, kind])).ok
    for (const st of applyGrants) await c.query(st)
    for (const role of ['anon', 'authenticated']) {
      for (const [t, cols] of [['pages_t', PAGES], ['footer_t', FOOTER]]) {
        const readable = []; for (const col of cols) readable.push(await priv(role, t, 'SELECT', col))
        check(`G1-${role}-${t}`, `after the apply statements ${role} can SELECT every captured column of ${t}`, readable.every(Boolean), `${readable.filter(Boolean).length} of ${cols.length}`)
        const name = await priv(role, t, 'SELECT', 'updated_by_name')
        check(`G2-${role}-${t}`, `after the apply statements ${role} cannot SELECT updated_by_name of ${t}`, name === false, String(name))
        const tableLevel = await priv(role, t, 'SELECT')
        check(`G3-${role}-${t}`, `after the apply statements ${role} holds no table-level SELECT on ${t}`, tableLevel === false, String(tableLevel))
      }
    }
    const keep = { footerInsert: await priv('anon', 'footer_t', 'INSERT'), footerUpdate: await priv('authenticated', 'footer_t', 'UPDATE'), pagesMaintain: ver >= 170000 ? await priv('anon', 'pages_t', 'MAINTAIN') : true }
    check('G4', 'the other privileges are untouched (footer INSERT / UPDATE of anon / authenticated; pages MAINTAIN)', keep.footerInsert && keep.footerUpdate && keep.pagesMaintain, JSON.stringify(keep))
    for (const st of rollbackGrants) await c.query(st)
    const acl1 = { p: await acl('pages_t'), f: await acl('footer_t') }
    check('G5', 'the rollback statements restore the table-level ACL text exactly (pages and footer)', acl1.p === acl0.p && acl1.f === acl0.f, `pages ${acl1.p === acl0.p ? 'equal' : `${acl0.p} -> ${acl1.p}`}; footer ${acl1.f === acl0.f ? 'equal' : `${acl0.f} -> ${acl1.f}`}`)
    const left = (await colAcls('pages_t')) + (await colAcls('footer_t'))
    check('G6', 'the rollback statements leave no column-level ACL', left === 0, `${left} columns with an attacl`)
    check('G7', 'anon can SELECT updated_by_name again after the rollback (the pre-apply state, table-level)', (await priv('anon', 'pages_t', 'SELECT', 'updated_by_name')) === true, 'restored')
  } catch (e) {
    fails++
    console.log('ERROR:', scrub(e.message))
  }
  try { await c.query('ROLLBACK') } catch { /* temp objects vanish with the session */ }
  await c.end()
  console.log(fails ? `RESULT: ${fails} FAILED` : 'RESULT: all cases hold')
  process.exit(fails ? 1 : 0)
})()
