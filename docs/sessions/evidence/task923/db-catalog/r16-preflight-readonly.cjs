/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Revision 16 (R62, R63, R64, R65; AC62, AC63): runs the PREFLIGHT block (`do $pre$ ... end $pre$;`) of each generated apply file (hardening v7, deletion v3) on the approved development
// database inside a READ ONLY transaction that is ROLLBACKed. A preflight only reads the catalog (plus one existence read of auth.sessions); the transaction is read-only, so PostgreSQL itself
// refuses any write. Nothing of either file other than its preflight is executed: no object is created, changed or locked beyond catalog reads. It proves that the comparisons written into
// the files hold against today's live schema, and (second part, on a deliberately edited copy of the text in memory) that each of them refuses when it differs - among them, for the deletion
// file, a changed column list and a changed table-level ACL of pages and site_footer (R62 (b)).
//   node docs/sessions/evidence/task923/db-catalog/r16-preflight-readonly.cjs --i-confirm-dev-database
const fs = require('fs')
const { connect, scrub } = require('./lib.cjs')

if (!process.argv.includes('--i-confirm-dev-database')) {
  console.log('Refusing to run: pass --i-confirm-dev-database to confirm that DATABASE_URL points at the development project.')
  process.exit(2)
}
const D = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/db-catalog/'
const FILES = ['proposed-hardening.sql', 'proposed-account-deletion.sql']
const preflightOf = (sql) => { const m = /do \$pre\$[\s\S]*?end \$pre\$;/.exec(sql); if (!m) throw new Error('no preflight block'); return m[0] }

let fails = 0
const report = (ok, text) => { if (!ok) fails++; console.log(`${ok ? ' ok ' : 'FAIL'} ${scrub(text)}`) }

async function run(c, block) {
  await c.query('BEGIN READ ONLY')
  try {
    await c.query('set local search_path = public, pg_temp')
    await c.query(block)
    return { ok: true }
  } catch (e) {
    return { ok: false, message: String(e.message) }
  } finally {
    await c.query('ROLLBACK')
  }
}

;(async () => {
  const c = await connect()
  try {
    for (const f of FILES) {
      const block = preflightOf(fs.readFileSync(D + f, 'utf8'))
      const r = await run(c, block)
      report(r.ok, `${f}: preflight against the live schema: ${r.ok ? 'passes' : 'REFUSES: ' + r.message.slice(0, 220)}`)
    }
    // sensitivity: a preflight that cannot refuse proves nothing. Each comparison is broken in memory (the text only, never the database) and must make the block refuse.
    const hard = preflightOf(fs.readFileSync(D + 'proposed-hardening.sql', 'utf8'))
    const del = preflightOf(fs.readFileSync(D + 'proposed-account-deletion.sql', 'utf8'))
    const cap = require('C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/r14-03-capture.json')
    const cap16 = require('C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/r16-00-capture.json')
    const colsOf = (tbl) => cap16.columns.filter((x) => x.tbl === tbl).map((x) => x.col)
    const aclOf = (tbl) => cap16.tables.find((x) => x.tbl === tbl).acl
    const arr = (cols) => `array[${cols.map((x) => `'${x}'`).join(', ')}]::text[]`
    const cases = [
      ['hardening: view md5', hard, cap.view.md5, '00000000000000000000000000000000', /public_user_profiles changed since the capture \(definition md5\)/],
      ['hardening: view ACL', hard, cap.view.acl, '{postgres=arwdDxtm/postgres}', /grants or the options of public\.public_user_profiles/],
      ['hardening: view options', hard, "array['security_invoker=false']::text[]", "array['security_invoker=true']::text[]", /grants or the options of public\.public_user_profiles/],
      ['hardening: clear_user_history settings', hard, "array['search_path=public']::text[]", "array['search_path=public, pg_temp']::text[]", /settings of public\.(clear_user_history|handle_new_user_notifications|listing_contact_events_set_owner|process_saved_search_notify)/],
      ['hardening: admin_search_users_by_email settings', hard, "array['search_path=auth, public']::text[]", "array['search_path=auth']::text[]", /settings of public\.admin_search_users_by_email/],
      ['hardening: rls_auto_enable settings', hard, "array['search_path=pg_catalog']::text[]", "array['search_path=pg_catalog, pg_temp']::text[]", /settings of public\.rls_auto_enable/],
      ['hardening v7: the default of listings.created_at', hard, "is distinct from 'now()' then", "is distinct from 'clock_timestamp()' then", /default of public\.listings\.created_at is not the audited one/],
      ['hardening v7: the default of listings.public_id', hard, "is distinct from 'nextval(''listings_public_id_seq''::regclass)'", "is distinct from 'nextval(''other_seq''::regclass)'", /public\.listings\.public_id or its sequence is not the audited one/],
      ['hardening v7: price_initial already exists', hard, "and a.attname = 'price_initial' and not a.attisdropped) then", "and a.attname = 'price' and not a.attisdropped) then", /price_initial already exists/],
      ['hardening v7: the triggers of listings', hard, "t.tgname in ('listings_search_vector', 'listings_updated_at')", "t.tgname in ('listings_search_vector', 'listings_updated_at_x')", /triggers of public\.listings are not the two enabled ones/],
      ['hardening v7: the type of currencies.id', hard, "is distinct from 'integer' then", "is distinct from 'bigint' then", /public\.currencies\.id is not integer/],
      ['hardening v7: end_user_sessions already exists', hard, "to_regprocedure('public.end_user_sessions(uuid)') is not null", "to_regprocedure('public.caller_is_active()') is null", /v7 objects already exist/],
      ['deletion: a constraint definition (ON DELETE clause added)', del, "'FOREIGN KEY (actor_id) REFERENCES users(id)'", "'FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE'", /report_actions.*is defined as/],
      ['deletion: an updated_at trigger name', del, "'trg_email_templates_updated_at'", "'trg_email_templates_updated_at_x'", /trigger trg_email_templates_updated_at on public\.email_templates is not the enabled trigger/],   // only the compared name is broken; the message text keeps the audited name
      ['deletion v3: a changed column list of pages', del, arr(colsOf('pages')), arr(colsOf('pages').filter((x) => x !== 'slug')), /columns of public\.pages are not the audited ones/],
      ['deletion v3: a changed column list of site_footer', del, arr(colsOf('site_footer')), arr([...colsOf('site_footer'), 'extra_column']), /columns of public\.site_footer are not the audited ones/],
      ['deletion v3: a changed table-level ACL of pages', del, `'${aclOf('pages')}'`, `'${aclOf('pages').replace('anon=rm/postgres', 'anon=r/postgres')}'`, /table-level ACL of public\.pages is not the audited one/],
      ['deletion v3: a changed table-level ACL of site_footer', del, `'${aclOf('site_footer')}'`, `'${aclOf('site_footer').replace('anon=arwdDxtm/postgres', 'anon=arwdDxt/postgres')}'`, /table-level ACL of public\.site_footer is not the audited one/],
    ]
    for (const [name, block, from, to, expect] of cases) {
      if (block.split(from).length < 2) { report(false, `sensitivity ${name}: the text to break was not found`); continue }
      const broken = block.replace(from, to)
      const r = await run(c, broken)
      report(!r.ok && expect.test(r.message), `sensitivity ${name}: ${r.ok ? 'the broken preflight still PASSES' : 'refuses: ' + r.message.slice(0, 160)}`)
    }
  } catch (e) {
    fails++
    console.log('ERROR:', scrub(e.message))
  }
  await c.end()
  console.log(fails ? `RESULT: ${fails} FAILED` : 'RESULT: both preflights pass on the live schema and each broken comparison is refused')
  process.exit(fails ? 1 : 0)
})()
