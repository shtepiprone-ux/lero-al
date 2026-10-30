/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Task 923 R62, R63 (Revision 16): the PostgreSQL grammar check of the FOUR files (hardening v7 + rollback, deletion v3 + rollback); a syntax check only. Based on r14-syntax.cjs / r15-syntax.cjs.
const fs = require('fs')
const D = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task923/db-catalog/'
;(async () => {
  const p = require('plpgsql-parser')
  if (p.loadModule) await p.loadModule()
  let bad = 0
  for (const f of ['proposed-hardening.sql', 'proposed-hardening-rollback.sql', 'proposed-account-deletion.sql', 'proposed-account-deletion-rollback.sql']) {
    const sql = fs.readFileSync(D + f, 'utf8')
    let stmts = 0, fns = 0
    try {
      const r = p.parseSync(sql)
      const tree = r.sql || r
      const list = tree.stmts || (r.sql && r.sql.stmts) || []
      stmts = list.length
      for (const s of list) {
        // DO blocks: the body is PL/pgSQL too, so it is parsed as the body of a function
        const dos = s.stmt && s.stmt.DoStmt
        if (dos) {
          const code = dos.args.find((a) => a.DefElem && a.DefElem.defname === 'as').DefElem.arg.String.sval
          try { p.parsePlpgsqlBody(`CREATE FUNCTION do_block() RETURNS void LANGUAGE plpgsql AS $x$${code}$x$`); fns++ } catch (e) { bad++; console.log('  PL/pgSQL error in a DO block', String(e.message).slice(0, 200)) }
          continue
        }
        const cf = s.stmt && s.stmt.CreateFunctionStmt
        if (!cf) continue
        const lang = (cf.options || []).find((o) => o.DefElem && o.DefElem.defname === 'language')
        const body = (cf.options || []).find((o) => o.DefElem && o.DefElem.defname === 'as')
        if (!(lang && lang.DefElem.arg.String.sval === 'plpgsql' && body)) continue
        const loc = s.stmt_location || 0; const len = s.stmt_len; const buf = Buffer.from(sql); const src = buf.slice(loc, len ? loc + len : undefined).toString()
        const name = cf.funcname.map((n) => n.String.sval).join('.')
        try { if (p.parsePlpgsqlBody) p.parsePlpgsqlBody(src); fns++ } catch (e) { bad++; console.log('  PL/pgSQL error in', name, String(e.message).slice(0, 200)) }
      }
      console.log(`${f}: ${stmts} statements, ${fns} plpgsql bodies parsed OK`)
    } catch (e) { bad++; console.log(f, 'ERROR:', String(e.message).slice(0, 300)) }
  }
  process.exit(bad ? 1 : 0)
})()
