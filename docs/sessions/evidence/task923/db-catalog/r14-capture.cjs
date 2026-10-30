/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// READ-ONLY capture of Revision 14 (Task 923 R58 (a) (b), R59 (c); kickoff section 24). One BEGIN READ ONLY transaction on the approved development database, always ROLLBACKed;
// nothing is created, changed or locked beyond catalog reads. Writes docs/sessions/evidence/task923/r14-03-capture.json, which gen-sql.cjs and gen-sql-deletion.cjs read:
//   view       pg_get_viewdef('public.public_user_profiles', true) and its md5, the reloptions, the ACL and the owner, the columns (R58 (a))
//   functions  the schema, name, identity arguments and the exact proconfig of the six SECURITY DEFINER functions of R58 (b), and of every SECURITY DEFINER function of `public`
//   constraints pg_get_constraintdef(oid) and the delete rule of every foreign key of r9-61-deletion-schema-facts.txt (the seven re-created ones among them, R59 (c))
//   triggers   every non-internal trigger of the tables of the deletion design (R59 (a): the two updated_at triggers; any other BEFORE UPDATE trigger is visible)
//   columns    the columns of the tables the harness writes fixtures into (R59 (d))
// Nothing secret is read or printed: no connection detail, no row data; every printed line passes scrub().
//   node docs/sessions/evidence/task923/db-catalog/r14-capture.cjs --i-confirm-dev-database
const fs = require('fs')
const crypto = require('crypto')
const { connect, scrub } = require('./lib.cjs')

if (!process.argv.includes('--i-confirm-dev-database')) {
  console.log('Refusing to run: pass --i-confirm-dev-database to confirm that DATABASE_URL points at the development project.')
  process.exit(2)
}
const D = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/'
const md5 = (s) => crypto.createHash('md5').update(s).digest('hex')
const keys = fs.readFileSync(D + 'r9-61-deletion-schema-facts.txt', 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map((l) => {
  const m = /^(\w+)\.(\w+) -> (auth\.users|users) (\w) notnull=(true|false) \((\w+)\)$/.exec(l)
  if (!m) throw new Error('unparsed fact line: ' + l)
  return { tbl: m[1], col: m[2], con: m[6] }
})
const NAMED = ['clear_user_history', 'handle_new_user_notifications', 'listing_contact_events_set_owner', 'process_saved_search_notify', 'admin_search_users_by_email', 'rls_auto_enable']
const DESIGN_TABLES = ['contact_inquiries', 'contact_inquiry_replies', 'email_templates', 'history_clear_events', 'pages', 'report_actions', 'role_permission_events', 'role_permissions', 'site_footer',
  'support_ticket_events', 'support_tickets', 'user_change_log', 'user_status_history', 'verification_requests', 'listing_reports', 'listing_views', 'listing_contact_events', 'companies', 'listings', 'users']

;(async () => {
  const c = await connect()
  const out = { takenAt: new Date().toISOString() }
  try {
    await c.query('BEGIN READ ONLY')
    // the text of a view definition and of a constraint definition depends on the search_path that renders it (`users` or `public.users`): the captured md5 and definitions are compared by the
    // preflight of the SQL files, which set the same path, so both sides render identically
    await c.query('set local search_path = public, pg_temp')
    const q = async (s, p) => (await c.query(s, p)).rows

    // ── R58 (a): the view ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
    const v = (await q(`select pg_get_viewdef(c.oid, true) as def, md5(pg_get_viewdef(c.oid, true)) as md5, c.reloptions as options, c.relacl::text as acl, pg_get_userbyid(c.relowner) as owner, c.relkind
      from pg_class c where c.oid = 'public.public_user_profiles'::regclass`))[0]
    if (md5(v.def) !== v.md5) throw new Error('the md5 of the view definition computed in JavaScript differs from the one computed in PostgreSQL')
    const vcols = await q(`select a.attname as name, format_type(a.atttypid, a.atttypmod) as type from pg_attribute a where a.attrelid = 'public.public_user_profiles'::regclass and a.attnum > 0 and not a.attisdropped order by a.attnum`)
    out.view = { name: 'public.public_user_profiles', relkind: v.relkind, owner: v.owner, options: v.options, acl: v.acl, md5: v.md5, def: v.def, columns: vcols }

    // ── R58 (b): the functions ───────────────────────────────────────────────────────────────────────────────────────────────────────────
    const fnq = `select n.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as args, oidvectortypes(p.proargtypes) as argtypes, p.prosecdef as secdef, p.proconfig as config, p.prokind as kind
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace`
    out.functionsNamed = await q(`${fnq} where p.proname = any($1) order by 1, 2, 3`, [NAMED])
    out.functionsSecdefPublic = await q(`${fnq} where n.nspname = 'public' and p.prosecdef order by 2, 3`)

    // ── R59 (c): the constraint definitions ──────────────────────────────────────────────────────────────────────────────────────────────
    out.constraints = []
    for (const k of keys) {
      const r = await q(`select pg_get_constraintdef(c.oid) as def, c.confdeltype as delete_rule, c.confupdtype as update_rule, c.confmatchtype as match_type, c.condeferrable as deferrable, c.condeferred as deferred, c.convalidated as validated
        from pg_constraint c where c.conrelid = ('public.' || $1)::regclass and c.conname = $2 and c.contype = 'f'`, [k.tbl, k.con])
      if (r.length !== 1) throw new Error(`key ${k.tbl}.${k.con}: ${r.length} rows`)
      out.constraints.push({ ...k, ...r[0] })
    }

    // ── R59 (a): the triggers of the tables of the design ────────────────────────────────────────────────────────────────────────────────
    out.triggers = await q(`select c.relname as tbl, t.tgname as name, t.tgenabled as enabled, pg_get_triggerdef(t.oid) as def from pg_trigger t join pg_class c on c.oid = t.tgrelid
      where not t.tgisinternal and c.relnamespace = 'public'::regnamespace and c.relname = any($1) order by 1, 2`, [DESIGN_TABLES])

    // ── R59 (d): the columns the harness writes fixtures into ────────────────────────────────────────────────────────────────────────────
    out.columns = await q(`select table_name as tbl, column_name as col, data_type as type, is_nullable as nullable, column_default as def, is_generated as generated
      from information_schema.columns where table_schema = 'public' and table_name = any($1) order by table_name, ordinal_position`, [DESIGN_TABLES])
    await c.query('ROLLBACK')
  } catch (e) {
    try { await c.query('ROLLBACK') } catch {}
    console.log('CAPTURE ERROR:', scrub(e.message))
    await c.end()
    process.exit(1)
  }
  await c.end()
  fs.writeFileSync(D + 'r14-03-capture.json', JSON.stringify(out, null, 1))
  const line = (s) => console.log(scrub(s))
  line(`captured ${out.takenAt}`)
  line(`view ${out.view.name}: owner ${out.view.owner}, options ${JSON.stringify(out.view.options)}, acl ${out.view.acl}, md5 ${out.view.md5}, ${out.view.columns.length} columns`)
  line(`functions named: ${out.functionsNamed.map((f) => `${f.schema}.${f.name}(${f.args}) secdef=${f.secdef} config=${JSON.stringify(f.config)}`).join(' | ')}`)
  line(`SECURITY DEFINER functions of public: ${out.functionsSecdefPublic.length}; without pg_temp last: ${out.functionsSecdefPublic.filter((f) => !(f.config || []).some((x) => /^search_path=.*pg_temp\s*$/.test(x))).map((f) => f.name).join(', ') || 'none'}`)
  line(`constraints captured: ${out.constraints.length}; rules: ${JSON.stringify(out.constraints.reduce((a, k) => ({ ...a, [k.delete_rule]: (a[k.delete_rule] || 0) + 1 }), {}))}`)
  line(`triggers on the tables of the design: ${out.triggers.map((t) => `${t.tbl}.${t.name}[${t.enabled}]`).join(' ')}`)
  line(`columns captured: ${out.columns.length}`)
})()
