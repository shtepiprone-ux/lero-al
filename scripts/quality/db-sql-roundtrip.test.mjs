// db-sql-roundtrip.mjs (Task 956 AC10): a change file and its rollback run inside ONE transaction that always ends with
// `rollback`; the catalog read before the change must equal the catalog read after the rollback. A rollback missing one
// statement fails, a failing file fails, and nothing is ever committed: no `commit` is sent, a file that would end the
// transaction is refused before anything is sent, and a transaction ended behind the tool's back is detected. No
// database is touched: a fake client keeps a small catalog in memory and records every statement it is sent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareSqlFile, roundtrip, splitStatements } from './db-sql-roundtrip.mjs';

const CATALOG_SQL = 'select name from fake_policies order by 1';
const QUERIES = { policies: CATALOG_SQL };

/** A fake database: `create policy x` / `drop policy x` change its catalog; `boom` fails; `sneak` ends the transaction. */
function fakeDb() {
  const policies = new Set(['p0']);
  const sent = [];
  let xid = 100;
  return {
    sent,
    async query(sql) {
      sent.push(sql);
      const s = sql.trim();
      if (s === CATALOG_SQL) return { rows: [...policies].sort().map((name) => ({ name })) };
      if (/^select txid_current\(\)/.test(s)) return { rows: [{ xid: String(xid) }] };
      if (/^(begin|rollback|set local)\b/.test(s)) return { rows: [] };
      if (/^commit\b/.test(s)) { xid += 1; return { rows: [] }; }
      for (const stmt of s.split(';').map((x) => x.trim()).filter(Boolean)) {
        let m;
        if ((m = /^create policy (\w+)$/.exec(stmt))) policies.add(m[1]);
        else if ((m = /^drop policy (\w+)$/.exec(stmt))) policies.delete(m[1]);
        else if (stmt === 'sneak') xid += 1;
        else if (stmt === 'boom') throw Object.assign(new Error('syntax error at or near "boom"'), { position: String(sql.indexOf('boom') + 1) });
        else throw new Error(`fake: unknown statement ${stmt}`);
      }
      return { rows: [] };
    },
  };
}

const run = (change, rollback, db = fakeDb()) => roundtrip({ client: db, change: prepareSqlFile(change, 'change.sql'), rollback: prepareSqlFile(rollback, 'rollback.sql'), queries: QUERIES }).then((r) => ({ ...r, db }));
const neverCommitted = (db) => {
  assert.equal(db.sent[0], 'begin');
  assert.equal(db.sent.at(-1), 'rollback');
  assert.ok(!db.sent.some((s) => /^\s*(commit|end)\b/i.test(s)), 'a commit was sent');
};

test('a change and its complete rollback: the catalogs match, and the transaction ends with rollback', async () => {
  const r = await run('create policy p1;\ncreate policy p2;\ndrop policy p0;\n', 'drop policy p2;\ndrop policy p1;\ncreate policy p0;\n');
  assert.deepEqual(r.problems, []);
  assert.equal(r.ok, true);
  assert.equal(r.changedRows, 3);
  neverCommitted(r.db);
});

test('a rollback missing one statement fails and names the row it left behind', async () => {
  const r = await run('create policy p1;\ncreate policy p2;\n', 'drop policy p1;\n');
  assert.equal(r.ok, false);
  assert.deepEqual(r.problems, ['policies: 1 row(s) only after the rollback: {"name":"p2"}']);
  neverCommitted(r.db);
});

test('a failing change file fails with its line, the rollback file is not run, and the transaction still ends with rollback', async () => {
  const r = await run('create policy p1;\nboom;\n', 'drop policy p1;\n');
  assert.equal(r.ok, false);
  assert.deepEqual(r.problems, ['change.sql failed at line 2: syntax error at or near "boom"']);
  assert.ok(!r.db.sent.some((s) => s.includes('drop policy p1')));
  neverCommitted(r.db);
});

test('a failing rollback file fails', async () => {
  const r = await run('create policy p1;\n', 'boom;\n');
  assert.equal(r.ok, false);
  assert.deepEqual(r.problems, ['rollback.sql failed at line 1: syntax error at or near "boom"']);
  neverCommitted(r.db);
});

test('a change file that changes nothing in the catalog proves nothing and fails', async () => {
  const r = await run('create policy p0;\n', 'create policy p0;\n');
  assert.equal(r.ok, false);
  assert.deepEqual(r.problems, ['change.sql changed nothing the catalog queries read: the round trip proves nothing']);
  neverCommitted(r.db);
});

test('a transaction ended behind the tool (another transaction id before the rollback) fails', async () => {
  const r = await run('create policy p1;\nsneak;\n', 'drop policy p1;\n');
  assert.equal(r.ok, false);
  assert.deepEqual(r.problems, ['the transaction changed (txid 100, then 101): a statement ended it, so the files may have been committed']);
});

test('the file\'s own one-transaction wrapper is blanked in place (lines kept); every other transaction-control statement is refused', () => {
  const p = prepareSqlFile('-- header\nBEGIN;\ncreate policy p1;\nCOMMIT;\n', 'v.sql');
  assert.equal(p.text, '-- header\n      \ncreate policy p1;\n       \n');
  assert.equal(p.text.split('\n').length, 4 + 1);
  for (const [sql, word] of [['create policy p1;\ncommit;\ncreate policy p2;\n', 'commit'], ['create policy p1;\nend;\n', 'end'],
    ['begin;\ncreate policy p1;\nrollback;\n', 'begin'], ['create policy p1;\nrollback;\n', 'rollback'], ['create policy p1;\nprepare transaction \'x\';\n', 'prepare transaction'],
    ['start transaction;\ncreate policy p1;\n', 'start transaction'], ['create policy p1;\nabort;\n', 'abort'], ['commit prepared \'x\';\n', 'commit prepared']]) {
    assert.throws(() => prepareSqlFile(sql, 'v.sql'), new RegExp(`v\\.sql: line \\d+: "${word}" ends or opens a transaction`), sql);
  }
  assert.throws(() => prepareSqlFile('  \n-- nothing\n', 'v.sql'), /v\.sql has no statement/);
  assert.doesNotThrow(() => prepareSqlFile('savepoint a;\ncreate policy p1;\nrollback to savepoint a;\nrelease savepoint a;\n', 'v.sql'));
});

// Review 1 F1: Postgres reads a comment as whitespace, so a comment right after a keyword must not hide the command.
for (const [form, word] of [
  ['commit/**/;', 'commit'], ['commit--x\n;', 'commit'], ['begin/* */;', 'begin'], ['COMMIT/* a /* b */ c */;', 'commit'],
  ['end--\n;', 'end'], ['start/**/transaction;', 'start transaction'], ["prepare/**/transaction 'x';", 'prepare transaction'],
  ["rollback/**/prepared 'x';", 'rollback prepared'],
]) {
  test(`${JSON.stringify(form)} in the middle of a file is refused as "${word}": a comment is whitespace`, () => {
    assert.throws(() => prepareSqlFile(`create policy p1;\n${form}\ncreate policy p2;\n`, 'v.sql'), new RegExp(`v\\.sql: line 2: "${word}" ends or opens a transaction`));
  });
}

test('a token right after a keyword without whitespace is a new token, as Postgres reads it', () => {
  assert.throws(() => prepareSqlFile("create policy p1;\nprepare transaction'x';\n", 'v.sql'), /v\.sql: line 2: "prepare transaction" ends or opens a transaction/);
  assert.doesNotThrow(() => prepareSqlFile('savepoint "s";\ncreate policy p1;\nrollback to"s";\n', 'v.sql'));
});

test('rollback to a savepoint with comments between its keywords stays inside the transaction', () => {
  for (const form of ['rollback/**/to s;', 'rollback work/**/to s;', 'ROLLBACK--x\nTRANSACTION/* y */TO SAVEPOINT s;']) {
    assert.doesNotThrow(() => prepareSqlFile(`savepoint s;\ncreate policy p1;\n${form}\nrelease savepoint s;\n`, 'v.sql'), form);
  }
});

test('the outer wrapper with comments after its keywords is still the wrapper: blanked in place, never sent', async () => {
  const sql = 'begin/* x */;\ncreate policy p1;\ncommit--x\n;\n';
  const p = prepareSqlFile(sql, 'v.sql');
  assert.equal(p.text, `${' '.repeat(13)}\ncreate policy p1;\n${' '.repeat(9)}\n \n`);
  assert.equal(p.statements, 1);
  const r = await run(sql, 'drop policy p1;\n');
  assert.deepEqual(r.problems, []);
  neverCommitted(r.db);
});

test('a statement\'s code is its text with each comment one space; quoted text is kept', () => {
  const [s] = splitStatements("select '--x' /* c /* d */ */ , 1 -- t\n;");
  assert.equal(s.text, "select '--x' /* c /* d */ */ , 1 -- t\n");
  // The space before the block comment, one for the comment, the space after it; one for the line comment.
  assert.equal(s.code, "select '--x'   , 1  ");
});

test('a refused file sends nothing: the transaction is never opened', async () => {
  const db = fakeDb();
  await assert.rejects(async () => run('create policy p1;\ncommit;\n', 'drop policy p1;\n', db), /ends or opens a transaction/);
  assert.deepEqual(db.sent, []);
});

test('statements are split only at top-level semicolons: quotes, dollar quotes and comments are skipped', () => {
  const sql = [
    "create function public.f() returns void language plpgsql set search_path = '' as $f$ begin perform 1; commit; end $f$;",
    "-- commit;\n/* commit; /* nested; */ end; */ select 'commit;', E'it\\'s; end', \"a;b\", $$x;y$$, $1::text;",
    'do $do$ begin raise notice $m$;$m$; end $do$;',
  ].join('\n');
  const stmts = splitStatements(sql).map((s) => s.text.trim().slice(0, 12));
  assert.deepEqual(stmts, ['create funct', 'select \'comm', 'do $do$ begi']);
  assert.doesNotThrow(() => prepareSqlFile(sql, 'v.sql'));
});

test('an unterminated quote, dollar quote or comment is refused; a SQL-standard function body fails closed', () => {
  for (const sql of ["select 'x;\n", 'select $a$ x;\n', 'select 1; /* x;\n', 'select "x;\n']) assert.throws(() => prepareSqlFile(sql, 'v.sql'), /v\.sql: unterminated/, sql);
  assert.throws(() => prepareSqlFile('create function g() returns int language sql begin atomic select 1; end;\n', 'v.sql'), /ends or opens a transaction/);
});

test('the command refuses a file that would commit before it connects anywhere', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'roundtrip-'));
  try {
    writeFileSync(path.join(dir, 'change.sql'), 'select 1;\ncommit;\n');
    writeFileSync(path.join(dir, 'rollback.sql'), 'select 1;\n');
    const script = fileURLToPath(new URL('./db-sql-roundtrip.mjs', import.meta.url));
    // An unreachable address and a missing driver: the command cannot connect even if it tried.
    const env = { ...process.env, DATABASE_URL: 'postgresql://nobody:nothing@127.0.0.1:1/none', LERO_PG_MODULE: path.join(dir, 'no-such-pg-module.js') };
    const r = spawnSync(process.execPath, [script, path.join(dir, 'change.sql'), path.join(dir, 'rollback.sql')], { encoding: 'utf8', env });
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /change\.sql: line 2: "commit" ends or opens a transaction/);
    const usage = spawnSync(process.execPath, [script, path.join(dir, 'change.sql')], { encoding: 'utf8', env });
    assert.equal(usage.status, 2);
    assert.match(usage.stderr, /usage/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
