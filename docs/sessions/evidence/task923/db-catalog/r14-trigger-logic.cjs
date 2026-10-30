/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Revision 14 (R59 (a), (b)): runs the REAL text of set_actor_name() from proposed-account-deletion.sql on real PostgreSQL, against TEMPORARY objects only.
// Nothing of the application schema is touched: one transaction on the approved development database creates a pg_temp table, a pg_temp stand-in for account_display_name() and the trigger
// function extracted from the generated file (its two names replaced, nothing else), exercises it, and ROLLBACKs; temp objects vanish with the session in any case. No row of any public table
// is read or written.
//   node docs/sessions/evidence/task923/db-catalog/r14-trigger-logic.cjs --i-confirm-dev-database
// Cases (each prints ok / FAIL): R59 (b) the name is the trigger's alone on INSERT and UPDATE (a supplied name is replaced / ignored; the id changing to another person recomputes; the id
// becoming null or staying unchanged keeps the old name); the order argument (a backfill BEFORE the trigger sets the names, a backfill AFTER it does not); R59 (a) a backfill under a
// BEFORE UPDATE trigger that sets updated_at rewrites it, and with the trigger disabled around the backfill and enabled again it does not (and the trigger is enabled again, state 'O').
const fs = require('fs')
const { connect, scrub } = require('./lib.cjs')

if (!process.argv.includes('--i-confirm-dev-database')) {
  console.log('Refusing to run: pass --i-confirm-dev-database to confirm that DATABASE_URL points at the development project.')
  process.exit(2)
}
const sql = fs.readFileSync('C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/db-catalog/proposed-account-deletion.sql', 'utf8')
const m = /create function public\.set_actor_name\(\) returns trigger[\s\S]*?end \$\$;/.exec(sql)
if (!m) throw new Error('set_actor_name() not found in the generated file')
const fnText = m[0].replace('public.set_actor_name()', 'pg_temp.set_actor_name_t()').split('public.account_display_name(').join('pg_temp.adn(')
if (fnText.includes('public.set_actor_name') || fnText.split('pg_temp.adn(').length < 3) throw new Error('the extracted function was not renamed as expected')

let fails = 0
const check = (id, what, ok, observed) => { if (!ok) fails++; console.log(`${ok ? ' ok ' : 'FAIL'} ${id} ${what} | observed: ${scrub(observed)}`) }

;(async () => {
  const c = await connect()
  const A = '11111111-1111-1111-1111-111111111111'
  const B = '22222222-2222-2222-2222-222222222222'
  try {
    await c.query('BEGIN')
    await c.query('set local search_path = public, pg_temp')
    await c.query(`create temp table person (id uuid primary key, name text)`)
    await c.query(`insert into pg_temp.person values ('${A}', 'Alice Staff'), ('${B}', 'Bob Staff')`)
    await c.query(`create function pg_temp.adn(p uuid) returns text language sql stable as $$ select name from pg_temp.person where id = p $$`)
    await c.query(fnText)
    const one = async (s, p) => (await c.query(s, p)).rows[0]

    // ── R59 (b): the name is the trigger's alone ─────────────────────────────────────────────────────────────────────────────────────────
    await c.query(`create temp table t (id serial primary key, actor uuid, actor_name text, note text)`)
    await c.query(`create trigger t_actor_name before insert or update on pg_temp.t for each row execute function pg_temp.set_actor_name_t('actor', 'actor_name')`)
    let r = await one(`insert into pg_temp.t (actor, actor_name) values ($1, 'Forged') returning id, actor_name`, [A])
    check('B1', 'INSERT with an id and a supplied name: the name is the trigger\'s', r.actor_name === 'Alice Staff', JSON.stringify(r.actor_name))
    const id1 = r.id
    r = await one(`insert into pg_temp.t (actor, actor_name) values (null, 'Forged') returning actor_name`)
    check('B2', 'INSERT with a null id and a supplied name: the name is null', r.actor_name === null, JSON.stringify(r.actor_name))
    r = await one(`insert into pg_temp.t (actor) values (null) returning actor_name`)
    check('B3', 'INSERT with a null id and no name: the name is null', r.actor_name === null, JSON.stringify(r.actor_name))
    r = await one(`update pg_temp.t set actor_name = 'Forged2' where id = $1 returning actor_name`, [id1])
    check('B4', 'UPDATE of the name alone (id unchanged): the old name stays', r.actor_name === 'Alice Staff', JSON.stringify(r.actor_name))
    r = await one(`update pg_temp.t set note = 'x' where id = $1 returning actor_name`, [id1])
    check('B5', 'UPDATE of another column: the name stays', r.actor_name === 'Alice Staff', JSON.stringify(r.actor_name))
    r = await one(`update pg_temp.t set actor = $2, actor_name = 'Forged3' where id = $1 returning actor_name`, [id1, B])
    check('B6', 'UPDATE changing the id to another person (with a supplied name): recomputed from the new id', r.actor_name === 'Bob Staff', JSON.stringify(r.actor_name))
    r = await one(`update pg_temp.t set actor = null where id = $1 returning actor, actor_name`, [id1])
    check('B7', 'UPDATE making the id null (the SET NULL of a deletion): the old name stays', r.actor === null && r.actor_name === 'Bob Staff', JSON.stringify(r))
    r = await one(`update pg_temp.t set actor_name = 'Forged4' where id = $1 returning actor_name`, [id1])
    check('B8', 'UPDATE of the name alone while the id is null: the old name stays', r.actor_name === 'Bob Staff', JSON.stringify(r.actor_name))
    r = await one(`update pg_temp.t set actor = null, actor_name = 'Forged5' where id = $1 returning actor_name`, [id1])
    check('B9', 'UPDATE keeping the id null and supplying a name: the old name stays', r.actor_name === 'Bob Staff', JSON.stringify(r.actor_name))
    r = await one(`update pg_temp.t set actor = $2 where id = $1 returning actor_name`, [id1, A])
    check('B10', 'UPDATE from a null id to a person: recomputed', r.actor_name === 'Alice Staff', JSON.stringify(r.actor_name))

    // ── the order: a backfill BEFORE the trigger sets the names, a backfill AFTER it does not ───────────────────────────────────────────────
    await c.query(`create temp table pre (id serial primary key, actor uuid, actor_name text)`)
    await c.query(`create temp table post (id serial primary key, actor uuid, actor_name text)`)
    await c.query(`insert into pg_temp.pre (actor) values ('${A}'), ('${B}')`)
    await c.query(`insert into pg_temp.post (actor) values ('${A}'), ('${B}')`)
    await c.query(`update pg_temp.pre set actor_name = pg_temp.adn(actor) where actor is not null`)                          // backfill first
    await c.query(`create trigger pre_actor_name before insert or update on pg_temp.pre for each row execute function pg_temp.set_actor_name_t('actor', 'actor_name')`)
    await c.query(`create trigger post_actor_name before insert or update on pg_temp.post for each row execute function pg_temp.set_actor_name_t('actor', 'actor_name')`)
    await c.query(`update pg_temp.post set actor_name = pg_temp.adn(actor) where actor is not null`)                         // backfill after the trigger
    const pre = (await c.query(`select actor_name from pg_temp.pre order by id`)).rows.map((x) => x.actor_name)
    const post = (await c.query(`select actor_name from pg_temp.post order by id`)).rows.map((x) => x.actor_name)
    check('O1', 'a backfill that runs BEFORE the trigger is created fills the names', pre[0] === 'Alice Staff' && pre[1] === 'Bob Staff', JSON.stringify(pre))
    check('O2', 'the same backfill AFTER the trigger exists is overridden by the trigger (names stay null): the order matters', post[0] === null && post[1] === null, JSON.stringify(post))

    // ── R59 (a): updated_at through the backfill ─────────────────────────────────────────────────────────────────────────────────────────
    await c.query(`create temp table tpl (id serial primary key, actor uuid, actor_name text, updated_at timestamptz not null default now())`)
    await c.query(`create function pg_temp.touch() returns trigger language plpgsql as $$ begin new.updated_at := clock_timestamp(); return new; end $$`)
    await c.query(`create trigger trg_tpl_updated_at before update on pg_temp.tpl for each row execute function pg_temp.touch()`)
    await c.query(`insert into pg_temp.tpl (actor, updated_at) values ('${A}', '2020-01-01T00:00:00Z'), ('${B}', '2020-01-01T00:00:00Z')`)
    await c.query(`update pg_temp.tpl set actor_name = pg_temp.adn(actor) where actor is not null`)
    let n = (await one(`select count(*)::int as n from pg_temp.tpl where updated_at <> '2020-01-01T00:00:00Z'`)).n
    check('U1', 'a backfill under the BEFORE UPDATE trigger rewrites updated_at (the hazard R59 (a) names)', n === 2, `rows changed: ${n}`)
    await c.query(`alter table pg_temp.tpl disable trigger trg_tpl_updated_at`)
    await c.query(`update pg_temp.tpl set updated_at = '2020-01-01T00:00:00Z', actor_name = null`)                           // reset the rows with the trigger off, then the backfill under test
    await c.query(`update pg_temp.tpl set actor_name = pg_temp.adn(actor) where actor is not null`)
    await c.query(`alter table pg_temp.tpl enable trigger trg_tpl_updated_at`)
    n = (await one(`select count(*)::int as n from pg_temp.tpl where updated_at <> '2020-01-01T00:00:00Z'`)).n
    const named = (await one(`select count(*)::int as n from pg_temp.tpl where actor_name is not null`)).n
    check('U2', 'the same backfill with the trigger disabled around it leaves updated_at alone and still fills the names', n === 0 && named === 2, `rows changed: ${n}; named: ${named}`)
    const en = (await one(`select t.tgenabled as e from pg_trigger t where t.tgrelid = 'pg_temp.tpl'::regclass and t.tgname = 'trg_tpl_updated_at'`)).e
    check('U3', 'the trigger is enabled again afterwards (tgenabled = O, as the preflight requires)', en === 'O', JSON.stringify(en))
    await c.query(`update pg_temp.tpl set actor_name = actor_name where id = 1`)
    n = (await one(`select count(*)::int as n from pg_temp.tpl where updated_at <> '2020-01-01T00:00:00Z'`)).n
    check('U4', 'after enabling, an ordinary UPDATE fires the trigger again', n === 1, `rows changed: ${n}`)
  } catch (e) {
    fails++
    console.log('ERROR:', scrub(e.message))
  }
  try { await c.query('ROLLBACK') } catch {}
  await c.end()
  console.log(fails ? `RESULT: ${fails} FAILED` : 'RESULT: all cases hold')
  process.exit(fails ? 1 : 0)
})()
