#!/usr/bin/env node
// Rollback proof for a database change (Task 956 AC10; reusable by every database task). Inside ONE transaction it reads
// the catalog, runs the change file, reads the catalog again, runs the rollback file, reads the catalog a third time and
// ends with `rollback`. The first and the last catalog must be equal, and the change file must have changed something
// the catalog queries read (otherwise the proof proves nothing). Nothing it runs is ever committed:
//   - a file statement that opens or ends a transaction (its first tokens read as Postgres reads them: a comment is
//     whitespace) is refused before anything is sent; the file's own outer
//     `begin; ... commit;` wrapper is blanked in place (line numbers kept) so its body runs inside the tool's transaction;
//   - the transaction id is read at the start and before the rollback: a different id means a statement ended the
//     transaction, and the run fails saying so;
//   - `rollback` is sent on every path, also after a failing file.
// The transaction holds the locks its DDL takes until the rollback: lock_timeout, statement_timeout and
// idle_in_transaction_session_timeout bound how long, so run it when the owner allows a check on the live project (D91).
// OWASP: Database Security (a change is applied only with a proven way back), Secure Code Review (tools before people).
//
// Usage: node scripts/quality/db-sql-roundtrip.mjs <change.sql> <rollback.sql>
// Connection: as db-catalog-audit.mjs (DATABASE_URL, verified TLS, LERO_PG_MODULE). Prints each file's sha256 so the
// reviewer can match the proven files with the applied ones. Exit 0 = the rollback restores the catalog; 1 = a file was
// refused or failed, or the catalogs differ; 2 = a file could not be read or the database could not be reached.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';
import { connect, QUERIES, readCatalog, scrub } from './db-catalog-audit.mjs';

/**
 * An ACL as sorted `grantee=privileges` items without the grantor, NULL (the built-in default) replaced by that default:
 * a rollback that re-grants the same rights as another role, or in another order, restores the same access.
 */
const acl = (expr) => `(select string_agg(g, ',' order by g) from (select regexp_replace(x::text, '/[^/]*$', '') as g from unnest(${expr}) x) s)`;

/** The catalog the round trip compares: the audit's queries plus the definitions a rollback must restore exactly. */
export const ROUNDTRIP_QUERIES = {
  ...QUERIES,
  relations: `select c.relname as name, c.relkind::text as kind, c.relrowsecurity as rls, c.relforcerowsecurity as force_rls,
                pg_get_userbyid(c.relowner) as owner, ${acl(`coalesce(c.relacl, acldefault((case when c.relkind = 'S' then 's' else 'r' end)::"char", c.relowner))`)} as acl,
                c.reloptions::text as options, case when c.relkind in ('v', 'm') then pg_get_viewdef(c.oid) end as view_def
              from pg_class c join pg_namespace n on n.oid = c.relnamespace
              where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'S', 'f') order by 1`,
  columnDetails: `select c.relname as table, a.attname as name, format_type(a.atttypid, a.atttypmod) as type, a.attnotnull as not_null,
                    pg_get_expr(d.adbin, d.adrelid) as default_expr, a.attgenerated::text as generated, a.attidentity::text as identity,
                    ${acl('a.attacl')} as acl
                  from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
                  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
                  where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f') and a.attnum > 0 and not a.attisdropped order by 1, 2`,
  constraints: `select c.conrelid::regclass::text as table, c.conname as name, c.contype::text as type, pg_get_constraintdef(c.oid) as def
                from pg_constraint c join pg_namespace n on n.oid = c.connamespace where n.nspname = 'public' order by 1, 2`,
  indexes: `select tablename as table, indexname as name, indexdef as def from pg_indexes where schemaname = 'public' order by 1, 2`,
  triggerDefs: `select n.nspname as schema, c.relname as table, t.tgname as name, pg_get_triggerdef(t.oid) as def, t.tgenabled::text as enabled
                from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
                where n.nspname in ('public', 'storage') and not t.tgisinternal order by 1, 2, 3`,
  functionDefs: `select p.proname as name, pg_get_function_identity_arguments(p.oid) as args, pg_get_functiondef(p.oid) as def,
                   pg_get_userbyid(p.proowner) as owner, ${acl("coalesce(p.proacl, acldefault('f', p.proowner))")} as acl
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind in ('f', 'p') order by 1, 2`,
  enums: `select t.typname as name, array_agg(e.enumlabel::text order by e.enumsortorder) as labels
          from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace
          where n.nspname = 'public' group by 1 order by 1`,
  defaultAcl: `select pg_get_userbyid(d.defaclrole) as role, d.defaclnamespace::regnamespace::text as schema, d.defaclobjtype::text as type,
                 ${acl('d.defaclacl')} as acl from pg_default_acl d order by 1, 2, 3`,
};

const LIMITS = ["set local lock_timeout = '5s'", "set local statement_timeout = '60s'", "set local idle_in_transaction_session_timeout = '60s'"];
const lineAt = (text, pos) => text.slice(0, pos).split('\n').length;

/**
 * Splits SQL at top-level semicolons, skipping comments (nested block comments too), strings (E'' with backslash escapes),
 * quoted identifiers and dollar quotes. Returns `{ start, end, line, text, code }` per statement, `start` at its first
 * token and `end` at its semicolon (or the end of the text); `code` is `text` with each comment replaced by one space, as
 * Postgres reads a comment. Throws on an unterminated string, identifier, dollar quote or comment.
 */
export function splitStatements(sql) {
  const out = [];
  const n = sql.length;
  let i = 0;
  let start = -1;
  let code = '';
  let copied = 0;
  const fail = (what, pos) => { throw new Error(`unterminated ${what} starting at line ${lineAt(sql, pos)}`); };
  /** A comment at [from, to): inside a statement, its `code` gets the text before it and one space in its place. */
  const comment = (from, to) => {
    if (start < 0) return;
    code += `${sql.slice(copied, from)} `;
    copied = to;
  };
  const push = (end) => {
    if (start >= 0) out.push({ start, end, line: lineAt(sql, start), text: sql.slice(start, end), code: code + sql.slice(copied, end) });
    start = -1;
  };
  const skipQuoted = (from, q, backslash) => {
    let j = from + 1;
    while (j < n) {
      if (backslash && sql[j] === '\\') j += 2;
      else if (sql[j] === q && sql[j + 1] === q) j += 2;
      else if (sql[j] === q) return j + 1;
      else j += 1;
    }
    return fail(q === "'" ? 'string' : 'quoted identifier', from);
  };
  const dollar = /\$([A-Za-z_\u0080-\uffff][\w\u0080-\uffff]*)?\$/y;
  while (i < n) {
    const ch = sql[i];
    if (ch === '-' && sql[i + 1] === '-') {
      const from = i;
      const e = sql.indexOf('\n', i);
      i = e < 0 ? n : e + 1;
      comment(from, i);
      continue;
    }
    if (ch === '/' && sql[i + 1] === '*') {
      const from = i;
      let depth = 1;
      i += 2;
      while (i < n && depth) {
        if (sql[i] === '/' && sql[i + 1] === '*') { depth += 1; i += 2; } else if (sql[i] === '*' && sql[i + 1] === '/') { depth -= 1; i += 2; } else i += 1;
      }
      if (depth) fail('comment', from);
      comment(from, i);
      continue;
    }
    if (/\s/.test(ch)) { i += 1; continue; }
    if (ch === ';') { push(i); i += 1; continue; }
    if (start < 0) { start = i; code = ''; copied = i; }
    if (ch === "'") { i = skipQuoted(i, "'", /[eE]/.test(sql[i - 1] ?? '') && !/[\w$]/.test(sql[i - 2] ?? '')); continue; }
    if (ch === '"') { i = skipQuoted(i, '"', false); continue; }
    if (ch === '$' && !/[\w$]/.test(sql[i - 1] ?? '')) {
      dollar.lastIndex = i;
      const m = dollar.exec(sql);
      if (m) {
        const close = sql.indexOf(m[0], i + m[0].length);
        if (close < 0) fail('dollar quote', i);
        i = close + m[0].length;
        continue;
      }
    }
    i += 1;
  }
  push(n);
  return out;
}

/**
 * One token as the Postgres lexer starts it, after its whitespace (space, tab, newline, carriage return, form feed,
 * vertical tab): an identifier or keyword (any character from U+0080 is an identifier character, as every byte of a
 * multibyte UTF-8 character is to Postgres), or else the single character that starts another token.
 */
const TOKEN = /[\t\n\v\f\r ]*([A-Za-z_\u0080-\uffff][\w$\u0080-\uffff]*|[^\t\n\v\f\r ])/y;

/** The first `count` tokens of a statement's `code` (comments already spaces), ASCII letters folded as Postgres folds keywords. */
function firstTokens(code, count) {
  const words = [];
  TOKEN.lastIndex = 0;
  let m;
  while (words.length < count && (m = TOKEN.exec(code))) words.push(m[1].replace(/[A-Z]/g, (ch) => ch.toLowerCase()));
  return words;
}

/**
 * The transaction-control command a statement is, or null, from the first three tokens of its `code` (so `commit`
 * followed by a comment and `;` is `commit`). `rollback to <savepoint>` stays inside the transaction.
 */
function transactionControl(code) {
  const [a, b, c] = firstTokens(code, 3);
  if (a === 'begin' || a === 'abort' || a === 'end') return a;
  if (a === 'start' && b === 'transaction') return 'start transaction';
  if (a === 'prepare' && b === 'transaction') return 'prepare transaction';
  if ((a === 'commit' || a === 'rollback') && b === 'prepared') return `${a} prepared`;
  if (a === 'rollback' && (b === 'to' || ((b === 'work' || b === 'transaction') && c === 'to'))) return null;
  if (a === 'commit' || a === 'rollback') return a;
  return null;
}

/**
 * Checks one SQL file for the round trip and returns `{ label, text, statements }`: the text to send, with the file's own
 * outer `begin` / `commit` blanked in place. Throws (prefixed with `label`) on any other transaction-control statement,
 * an unterminated quote or comment, or a file without a statement.
 */
export function prepareSqlFile(sql, label) {
  const source = sql.replace(/^\uFEFF/, ' ');
  let stmts;
  try {
    stmts = splitStatements(source);
  } catch (e) {
    throw new Error(`${label}: ${e.message}`);
  }
  const kinds = stmts.map((s) => transactionControl(s.code));
  const wrapped = stmts.length > 2 && (kinds[0] === 'begin' || kinds[0] === 'start transaction') && (kinds.at(-1) === 'commit' || kinds.at(-1) === 'end');
  const blank = new Set(wrapped ? [0, stmts.length - 1] : []);
  kinds.forEach((kind, k) => {
    if (kind && !blank.has(k)) throw new Error(`${label}: line ${stmts[k].line}: "${kind}" ends or opens a transaction; the round trip runs the file inside its own transaction, which only its rollback ends`);
  });
  if (stmts.length === blank.size) throw new Error(`${label} has no statement`);
  let text = source;
  for (const k of blank) {
    const { start, end } = stmts[k];
    const stop = text[end] === ';' ? end + 1 : end;
    text = text.slice(0, start) + text.slice(start, stop).replace(/[^\n]/g, ' ') + text.slice(stop);
  }
  return { label, text, statements: stmts.length - blank.size };
}

const clip = (s) => (s.length > 400 ? `${s.slice(0, 400)}…` : s);

/** Rows present in `a` more times than in `b`, as JSON strings (a multiset difference; row order does not matter). */
function onlyIn(a = [], b = []) {
  const counts = new Map();
  for (const r of b) { const k = JSON.stringify(r); counts.set(k, (counts.get(k) ?? 0) + 1); }
  const out = [];
  for (const r of a) {
    const k = JSON.stringify(r);
    if (counts.get(k)) counts.set(k, counts.get(k) - 1);
    else out.push(k);
  }
  return out;
}

const keysOf = (x, y) => [...new Set([...Object.keys(x), ...Object.keys(y)])];

/**
 * Runs the round trip on a connected client. `change` and `rollback` come from prepareSqlFile. Returns
 * `{ ok, problems, changedRows }`; the transaction always ends with `rollback`.
 */
export async function roundtrip({ client, change, rollback, queries = ROUNDTRIP_QUERIES }) {
  const problems = [];
  let changedRows = 0;
  const runFile = async (file) => {
    try {
      await client.query(file.text);
      return true;
    } catch (e) {
      const pos = Number(e?.position);
      problems.push(`${file.label} failed${pos > 0 ? ` at line ${lineAt(file.text, pos - 1)}` : ''}: ${e?.message ?? e}`);
      return false;
    }
  };
  const xid = async () => (await client.query('select txid_current()::text as xid')).rows[0].xid;
  try {
    await client.query('begin');
    for (const sql of LIMITS) await client.query(sql);
    const xidBefore = await xid();
    const before = await readCatalog(client, queries);
    if (await runFile(change)) {
      const middle = await readCatalog(client, queries);
      changedRows = keysOf(before, middle).reduce((sum, k) => sum + onlyIn(before[k], middle[k]).length + onlyIn(middle[k], before[k]).length, 0);
      if (await runFile(rollback)) {
        const after = await readCatalog(client, queries);
        const xidAfter = await xid();
        if (xidAfter !== xidBefore) {
          problems.push(`the transaction changed (txid ${xidBefore}, then ${xidAfter}): a statement ended it, so the files may have been committed`);
        } else {
          if (!changedRows) problems.push(`${change.label} changed nothing the catalog queries read: the round trip proves nothing`);
          for (const k of keysOf(before, after)) {
            const gone = onlyIn(before[k], after[k]);
            const added = onlyIn(after[k], before[k]);
            if (gone.length) problems.push(`${k}: ${gone.length} row(s) only before the change: ${gone.slice(0, 5).map(clip).join('; ')}`);
            if (added.length) problems.push(`${k}: ${added.length} row(s) only after the rollback: ${added.slice(0, 5).map(clip).join('; ')}`);
          }
        }
      }
    }
  } catch (e) {
    problems.push(`the round trip stopped: ${e?.message ?? e}`);
  }
  try {
    await client.query('rollback');
  } catch (e) {
    problems.push(`the rollback could not be sent (${e?.message ?? e}); the server discards an uncommitted transaction when the session ends`);
  }
  return { ok: problems.length === 0, problems, changedRows };
}

async function main(argv) {
  const files = argv.filter((a) => !a.startsWith('--'));
  if (files.length !== 2 || files.length !== argv.length) {
    console.error('db-sql-roundtrip: usage: node scripts/quality/db-sql-roundtrip.mjs <change.sql> <rollback.sql>');
    return 2;
  }
  let raw;
  try {
    raw = files.map((f) => readFileSync(f));
  } catch (e) {
    console.error(`db-sql-roundtrip: ${e.message}`);
    return 2;
  }
  let prepared;
  try {
    prepared = raw.map((buf, k) => ({ ...prepareSqlFile(buf.toString('utf8'), files[k]), sha256: createHash('sha256').update(buf).digest('hex') }));
  } catch (e) {
    console.error(`db-sql-roundtrip: ${e.message}`);
    return 1;
  }
  for (const f of prepared) console.log(`db-sql-roundtrip: ${f.label}: sha256 ${f.sha256}, ${f.statements} statement(s)`);
  let conn;
  try {
    conn = await connect(fileURLToPath(new URL('../../', import.meta.url)));
  } catch (e) {
    console.error(`db-sql-roundtrip: the database could not be reached: ${e.message}`);
    return 2;
  }
  let r;
  try {
    r = await roundtrip({ client: conn.client, change: prepared[0], rollback: prepared[1] });
  } finally {
    await conn.client.end().catch(() => {});
  }
  for (const p of r.problems) console.log(scrub(p, conn.parts));
  const ended = r.problems.some((p) => p.startsWith('the transaction changed'));
  if (r.ok) console.log(`db-sql-roundtrip: the rollback restores the catalog (${r.changedRows} catalog row(s) changed by the change file); the transaction was rolled back`);
  else console.log(`db-sql-roundtrip: ${r.problems.length} problem(s); ${ended ? 'a statement ended the transaction: check the database' : 'the transaction was rolled back'}`);
  return r.ok ? 0 : 1;
}

if (isEntryPoint(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
