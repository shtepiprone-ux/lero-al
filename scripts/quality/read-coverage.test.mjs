// Tests of scripts/quality/read-coverage.mjs: a line counts only when the Read tool showed it as the file has it now;
// three complete passes; the locale files are read by the objects of their changed keys; no green run before the passes.
import { describe, it, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  numberedLines, parseTranscript, sameLine, objectRanges, changedLeaves, localeRequiredLines, passesOf, runsBeforePasses,
  repoPath, GREEN_RUN, findTranscript, evaluate,
} from './read-coverage.mjs';

const ROOT = path.resolve('/repo');
const at = (s) => `2026-11-16T10:00:${String(s).padStart(2, '0')}.000Z`;
const ms = (s) => Date.parse(at(s));
const read = (s, file, lines) => [
  { timestamp: at(s), message: { content: [{ type: 'tool_use', id: `r${s}`, name: 'Read', input: { file_path: path.join(ROOT, file) } }] } },
  { timestamp: at(s), message: { content: [{ type: 'tool_result', tool_use_id: `r${s}`, content: lines.map((t, i) => `${i + 1}\t${t}`).join('\n') }] } },
];
const jsonl = (entries) => entries.map((e) => JSON.stringify(e)).join('\n');

test('numberedLines keeps the numbered lines of a Read result and ignores text after them', () => {
  const m = numberedLines('1\tconst a = 1\n2\t\tindented\n\n<system-reminder>\n3 not a line');
  assert.deepEqual([...m], [[1, 'const a = 1'], [2, '\tindented']]);
  assert.deepEqual([...numberedLines([{ type: 'text', text: '7\tx' }])], [[7, 'x']]);
});

test('parseTranscript: reads with their lines, writes, test runs, other shell commands; a subagent entry is skipped', () => {
  const entries = [
    ...read(1, 'src/a.ts', ['a', 'b']),
    { timestamp: at(2), message: { content: [{ type: 'tool_use', id: 'e1', name: 'Edit', input: { file_path: path.join(ROOT, 'src/a.ts') } }] } },
    { timestamp: at(3), message: { content: [{ type: 'tool_use', id: 'b1', name: 'Bash', input: { command: 'npm test -- --coverage' } }] } },
    { timestamp: at(4), message: { content: [{ type: 'tool_use', id: 'b2', name: 'PowerShell', input: { command: 'npm audit --json' } }] } },
    ...read(5, 'src/a.ts', ['a', 'b']).map((e) => ({ ...e, isSidechain: true })),
    { timestamp: at(6), message: { content: [{ type: 'tool_use', id: 'r9', name: 'Read', input: { file_path: path.join(ROOT, 'src/b.ts') } }] } },
    { timestamp: at(6), message: { content: [{ type: 'tool_result', tool_use_id: 'r9', is_error: true, content: '1\tx' }] } },
    { timestamp: at(7), message: { content: [{ type: 'tool_use', id: 'r10', name: 'Read', input: { file_path: '/elsewhere/x.ts' } }] } },
    { timestamp: at(7), message: { content: [{ type: 'tool_result', tool_use_id: 'r10', content: '1\tx' }] } },
  ];
  const { start, events } = parseTranscript(jsonl(entries) + '\nnot json\n', ROOT);
  assert.equal(start, ms(1));
  assert.deepEqual(events.map((e) => [e.kind, e.file ?? e.command]), [
    ['read', 'src/a.ts'], ['write', 'src/a.ts'], ['run', 'npm test -- --coverage'], ['shell', 'npm audit --json'],
  ]);
  assert.deepEqual([...events[0].lines.values()], ['a', 'b']);
});

test('GREEN_RUN names the test and gate commands, not a read-only command', () => {
  for (const c of ['npm test', 'npm run test:unit', 'npx vitest run x', 'node --test "scripts/quality/*.test.mjs"', 'npm run lint', 'npm run -s lint', 'npm run --silent typecheck', 'npm run typecheck', 'node scripts/quality/changed-lines-coverage.mjs --base main']) assert.ok(GREEN_RUN.test(c), c);
  for (const c of ['git status --short', 'node scripts/quality/read-coverage.mjs', 'grep -n test src']) assert.ok(!GREEN_RUN.test(c), c);
});

test('sameLine: equal text, CR ignored; a long line the tool cut counts by its start; a different line does not', () => {
  assert.ok(sameLine('x = 1', 'x = 1\r'));
  assert.ok(!sameLine('x = 1', 'x = 2'));
  const long = 'a'.repeat(2500);
  assert.ok(sameLine('a'.repeat(2000), long));
  assert.ok(!sameLine('a'.repeat(10), long));
});

test('passesOf: three full passes over the current text; a read of an older text counts for nothing', () => {
  const now = ['a', 'b', 'c'];
  const all = new Set([1, 2, 3]);
  const r = (s, lines) => ({ ts: ms(s), lines: new Map(lines.map((t, i) => [i + 1, t])) });
  assert.deepEqual(passesOf([r(1, now), r(2, now), r(3, now)], now, all), { passes: [ms(1), ms(2), ms(3)], partial: 0 });
  // the first read was of the file before a change: line 2 differs, so that read cannot complete a pass
  assert.equal(passesOf([r(1, ['a', 'OLD', 'c']), r(2, now)], now, all).passes.length, 1);
  // a pass may be made of parts; a part read twice does not finish it
  const part = (s, from, lines) => ({ ts: ms(s), lines: new Map(lines.map((t, i) => [from + i, t])) });
  assert.deepEqual(passesOf([part(1, 1, ['a']), part(2, 1, ['a']), part(3, 2, ['b', 'c'])], now, all), { passes: [ms(3)], partial: 0 });
  assert.deepEqual(passesOf([part(1, 1, ['a', 'b'])], now, all), { passes: [], partial: 2 });
  // only the required lines are needed
  assert.equal(passesOf([part(1, 2, ['b'])], now, new Set([2])).passes.length, 1);
});

test('objectRanges and localeRequiredLines: the whole object that holds a changed key', () => {
  const text = ['{', '  "a": {', '    "x": "1",', '    "y": "it\\"s {"', '  },', '  "b": {', '    "list": ["p", {"q": 1}],', '    "z": "2"', '  }', '}'].join('\n');
  const r = objectRanges(text);
  assert.deepEqual(r.get(''), [1, 10]);
  assert.deepEqual(r.get('a'), [2, 5]);
  assert.deepEqual(r.get('b'), [6, 9]);
  assert.deepEqual(r.get('b.list.1'), [7, 7]);
  assert.deepEqual([...localeRequiredLines(text, ['a.y'])], [2, 3, 4, 5]);
  // a key whose object is gone falls back to the nearest object that exists
  assert.deepEqual([...localeRequiredLines(text, ['gone.deep.k'])], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
});

test('changedLeaves: added, changed and removed keys, not the unchanged ones', () => {
  const before = { a: { x: '1', y: '2' }, b: { z: '3' }, gone: '4' };
  const after = { a: { x: '1', y: 'two' }, b: { z: '3', w: '5' } };
  assert.deepEqual(changedLeaves(before, after).sort(), ['a.y', 'b.w', 'gone']);
  assert.deepEqual(changedLeaves(before, before), []);
});

test('runsBeforePasses: a run after the last change and before the passes is a breach; one before the change is a failing run of a new test', () => {
  const runs = [{ ts: ms(1), command: 'npm test red' }, { ts: ms(5), command: 'npm test early' }, { ts: ms(9), command: 'npm test green' }];
  assert.deepEqual(runsBeforePasses(runs, ms(3), ms(8)).map((r) => r.command), ['npm test early']);
  // the passes were never completed: every run after the change is a breach
  assert.deepEqual(runsBeforePasses(runs, ms(3), null).map((r) => r.command), ['npm test early', 'npm test green']);
  // nothing to read: no order to hold
  assert.deepEqual(runsBeforePasses(runs, ms(3), -Infinity), []);
});

test('repoPath: inside the root as a forward-slash path; outside it null', () => {
  assert.equal(repoPath(path.join(ROOT, 'src', 'a.ts'), ROOT), 'src/a.ts');
  assert.equal(repoPath(path.resolve('/other/a.ts'), ROOT), null);
  assert.equal(repoPath(undefined, ROOT), null);
});

describe('evaluate: the read set, the passes after the last change, the order and the generated files', () => {
  const files = {
    'src/a.ts': { text: 'a1\na2\n', mtime: ms(10) },
    'src/b.ts': { text: 'b1\n', mtime: ms(12) },
    'src/old.ts': { text: 'o1\n', mtime: ms(0) },
  };
  const io = (fs) => ({ stat: (f) => (fs[f] ? { mtime: fs[f].mtime } : null), read: (f) => fs[f].text, headText: (f) => fs[f]?.head ?? null });
  const rd = (s, file, lines) => ({ kind: 'read', file, ts: ms(s), lines: new Map(lines.map((t, i) => [i + 1, t])) });
  const run = (s, command) => ({ kind: 'run', command, ts: ms(s) });
  const three = (s) => [rd(s, 'src/a.ts', ['a1', 'a2']), rd(s, 'src/b.ts', ['b1']), rd(s + 1, 'src/a.ts', ['a1', 'a2']), rd(s + 1, 'src/b.ts', ['b1']), rd(s + 2, 'src/a.ts', ['a1', 'a2']), rd(s + 2, 'src/b.ts', ['b1'])];
  const check = (events, extra = {}) => evaluate({ events, start: ms(5), changed: Object.keys(extra.files ?? files), filesSince: null, ...io(extra.files ?? files), ...extra });

  it('three passes over every file after the last change, the green run after them: no problem', () => {
    const r = check([run(6, 'npm test red'), ...three(20), run(30, 'npm test')]);
    assert.deepEqual(r.problems, []);
    assert.deepEqual(r.rows.map((x) => x.file), ['src/a.ts', 'src/b.ts'], 'src/old.ts was not written in this session');
    assert.equal(r.requiredTotal, 3);
  });

  it('passes made before the last change of ANY file do not count', () => {
    // b.ts changed at 12: the passes over a.ts at 6-8 were before it
    const early = [rd(6, 'src/a.ts', ['a1', 'a2']), rd(7, 'src/a.ts', ['a1', 'a2']), rd(8, 'src/a.ts', ['a1', 'a2']), ...three(20).filter((e) => e.file === 'src/b.ts')];
    const r = check(early);
    assert.ok(r.problems.some((p) => p.startsWith('src/a.ts: 0 complete pass(es) of 3')), r.problems.join('\n'));
  });

  it('a line never read leaves the pass open and names how many lines are missing', () => {
    const r = check([rd(20, 'src/a.ts', ['a1']), rd(20, 'src/b.ts', ['b1'])]);
    assert.ok(r.problems.some((p) => p.includes('src/a.ts: 0 complete pass(es)') && p.includes('1 line(s) not read')));
  });

  it('a test or gate between the last change and the third pass is a breach; a failing run before the change is not', () => {
    // the second pass ends at 21, the third at 22: a run at 21 comes before the third pass
    const r = check([run(6, 'npm test red'), ...three(20).slice(0, 4), run(21, 'npm test -- x'), ...three(20).slice(4)]);
    assert.equal(r.problems.filter((p) => p.includes('ran after the last change')).length, 1);
    assert.ok(r.problems[0].includes('npm test -- x'));
  });

  it('the reviewer: --files-since adds the implementer\'s files, which must be read like any other', () => {
    const r = check([], { start: ms(100), filesSince: ms(1) });
    assert.deepEqual(r.rows.map((x) => x.file), ['src/a.ts', 'src/b.ts']);
    assert.equal(r.problems.filter((p) => p.includes('0 complete pass(es)')).length, 2);
  });

  it('package-lock.json is not read: the three commands that check it must have run', () => {
    const withLock = { ...files, 'package-lock.json': { text: '{}', mtime: ms(11) } };
    const missing = check([...three(20)], { files: withLock });
    assert.equal(missing.problems.filter((p) => p.startsWith('package-lock.json: no command')).length, 3);
    const shell = (s, command) => ({ kind: 'shell', command, ts: ms(s) });
    const ran = check([...three(20), shell(30, 'node scripts/quality/change-report.mjs --lockfile-age main'), run(31, 'node --test scripts/quality/install-scripts.test.mjs'), shell(32, 'npm audit --json')], { files: withLock });
    assert.deepEqual(ran.problems, []);
  });

  it('a locale file: only the object of each changed key is read', () => {
    const now = '{\n  "a": {\n    "x": "1"\n  },\n  "b": {\n    "y": "new"\n  }\n}\n';
    const locale = { 'messages/en.json': { text: now, head: '{"a":{"x":"1"},"b":{"y":"old"}}', mtime: ms(10) } };
    const r = check([rd(20, 'messages/en.json', ['{', '  "a": {', '    "x": "1"', '  },', '  "b": {', '    "y": "new"', '  }', '}'])], { files: locale });
    assert.equal(r.rows[0].required, 3, 'lines 5-7: the object "b"');
    assert.deepEqual([...r.rows[0].requiredLines], [5, 6, 7]);
    assert.equal(r.rows[0].passes.length, 1);
  });

  it('a read set over 3 000 lines is refused', () => {
    const big = { 'src/big.ts': { text: 'x\n'.repeat(3001), mtime: ms(10) } };
    assert.ok(check([], { files: big }).problems.some((p) => p.includes('3001 lines, over 3000')));
  });
});

test('no option lowers what the tool asks: the passes, the limit, the base and the start are fixed', async () => {
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const script = fileURLToPath(new URL('./read-coverage.mjs', import.meta.url));
  for (const args of [['--passes', '1'], ['--max-lines', '99999'], ['--base', 'HEAD~5'], ['--since', '2099-01-01T00:00:00Z']]) {
    const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
    assert.equal(r.status, 2, args.join(' '));
    assert.match(r.stderr, /unknown option/);
  }
  const bad = spawnSync(process.execPath, [script, '--files-since', 'yesterday'], { encoding: 'utf8' });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /not a date/);
});

test('findTranscript: no session id, no transcript', () => {
  assert.equal(findTranscript({}), null);
  assert.equal(findTranscript({ CLAUDE_CODE_SESSION_ID: 'x', CLAUDE_CONFIG_DIR: path.resolve('/nonexistent-config') }), null);
});
