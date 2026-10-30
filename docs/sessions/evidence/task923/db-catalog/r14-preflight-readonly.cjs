/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Revision 14 (R58, R59): runs the PREFLIGHT block (`do $pre$ ... end $pre$;`) of each generated apply file on the approved development database inside a READ ONLY transaction that is
// ROLLBACKed. A preflight only reads the catalog (plus one existence read of auth.sessions); the transaction is read-only, so PostgreSQL itself refuses any write. Nothing of either file
// other than its preflight is executed: no object is created, changed or locked beyond catalog reads. It proves that the md5 / ACL / options / proconfig / constraint-definition /
// trigger comparisons written into the files hold against today's live schema, and (second run, on a deliberately edited copy of the text in memory) that each of them refuses when it differs.
//   node docs/sessions/evidence/task923/db-catalog/r14-preflight-readonly.cjs --i-confirm-dev-database
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
    const cases = [
      ['hardening: view md5', hard, cap.view.md5, '00000000000000000000000000000000', /public_user_profiles changed since the capture \(definition md5\)/],
      ['hardening: view ACL', hard, cap.view.acl, '{postgres=arwdDxtm/postgres}', /grants or the options of public\.public_user_profiles/],
      ['hardening: view options', hard, "array['security_invoker=false']::text[]", "array['security_invoker=true']::text[]", /grants or the options of public\.public_user_profiles/],
      ['hardening: clear_user_history settings', hard, "array['search_path=public']::text[]", "array['search_path=public, pg_temp']::text[]", /settings of public\.(clear_user_history|handle_new_user_notifications|listing_contact_events_set_owner|process_saved_search_notify)/],
      ['hardening: admin_search_users_by_email settings', hard, "array['search_path=auth, public']::text[]", "array['search_path=auth']::text[]", /settings of public\.admin_search_users_by_email/],
      ['hardening: rls_auto_enable settings', hard, "array['search_path=pg_catalog']::text[]", "array['search_path=pg_catalog, pg_temp']::text[]", /settings of public\.rls_auto_enable/],
      ['deletion: a constraint definition (ON DELETE clause added)', del, "'FOREIGN KEY (actor_id) REFERENCES users(id)'", "'FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE'", /report_actions.*is defined as/],
      ['deletion: an updated_at trigger name', del, "'trg_email_templates_updated_at'", "'trg_email_templates_updated_at_x'", /trigger trg_email_templates_updated_at on public\.email_templates is not the enabled trigger/],   // only the compared name is broken; the message text keeps the audited name
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
