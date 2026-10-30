/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Revision 15 (R61, kickoff section 25): does a view that is NOT security_invoker answer `current_user` as the CALLER or as the view's owner?
// The v6 condition of public.public_user_profiles is `current_user not in ('authenticated', 'anon') or (select public.caller_is_active())`; it only works when `current_user` inside a definer view
// is the caller. One transaction on the approved development database, ROLLBACKed: it creates a scratch schema (never `public`) with a definer view `select current_user::text`, grants it to
// `authenticated` and `service_role`, reads it under `set local role authenticated` and `set local role service_role`, and rolls back; the rollback is then verified (the scratch schema is gone).
// No application object is created, changed or read.
//   node docs/sessions/evidence/task923/db-catalog/r15-view-probe.cjs --i-confirm-dev-database
const { connect, scrub } = require('./lib.cjs')

if (!process.argv.includes('--i-confirm-dev-database')) {
  console.log('Refusing to run: pass --i-confirm-dev-database to confirm that DATABASE_URL points at the development project.')
  process.exit(2)
}
;(async () => {
  const c = await connect()
  const S = 'zz_synth_probe_' + Date.now().toString(36)
  const answers = {}
  let error = null
  try {
    await c.query('BEGIN')
    const who = (await c.query('select current_user::text as u, session_user::text as s')).rows[0]
    console.log(`connected as current_user=${who.u} session_user=${who.s} (the owner of the scratch objects below)`)
    await c.query(`create schema ${S}`)
    await c.query(`create view ${S}.who with (security_invoker = false) as select current_user::text as who`)
    await c.query(`grant usage on schema ${S} to authenticated, service_role`)
    await c.query(`grant select on ${S}.who to authenticated, service_role`)
    const owner = (await c.query(`select pg_get_userbyid(c.relowner) as o, c.reloptions as options from pg_class c where c.oid = '${S}.who'::regclass`)).rows[0]
    console.log(`the view is owned by ${owner.o}, options ${JSON.stringify(owner.options)}`)
    for (const role of ['authenticated', 'service_role']) {
      await c.query(`set local role ${role}`)
      answers[role] = (await c.query(`select who from ${S}.who`)).rows[0].who
      await c.query('reset role')
      console.log(`read under set local role ${role}: the definer view answered "${answers[role]}"`)
    }
    await c.query('ROLLBACK')
  } catch (e) {
    error = String(e.message)
    try { await c.query('ROLLBACK') } catch {}
  }
  let gone = null
  try { gone = (await c.query(`select to_regnamespace('${S}') is null as gone`)).rows[0].gone } catch (e) { error = (error || '') + ' | rollback check: ' + String(e.message) }
  await c.end()
  const ok = !error && answers.authenticated === 'authenticated' && answers.service_role === 'service_role' && gone === true
  console.log(`transaction rolled back, scratch schema gone: ${gone}`)
  if (error) console.log('ERROR:', scrub(error))
  console.log(ok ? 'RESULT: a definer view answers each role\'s own name (current_user is the caller); the rollback is verified' : 'RESULT: the premise of R61 is NOT proved')
  process.exit(ok ? 0 : 1)
})()
