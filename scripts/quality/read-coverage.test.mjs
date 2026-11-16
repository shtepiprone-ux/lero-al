// Tests of scripts/quality/read-coverage.mjs. The read set is the content that differs from a committed base, not what
// the record says; only the session's own record (and its subagents') is read; a line counts only when the Read tool
// showed it whole as the file has it now; three complete passes; JSON data files are read by the objects of their changed
// keys; generated files are proved by their tools' own runs; every shell command off the read-only allow-list is a run.
// Each proof of Task 956 Review 6 (F14-F18) is a case below.
import { describe, it, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as rc from './read-coverage.mjs';

const ROOT = path.resolve('/repo');
const ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const RECORD = path.resolve('/config/projects/repo', `${ID}.jsonl`);
const at = (s) => `2026-11-16T10:00:${String(s).padStart(2, '0')}.000Z`;
const ms = (s) => Date.parse(at(s));
const own = (s, type, content, extra = {}) => ({ type, sessionId: ID, timestamp: at(s), ...extra, message: { content } });
const readEntries = (s, file, lines, extra) => [
  own(s, 'assistant', [{ type: 'tool_use', id: `r${s}${file}`, name: 'Read', input: { file_path: path.join(ROOT, file) } }], extra),
  own(s, 'user', [{ type: 'tool_result', tool_use_id: `r${s}${file}`, content: lines.map((t, i) => `${i + 1}\t${t}`).join('\n') }], extra),
];
const shellEntries = (s, command, { tool = 'Bash', error = false, ...extra } = {}) => [
  own(s, 'assistant', [{ type: 'tool_use', id: `b${s}`, name: tool, input: { command } }], extra),
  own(s, 'user', [{ type: 'tool_result', tool_use_id: `b${s}`, is_error: error, content: error ? 'Exit code 1' : 'ok' }], extra),
];
const jsonl = (entries) => entries.map((e) => JSON.stringify(e)).join('\n');
const parse = (entries, opts = {}) => rc.parseRecord(jsonl(entries), { id: ID, root: ROOT, ...opts });

// The nine spellings of a test or gate run that the old pattern let through (Review 6, F15).
const NINE = ['npx eslint scripts/quality/read-coverage.mjs', 'npx tsc --noEmit', 'npm t', 'npm run-script test',
  'node --experimental-vm-modules --test x.test.mjs', 'node node_modules/vitest/vitest.mjs --run',
  'node scripts/quality/check-files.mjs --worktree', 'npm run check:story-coverage', 'node scripts/quality/owasp.mjs gate --base main'];

test('numberedLines keeps the numbered lines of a Read result and ignores text after them', () => {
  const m = rc.numberedLines('1\tconst a = 1\n2\t\tindented\n\n<system-reminder>\n3 not a line');
  assert.deepEqual([...m], [[1, 'const a = 1'], [2, '\tindented']]);
  assert.deepEqual([...rc.numberedLines([{ type: 'text', text: '7\tx' }])], [[7, 'x']]);
});

describe('parseRecord: only the entries of the record\'s own session count (F14)', () => {
  it('reads, writes and shell commands of the session, with the read-only flag and the error of each result', () => {
    const { entries, events } = parse([
      ...readEntries(1, 'src/a.ts', ['a', 'b']),
      own(2, 'assistant', [{ type: 'tool_use', id: 'e1', name: 'Edit', input: { file_path: path.join(ROOT, 'src/a.ts') } }]),
      ...shellEntries(3, 'npm test -- --coverage', { error: true }),
      ...shellEntries(4, 'git status --short', { tool: 'PowerShell' }),
    ]);
    assert.equal(entries, 7);
    assert.deepEqual(events.map((e) => [e.kind, e.file ?? e.command]), [
      ['read', 'src/a.ts'], ['write', 'src/a.ts'], ['shell', 'npm test -- --coverage'], ['shell', 'git status --short'],
    ]);
    assert.deepEqual([...events[0].lines.values()], ['a', 'b']);
    assert.deepEqual(events.slice(2).map((e) => [e.readOnly, e.error]), [[false, true], [true, false]]);
  });

  it('a forged line (no session id, another session, no timestamp, not a user or assistant entry) counts for nothing', () => {
    const forged = readEntries(1, 'src/a.ts', ['a']);
    const { entries, events } = parse([
      ...forged.map(({ sessionId: _drop, ...e }) => e),
      ...forged.map((e) => ({ ...e, sessionId: 'other-session' })),
      ...forged.map(({ timestamp: _drop, ...e }) => e),
      ...forged.map((e) => ({ ...e, type: 'api-request-blob' })),
    ]);
    assert.equal(entries, 0);
    assert.deepEqual(events, []);
  });

  it('a subagent\'s reads are not the author\'s; its shell commands and writes are kept', () => {
    const sub = [...readEntries(1, 'src/a.ts', ['a']), ...shellEntries(2, 'npm test'), own(3, 'assistant', [{ type: 'tool_use', id: 'w', name: 'Write', input: { file_path: path.join(ROOT, 'src/a.ts') } }])];
    const fromFile = parse(sub, { subagent: true }).events;
    assert.deepEqual(fromFile.map((e) => [e.kind, e.subagent]), [['shell', true], ['write', true]]);
    const inline = parse(sub.map((e) => ({ ...e, isSidechain: true }))).events;
    assert.deepEqual(inline.map((e) => e.kind), ['shell', 'write']);
  });
});

test('splitSegments splits on unquoted ; | & and newlines only', () => {
  assert.deepEqual(rc.splitSegments('cd /x && git status; grep -n "a|b;c" f | head -3'), ['cd /x', 'git status', 'grep -n "a|b;c" f', 'head -3']);
  assert.deepEqual(rc.splitSegments("echo 'x && y'\nls"), ["echo 'x && y'", 'ls']);
});

test('isReadOnly: the allow-list; anything else is a run or a change (F15)', () => {
  for (const c of ['git status --short', 'git diff --stat main', 'git log --oneline -3', 'cd /c/x && git show HEAD:a.ts | wc -l',
    'grep -rn "x|y" src', 'cat a.md | head -5', 'ls -la docs', 'wc -l a b', 'node scripts/quality/read-coverage.mjs --review abc1234',
    'git merge-base --is-ancestor abc HEAD', 'Get-Content a.md -TotalCount 5', 'gh pr checks 36', 'echo done 2>&1', 'find src -name "*.ts"',
    'git status --short; "EXIT=$LASTEXITCODE"', 'grep -c x a 2>/dev/null', 'git diff --stat >/dev/null']) assert.ok(rc.isReadOnly(c), c);
  for (const c of [...NINE, 'npm test', 'npx vitest run', 'node --test "scripts/quality/*.test.mjs"', 'echo x > a.ts', 'echo x>a.ts', 'cat a >> b',
    'echo x >/dev/nullfile', 'rg --pre cat x', 'git grep -Ocalc x', 'git log -o x',
    'sed -i s/a/b/ f', 'sed -n p f', 'find . -delete', 'find . -exec rm {} ;', 'git commit -m x', 'git checkout -- a', 'git diff --output=x',
    'sort -o a b', 'echo $(rm a)', 'echo `rm a`', 'ls | xargs rm', 'cat a | tee b', 'x=1 ls', 'node -e "1"', 'Set-Content a b', 'gh api -X POST x', '']) {
    assert.ok(!rc.isReadOnly(c), c);
  }
});

test('passesOf: three full passes over the current text; a read of an older text counts for nothing', () => {
  const now = ['a', 'b', 'c'];
  const all = new Set([1, 2, 3]);
  const r = (s, lines) => ({ ts: ms(s), lines: new Map(lines.map((t, i) => [i + 1, t])) });
  assert.deepEqual(rc.passesOf([r(1, now), r(2, now), r(3, now)], now, all), { passes: [ms(1), ms(2), ms(3)], partial: 0 });
  assert.equal(rc.passesOf([r(1, ['a', 'OLD', 'c']), r(2, now)], now, all).passes.length, 1);
  const part = (s, from, lines) => ({ ts: ms(s), lines: new Map(lines.map((t, i) => [from + i, t])) });
  assert.deepEqual(rc.passesOf([part(1, 1, ['a']), part(2, 1, ['a']), part(3, 2, ['b', 'c'])], now, all), { passes: [ms(3)], partial: 0 });
  assert.deepEqual(rc.passesOf([part(1, 1, ['a', 'b'])], now, all), { passes: [], partial: 2 });
  assert.equal(rc.passesOf([part(1, 2, ['b'])], now, new Set([2])).passes.length, 1);
  assert.equal(rc.passesOf([r(1, ['a', 'b', 'c\r'])], now, all).passes.length, 1, 'a carriage return is not text');
});

test('objectRanges and objectRequiredLines: the whole object that holds a changed key', () => {
  const text = ['{', '  "a": {', '    "x": "1",', '    "y": "it\\"s {"', '  },', '  "b": {', '    "list": ["p", {"q": 1}],', '    "z": "2"', '  }', '}'].join('\n');
  const r = rc.objectRanges(text);
  assert.deepEqual(r.get(''), [1, 10]);
  assert.deepEqual(r.get('a'), [2, 5]);
  assert.deepEqual(r.get('b'), [6, 9]);
  assert.deepEqual(r.get('b.list.1'), [7, 7]);
  assert.deepEqual([...rc.objectRequiredLines(text, ['a.y'])], [2, 3, 4, 5]);
  assert.deepEqual([...rc.objectRequiredLines(text, ['gone.deep.k'])], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('changedLeaves: added, changed and removed keys, not the unchanged ones', () => {
  const before = { a: { x: '1', y: '2' }, b: { z: '3' }, gone: '4' };
  const after = { a: { x: '1', y: 'two' }, b: { z: '3', w: '5' } };
  assert.deepEqual(rc.changedLeaves(before, after).sort(), ['a.y', 'b.w', 'gone']);
  assert.deepEqual(rc.changedLeaves(before, before), []);
});

test('the JSON data files read by changed objects and the generated files', () => {
  for (const f of ['messages/en.json', 'docs/security/owasp/controls.json', 'docs/security/owasp/reviews/Task_956.json']) assert.ok(rc.JSON_DATA.test(f), f);
  for (const f of ['package.json', 'docs/security/owasp/sheets.json', 'scripts/x.json']) assert.ok(!rc.JSON_DATA.test(f), f);
  assert.deepEqual([...rc.GENERATED.keys()].sort(), ['docs/security/owasp/sheets.json', 'package-lock.json']);
});

test('runsBeforePasses: a run after the last change and before the passes is a breach', () => {
  const runs = [{ ts: ms(1), command: 'npm test red' }, { ts: ms(5), command: 'npm test early' }, { ts: ms(9), command: 'npm test green' }];
  assert.deepEqual(rc.runsBeforePasses(runs, ms(3), ms(8)).map((r) => r.command), ['npm test early']);
  assert.deepEqual(rc.runsBeforePasses(runs, ms(3), null).map((r) => r.command), ['npm test early', 'npm test green']);
});

test('repoPath: inside the root as a forward-slash path; outside it null', () => {
  assert.equal(rc.repoPath(path.join(ROOT, 'src', 'a.ts'), ROOT), 'src/a.ts');
  assert.equal(rc.repoPath(path.resolve('/other/a.ts'), ROOT), null);
  assert.equal(rc.repoPath(undefined, ROOT), null);
});

describe('evaluate: the read set by content, the passes after the last change, the order, generated files, the record', () => {
  const files = { 'src/a.ts': 'a1\na2\n', 'src/b.ts': 'b1\n' };
  const rd = (s, file, lines) => readEntries(s, file, lines);
  const three = (s) => [rd(s, 'src/a.ts', ['a1', 'a2']), rd(s, 'src/b.ts', ['b1']), rd(s + 1, 'src/a.ts', ['a1', 'a2']), rd(s + 1, 'src/b.ts', ['b1']), rd(s + 2, 'src/a.ts', ['a1', 'a2']), rd(s + 2, 'src/b.ts', ['b1'])].flat();
  const edit = (s, file) => own(s, 'assistant', [{ type: 'tool_use', id: `e${s}`, name: 'Edit', input: { file_path: path.join(ROOT, file) } }]);
  const check = (entries, { fs = files, base = {}, sub = [] } = {}) => rc.evaluate({
    events: [...parse(entries).events, ...parse(sub, { subagent: true }).events].sort((x, y) => x.ts - y.ts),
    changed: Object.keys(fs), read: (f) => fs[f], baseText: (f) => base[f] ?? null, record: { id: ID, path: RECORD },
  });

  it('three passes over every file after the last change, the green run after them: no problem', () => {
    const r = check([...shellEntries(2, 'npm test red'), edit(4, 'src/a.ts'), ...three(20), ...shellEntries(30, 'npm test')]);
    assert.deepEqual(r.problems, []);
    assert.deepEqual(r.rows.map((x) => x.file), ['src/a.ts', 'src/b.ts']);
    assert.equal(r.requiredTotal, 3);
  });

  it('F16: a file that differs from the base is in the read set though no tool wrote it (a shell write, a set-back mtime)', () => {
    const r = check([edit(4, 'src/a.ts'), ...three(20).filter((e) => !JSON.stringify(e).includes('src/b.ts'))]);
    assert.ok(r.rows.some((x) => x.file === 'src/b.ts'));
    assert.ok(r.problems.some((p) => p.startsWith('src/b.ts: 0 complete pass(es) of 3')), r.problems.join('\n'));
  });

  it('passes made before the last change of ANY file do not count', () => {
    const r = check([...rd(6, 'src/a.ts', ['a1', 'a2']), ...rd(7, 'src/a.ts', ['a1', 'a2']), ...rd(8, 'src/a.ts', ['a1', 'a2']), edit(12, 'src/b.ts'), ...three(20).filter((e) => JSON.stringify(e).includes('src/b.ts'))]);
    assert.ok(r.problems.some((p) => p.startsWith('src/a.ts: 0 complete pass(es) of 3')), r.problems.join('\n'));
  });

  it('a line never read leaves the pass open and names how many lines are missing', () => {
    const r = check([...rd(20, 'src/a.ts', ['a1']), ...rd(20, 'src/b.ts', ['b1'])]);
    assert.ok(r.problems.some((p) => p.includes('src/a.ts: 0 complete pass(es)') && p.includes('1 line(s) not read')));
  });

  it('F14: a 1000-character prefix of a longer line is not a read of it, and the cut line is a problem with its file and line', () => {
    const long = 'x'.repeat(2500);
    const fs = { 'docs/l.md': `${long}\n` };
    const cut = (s) => rd(s, 'docs/l.md', [`${long.slice(0, 1000)} ... [truncated]`]);
    const r = check([...cut(20), ...cut(21), ...cut(22)], { fs });
    assert.ok(r.problems.some((p) => p.startsWith('docs/l.md: 0 complete pass(es)')), r.problems.join('\n'));
    assert.ok(r.problems.some((p) => p.startsWith('docs/l.md:1: a Read showed') && p.includes('1000 of 2500')), r.problems.join('\n'));
  });

  for (const command of NINE) {
    it(`F15: \`${command}\` between the last change and the third pass is a breach`, () => {
      const r = check([edit(4, 'src/a.ts'), ...three(20).slice(0, 8), ...shellEntries(21, command), ...three(20).slice(8)]);
      assert.equal(r.problems.filter((p) => p.includes('ran after the last change')).length, 1, r.problems.join('\n'));
    });
  }

  it('F15: a read-only command between the change and the third pass is not a run', () => {
    const r = check([edit(4, 'src/a.ts'), ...three(20).slice(0, 8), ...shellEntries(21, 'git diff --stat'), ...three(20).slice(8)]);
    assert.deepEqual(r.problems, []);
  });

  it('a session with no change counts its runs from its first command: a run before the third pass is a breach', () => {
    const r = check([...shellEntries(2, 'git diff --name-only | xargs wc -l'), ...three(20), ...shellEntries(30, 'npm test')]);
    const breaches = r.problems.filter((p) => p.includes('ran after the last change'));
    assert.equal(breaches.length, 1, r.problems.join('\n'));
    assert.match(breaches[0], /no change in this session: from its first command/);
    assert.match(breaches[0], /xargs wc -l/);
  });

  it('F15: a subagent\'s command before the third pass is a breach (its record is <session>/subagents/agent-*.jsonl)', () => {
    const r = check([edit(4, 'src/a.ts'), ...three(20)], { sub: shellEntries(21, 'npm test') });
    assert.equal(r.problems.filter((p) => p.includes('ran after the last change') && p.includes('subagent')).length, 1, r.problems.join('\n'));
  });

  it('F17: package-lock.json is proved only by the tools\' own runs whose result is not an error', () => {
    const fs = { ...files, 'package-lock.json': '{}\n' };
    const base = [edit(4, 'src/a.ts'), ...three(20)];
    const missing = (entries) => check([...base, ...entries], { fs }).problems.filter((p) => p.startsWith('package-lock.json: no run'));
    assert.equal(missing([]).length, 3);
    assert.equal(missing(shellEntries(30, 'echo change-report.mjs --lockfile-age install-scripts.test.mjs npm audit')).length, 3, 'an echo is not a run');
    const proofs = ['node scripts/quality/change-report.mjs --lockfile-age main', 'node --test scripts/quality/install-scripts.test.mjs', 'npm audit --omit=dev --audit-level=high'];
    assert.equal(missing(proofs.flatMap((c, i) => shellEntries(31 + i, `cd /repo && ${c}`))).length, 0);
    assert.equal(missing(proofs.flatMap((c, i) => shellEntries(31 + i, `${c} 2>&1`))).length, 0, 'merging the error output keeps the exit status');
    assert.equal(missing(proofs.flatMap((c, i) => shellEntries(31 + i, c, { error: true }))).length, 3, 'a failed run proves nothing');
    assert.equal(missing(proofs.flatMap((c, i) => shellEntries(31 + i, `${c}; echo "EXIT=$?"`))).length, 3, 'the result would be the echo\'s');
    assert.equal(check(base, { fs, sub: proofs.flatMap((c, i) => shellEntries(31 + i, c)) }).problems.filter((p) => p.startsWith('package-lock.json: no run')).length, 3, 'a subagent run is not the author\'s');
  });

  it('F18: sheets.json is generated (owasp.mjs check); controls.json is read by its changed objects; a review set with both stays within the limit', () => {
    const sheets = `{\n${Array.from({ length: 965 }, (_, i) => `  "s${i}": "${i}",`).join('\n')}\n  "z": "z"\n}\n`;
    const controls = `{\n${Array.from({ length: 2285 }, (_, i) => `  "c${i}": {"q": "${i}"},`).join('\n')}\n  "last": {"q": "new"}\n}\n`;
    const fs = { 'docs/security/owasp/sheets.json': sheets, 'docs/security/owasp/controls.json': controls };
    const base = { 'docs/security/owasp/controls.json': controls.replace('"last": {"q": "new"}', '"last": {"q": "old"}') };
    const r = check([...shellEntries(30, 'node scripts/quality/owasp.mjs check')], { fs, base });
    assert.equal(r.requiredTotal, 1, 'the one changed object');
    assert.ok(!r.problems.some((p) => p.includes('over 3000')), r.problems.join('\n'));
    assert.ok(!r.problems.some((p) => p.startsWith('docs/security/owasp/sheets.json')), r.problems.join('\n'));
    assert.ok(check([], { fs, base }).problems.some((p) => p.startsWith('docs/security/owasp/sheets.json: no run of `owasp.mjs check`')));
  });

  it('a read set over 3 000 lines is refused', () => {
    assert.ok(check([], { fs: { 'src/big.ts': 'x\n'.repeat(3001) } }).problems.some((p) => p.includes('3001 lines, over 3000')));
  });

  it('F14: a session that writes its own record (Edit/Write or a shell command naming it) has a problem', () => {
    const w = own(30, 'assistant', [{ type: 'tool_use', id: 'w1', name: 'Write', input: { file_path: RECORD } }]);
    const sub = own(31, 'assistant', [{ type: 'tool_use', id: 'w2', name: 'Edit', input: { file_path: path.join(path.dirname(RECORD), ID, 'subagents', 'agent-x.jsonl') } }]);
    const base = [edit(4, 'src/a.ts'), ...three(20)];
    assert.equal(check([...base, w, sub]).problems.filter((p) => p.includes('session record')).length, 2);
    for (const command of [`echo x >> ~/.claude/projects/repo/${ID}.jsonl`, 'node -e "x" "$CLAUDE_CODE_SESSION_ID"', 'node x.mjs ~/.claude/projects/repo/']) {
      assert.equal(check([...base, ...shellEntries(30, command)]).problems.filter((p) => p.includes('session record')).length, 1, command);
    }
    assert.deepEqual(check([...base, ...shellEntries(30, 'node scripts/quality/read-coverage.mjs --transcript C:/Users/x/.claude/projects/repo/other.jsonl')]).problems, []);
  });
});

test('checkBase: --review names a commit that is an ancestor of HEAD', () => {
  const git = (answers) => (args) => answers[args.join(' ')] ?? { status: 1 };
  assert.equal(rc.checkBase('abc1234', git({ 'cat-file -e abc1234^{commit}': { status: 0 }, 'merge-base --is-ancestor abc1234 HEAD': { status: 0 } })), null);
  assert.match(rc.checkBase('abc1234', git({ 'cat-file -e abc1234^{commit}': { status: 0 } })), /not an ancestor of HEAD/);
  assert.match(rc.checkBase('abc1234', git({})), /not a commit/);
  assert.match(rc.checkBase('HEAD~1;rm', git({})), /not a commit/);
});

describe('the command line', () => {
  const script = fileURLToPath(new URL('./read-coverage.mjs', import.meta.url));
  const env = { ...process.env };
  delete env.CLAUDE_CODE_SESSION_ID;
  const cli = (args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', env });

  it('no option lowers what the tool asks; --files-since is gone (F16)', () => {
    for (const args of [['--passes', '1'], ['--max-lines', '99999'], ['--base', 'HEAD~5'], ['--since', '2099-01-01T00:00:00Z'], ['--files-since', '2026-11-16T05:50:00Z']]) {
      const r = cli(args);
      assert.equal(r.status, 2, args.join(' '));
      assert.match(r.stderr, /unknown option/);
    }
    assert.match(cli(['--review']).stderr, /needs a value/);
  });

  it('--review that is not a commit is refused', () => {
    const r = cli(['--review', 'not-a-commit-zzz']);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /not a commit/);
  });

  it('F14: no record, an empty record and a forged record (no entry of its session) exit 2', () => {
    assert.equal(cli([]).status, 2, 'no CLAUDE_CODE_SESSION_ID, no --transcript');
    const dir = mkdtempSync(path.join(os.tmpdir(), 'rc-'));
    try {
      const empty = path.join(dir, `${ID}.jsonl`);
      writeFileSync(empty, '');
      const r1 = cli(['--transcript', empty]);
      assert.equal(r1.status, 2);
      assert.match(r1.stderr, /no entry of session/);
      const forged = path.join(dir, 'forged.jsonl');
      writeFileSync(forged, jsonl(readEntries(1, 'src/a.ts', ['a'])));
      const r2 = cli(['--transcript', forged]);
      assert.equal(r2.status, 2, 'its lines name session aaaaaaaa-…, not "forged"');
      assert.match(r2.stderr, /no entry of session forged/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});

test('findTranscript: no session id, no transcript', () => {
  assert.equal(rc.findTranscript({}), null);
  assert.equal(rc.findTranscript({ CLAUDE_CODE_SESSION_ID: 'x', CLAUDE_CONFIG_DIR: path.resolve('/nonexistent-config') }), null);
});
