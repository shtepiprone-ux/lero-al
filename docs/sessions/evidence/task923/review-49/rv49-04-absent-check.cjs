/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script run directly by node.exe, not product code */
// Task 923 Review 49 (Opus, 2026-10-24): runs, in a READ ONLY transaction that is rolled back, the one-line check the owner runs after the dry run of deletion v4.
// Before the apply every value must be null or 0: the three functions and the two marker columns that the apply creates do not exist.
// Usage (repository root; pg from NODE_PATH): node docs/sessions/evidence/task923/review-49/rv49-04-absent-check.cjs
const path = require('node:path')
const lib = require(path.resolve('docs/sessions/evidence/task923/db-catalog/lib.cjs'))
const SQL = "select to_regprocedure('public.account_display_name(uuid)') as f1, to_regprocedure('public.set_actor_name()') as f2, to_regprocedure('public.lower_views_count_on_view_delete()') as f3, (select count(*) from information_schema.columns where table_schema = 'public' and ((table_name = 'site_footer' and column_name = 'updated_by_name') or (table_name = 'companies' and column_name = 'created_by'))) as cols;"
;(async () => {
  const c = await lib.connect()
  try {
    await c.query('begin read only')
    const ro = (await c.query('show transaction_read_only')).rows[0].transaction_read_only
    const r = (await c.query(SQL)).rows[0]
    await c.query('rollback')
    console.log(`query: ${SQL}`)
    console.log(`read_only=${ro}; f1 ${r.f1}; f2 ${r.f2}; f3 ${r.f3}; cols ${r.cols}`)
    const ok = r.f1 === null && r.f2 === null && r.f3 === null && Number(r.cols) === 0
    console.log(ok ? 'all absent: the apply has not run' : 'NOT ABSENT')
    process.exitCode = ok ? 0 : 1
  } finally { await c.end() }
})().catch((e) => { console.log(`FAILED ${lib.scrub(e.message)}`); process.exitCode = 1 })
