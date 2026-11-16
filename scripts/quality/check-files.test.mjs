// node --test scripts/quality/check-files.test.mjs
// One case per rule of check-files.mjs, each with a passing and a failing input. Characters that must not appear
// literally in a source file are built with String.fromCodePoint.
import { describe, it, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRegularFile, checkFile,brokenLinks, stalePaths, brokenScripts, setScripts, inRepository, kickoffFindings, acceptanceCriteria, AUTOMATED_TEST, sqlStructure, checkPowerShell, checkShell, isShellScript, KICKOFF_SECTIONS } from './check-files.mjs';
import * as cf from './check-files.mjs';

const ch = (cp) => String.fromCodePoint(cp);
const rules = (rel, text, opts) => checkFile(rel, Buffer.isBuffer(text) ? text : Buffer.from(text, 'utf8'), opts).map((f) => f.rule);
const none = { exists: () => true };

test('junk files, environment files and build output are refused', () => {
  for (const rel of ['debug.log', 'a/b.bak', 'x.orig', 'p.rej', 'n.nul', 't.tmp', '.x.swp']) assert.ok(rules(rel, 'x', none).includes('junk-file'), rel);
  for (const rel of ['node_modules/a/i.js', '.next/x.js', 'storybook-static/i.html', 'test-results/r.txt', 'coverage/c.json']) assert.ok(rules(rel, '{}', none).includes('junk-file'), rel);
  for (const rel of ['.env', '.env.local', 'app/.env.production']) assert.ok(rules(rel, 'A=1', none).includes('env-file'), rel);
  for (const rel of ['.env.example', 'docs/env.md', 'src/env.ts']) assert.ok(!rules(rel, 'export const a = 1;', none).includes('env-file'), rel);
});

test('size limit and binary signatures', () => {
  assert.ok(rules('big.txt', Buffer.alloc(20 * 1024 * 1024 + 1, 0x61), none).includes('too-large'));
  assert.deepEqual(rules('p.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2]), none), []);
  assert.ok(rules('p.png', Buffer.from('<html>'), none).includes('binary-type'));
  assert.ok(rules('a.txt', Buffer.from([0x61, 0, 0x62]), none).includes('nul-byte'));
  assert.ok(rules('a.txt', Buffer.from([0xc3, 0x28]), none).includes('not-utf8'));
});

test('a BOM is allowed only at the start of a .ps1 file', () => {
  assert.ok(rules('a.md', ch(0xfeff) + '# A\n', none).includes('bom'));
  assert.ok(!rules('a.ps1', ch(0xfeff) + 'Write-Output 1\n', none).includes('bom'));
  assert.ok(rules('a.ps1', 'Write-Output 1' + ch(0xfeff) + '\n', none).includes('invisible-character'));
});

test('invisible, bidi, tag and control characters are refused; tab, newline and CR pass', () => {
  for (const cp of [0x200b, 0x200c, 0x2060, 0x00ad, 0x202e, 0x2066, 0x2069, 0xe0041, 0x1b, 0x08, 0x7f, 0x85]) {
    assert.ok(rules('a.ts', `const a = 1;${ch(cp)}\n`, none).includes('invisible-character'), cp.toString(16));
  }
  assert.deepEqual(rules('a.ts', 'const a = 1;\t\r\n', none), []);
  // A zero-width joiner is part of emoji sequences and stays allowed.
  assert.deepEqual(rules('a.md', `# A ${ch(0x1f468)}${ch(0x200d)}${ch(0x1f469)}\n`, none), []);
});

test('merge conflict markers', () => {
  const marker = (c) => c.repeat(7);
  assert.ok(rules('a.md', `${marker('<')} HEAD\na\n${marker('=')}\nb\n${marker('>')} x\n`, none).includes('merge-conflict'));
  assert.ok(!rules('a.md', `# T\n\n${marker('=')}\n`, none).includes('merge-conflict'));
});

test('secrets are refused in any file type', () => {
  const samples = [
    ['-----BEGIN ', 'RSA PRIVATE KEY-----'],
    ['ghp_', 'A'.repeat(36)],
    ['AKIA', 'ABCDEFGHIJKLMNOP'],
    ['sk_live_', 'a'.repeat(24)],
    ['eyJ', 'hbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'],
    ['sb_secret_', 'a'.repeat(30)],
    ['xoxb-', '1234567890-abc'],
    ['AIza', 'S'.repeat(35)],
    ['npm_', 'a'.repeat(36)],
  ];
  for (const [a, b] of samples) assert.ok(rules('notes.md', `key: ${a}${b}\n`, none).includes('secret'), a);
  assert.ok(!rules('notes.md', 'key: process.env.SUPABASE_SERVICE_ROLE_KEY\n', none).includes('secret'));
});

test('mojibake is refused outside the allowlist', () => {
  const broken = String.fromCharCode(0xe2, 0x20ac, 0x201d);
  assert.ok(rules('docs/x.md', `a ${broken} b\n`, none).includes('mojibake'));
  assert.ok(!rules('docs/x.md', `a ${ch(0x2014)} b\n`, none).includes('mojibake'));
});

test('JSON, YAML, code, CSS and SVG are parsed', () => {
  assert.ok(rules('a.json', '{"a":1,}', none).includes('json'));
  assert.deepEqual(rules('a.json', '{"a":1}', none), []);
  assert.ok(rules('a.yml', 'a: [1, 2\n', none).includes('yaml'));
  assert.deepEqual(rules('a.yml', 'a:\n  - 1\n---\nb: 2\n', none), []);
  assert.ok(rules('a.ts', 'const a: = 1;', none).includes('syntax'));
  assert.ok(rules('a.tsx', 'export const A = () => <div>;', none).includes('syntax'));
  assert.deepEqual(rules('a.tsx', 'export const A = () => <div />;', none), []);
  assert.ok(rules('a.mjs', 'export default function (', none).includes('syntax'));
  assert.ok(rules('a.css', '.a { color: red; }}', none).includes('css'));
  assert.deepEqual(rules('a.css', '.a { &:hover { color: red; } }', none), []);
  assert.ok(rules('i.svg', '<svg onload="x()"></svg>', none).includes('svg-active-content'));
  assert.ok(rules('i.svg', '<svg><script>x()</script></svg>', none).includes('svg-active-content'));
  assert.deepEqual(rules('i.svg', '<svg><path d="M0 0"/></svg>', none), []);
});

test('SQL structure: strings, dollar quotes, comments and parentheses', () => {
  assert.equal(sqlStructure("select 'it''s' from t where (a = 1);"), null);
  assert.equal(sqlStructure('create function f() returns int as $$ select (1 $$ language sql;'), null);
  assert.equal(sqlStructure("select E'a\\'b';"), null);
  assert.equal(sqlStructure('-- (\n/* ( /* nested */ */ select 1;'), null);
  assert.match(sqlStructure("select 'open;").message, /unterminated string/);
  assert.match(sqlStructure('select (1;').message, /unclosed/);
  assert.match(sqlStructure('select 1);').message, /unbalanced/);
  assert.match(sqlStructure('do $body$ begin end;').message, /dollar-quoted/);
  assert.ok(rules('supabase/migrations/1.sql', 'select (1;', none).includes('sql'));
});

test('Markdown relative links must resolve; code and URLs are ignored', () => {
  const exists = (p) => p === 'docs/a.md';
  assert.deepEqual(brokenLinks('docs/b.md', '[a](a.md) [w](https://x.y/z.md) `[c](gone.md)`\n', exists), []);
  assert.equal(brokenLinks('docs/b.md', '[g](gone.md)\n', exists)[0].target, 'gone.md');
  assert.equal(brokenLinks('docs/b.md', '[up](../../outside.md)\n', () => true).length, 1);
  assert.deepEqual(brokenLinks('docs/b.md', '```\n[g](gone.md)\n```\n', exists), []);
  assert.ok(rules('docs/b.md', '[g](gone.md)\n', { exists }).includes('broken-link'));
});

test('kickoffs from Sprint 93 on follow the template', () => {
  const body = {
    '## Acceptance criteria': '- AC1 x — test: `src/a/x.test.ts`',
    '## Cause': '`src/a/x.ts:3` returns the raw code.\nFix: return the translated text.',
    '## Read set': 'Counted at abc1234\n- `src/a/not-there-yet.ts` — new, 10 lines',
  };
  // the Cause source exists now with 10 lines; the commit exists and holds none of the read set
  const io = { lineCount: (rel) => (rel === 'src/a/x.ts' ? 10 : null), atCommit: { exists: (sha) => sha === 'abc1234', lineCount: () => null } };
  const k = (text) => kickoffFindings(text, io);
  const good = ['# Task 1 — Outcome', '', ...KICKOFF_SECTIONS.flatMap((s) => [s, body[s] ?? 'text', ''])].join('\n');
  assert.deepEqual(k(good), []);
  assert.ok(k(good.replace('## UI\n', '')).some((f) => f.message.includes('## UI')));
  assert.ok(k(good.replace('- AC1 x', 'AC1 x')).some((f) => f.message.includes('AC<n>')));
  assert.ok(k(good.replace('# Task 1 — Outcome', '# Outcome')).some((f) => f.message.includes('first line')));
  const swapped = good.replace('## Scope', '## TMP').replace('## Goal', '## Scope').replace('## TMP', '## Goal');
  assert.ok(k(swapped).some((f) => f.message.includes('out of order')));
  assert.ok(k(good + '\nx'.repeat(200)).some((f) => f.message.includes('lines >')));
  // The "## OWASP" checklist (one line per required sheet) does not count towards the limit; every other section does.
  assert.deepEqual(k(good.replace('## OWASP\ntext', `## OWASP\n${'- S: not applicable — reason.\n'.repeat(200)}`)), []);
  assert.ok(k(good.replace('## UI\ntext', `## UI\n${'x\n'.repeat(200)}`)).some((f) => f.message.includes('lines >')));
  // The review's per-sheet verdicts live in their own record: a checklist pasted into the review counts like any other text.
  assert.ok(k(`${good}\n### OWASP check\n${'- S: not applicable — reason.\n'.repeat(200)}`).some((x) => x.message.includes('lines >')));
  assert.ok(k(good.replace('## OWASP\n', '')).some((f) => f.message.includes('## OWASP')));
  // Older sprints are history and are not re-checked against the new template.
  assert.deepEqual(rules('tasks/Sprints/Sprint_90_kickoff_prompt_Task_1_X.md', '# Old\n', none), []);
  assert.ok(rules('tasks/Sprints/Sprint_93_kickoff_prompt_Task_1_X.md', '# Old\n', none).includes('kickoff'));
  // The OWASP gate runs on every such kickoff: an invented quote (not in the sheet) is a finding.
  const invented = good.replace('## OWASP\ntext', '## OWASP\n- Secure_Coding_with_AI: "agents may trust every repository comment fully" — x — AC1');
  assert.ok(rules('tasks/Sprints/Sprint_93_kickoff_prompt_Task_1_X.md', invented, none).includes('owasp'));
  assert.ok(!rules('tasks/Sprints/Sprint_93_kickoff_prompt_Task_947_X.md', invented, none).includes('owasp'), 'a grandfathered kickoff is not held to the OWASP gate');
});

describe('a kickoff names the cause with real sources and the fix, and a read set counted at a named commit (F20, F21)', () => {
  const sections = (cause, set, review = '') => ['# Task 1 — Outcome', '', ...KICKOFF_SECTIONS.flatMap((s) => [s,
    s === '## Cause' ? cause : s === '## Read set' ? set : s === '## Review' ? review : s === '## Acceptance criteria' ? '- AC1 x — test: `src/a/x.test.ts`' : 'text', ''])].join('\n');
  // the files at the named commit abc1234, and the files now (where a "## Cause" source is looked up)
  const atCommit = { exists: (sha) => sha === 'abc1234', lineCount: (sha, rel) => (sha === 'abc1234' ? ({ 'src/a.ts': 120, 'src/b.ts': 2900 })[rel] ?? null : null) };
  const now = (rel) => ({ 'src/a.ts': 130, 'scripts/x.mjs': 50 })[rel] ?? null;
  const check = (cause, set, review) => kickoffFindings(sections(cause, set, review), { lineCount: now, atCommit }).map((f) => f.message);
  const cause = '`src/a.ts:42` returns the raw code to the banner.\nFix: return the translated text.';
  const set = (...entries) => ['Counted at abc1234', ...entries].join('\n');

  it('a cause with an existing source and a fix, a read set counted at the commit: no finding', () => {
    assert.deepEqual(check(cause, set('- `src/a.ts` — 120 lines', '- `src/new.ts` — new, 30 lines')), []);
    assert.deepEqual(check('`node scripts/quality/db-catalog-audit.mjs` → `I15 notifications: two PERMISSIVE policies`\nFix: drop one.', set('- `src/a.ts` — 120 lines')), []);
    assert.deepEqual(check('`src/a.ts:120-130` and `scripts/x.mjs:50` return the raw code.\nFix: y.', set('- `src/a.ts` — 120 lines')), []);
  });

  it('the cause: a source and a fix line are both required', () => {
    assert.ok(check('the banner shows a raw code.\nFix: translate it.', set('- `src/a.ts` — 120 lines')).some((m) => m.includes('no source')));
    assert.ok(check('`src/a.ts:42` returns the raw code.', set('- `src/a.ts` — 120 lines')).some((m) => m.includes('"Fix:')));
  });

  it('F21: a `path:line` source must exist with that line; a bare file name is no source; a command source quotes its output', () => {
    assert.ok(check('`src/nope/does-not-exist.ts:1` returns x.\nFix: y.', set('- `src/a.ts` — 120 lines')).some((m) => m.includes('src/nope/does-not-exist.ts:1') && m.includes('not in the repository')));
    assert.ok(check('`src/a.ts:131` returns x.\nFix: y.', set('- `src/a.ts` — 120 lines')).some((m) => m.includes('src/a.ts:131') && m.includes('has 130 lines')));
    assert.ok(check('`src/a.ts:120-140` returns x.\nFix: y.', set('- `src/a.ts` — 120 lines')).some((m) => m.includes('src/a.ts:120-140') && m.includes('has 130 lines')));
    assert.ok(check('`a.ts:3` returns x.\nFix: y.', set('- `src/a.ts` — 120 lines')).some((m) => m.includes('no source')));
    assert.ok(check('`grep -rn "AdminUserCreate" src` finds nothing.\nFix: y.', set('- `src/a.ts` — 120 lines')).some((m) => m.includes('quotes no output')));
    assert.ok(check('`src/a.ts:42` and `grep -rn x src` with no output.\nFix: y.', set('- `src/a.ts` — 120 lines')).some((m) => m.includes('quotes no output')), 'every command source, not only the first');
  });

  it('F20: every count is compared with the named commit, also after the review is written', () => {
    assert.ok(check(cause, set('- `src/a.ts` — 12 lines')).some((m) => m.includes('src/a.ts has 120 lines at abc1234, not 12')));
    assert.ok(check(cause, set('- `src/a.ts` — 12 lines'), 'Review 1 — NEEDS REVISION').some((m) => m.includes('has 120 lines at abc1234, not 12')));
    assert.equal(check(cause, set('- `src/a.ts` — 1 lines', '- `src/b.ts` — 5 lines'), 'Review 6 — written').filter((m) => m.includes('at abc1234, not')).length, 2);
    assert.ok(check(cause, '- `src/a.ts` — 120 lines').some((m) => m.includes('no "Counted at <commit>" line')));
    assert.ok(check(cause, 'Counted at fff9999\n- `src/a.ts` — 120 lines').some((m) => m.includes('fff9999 is not a commit of this repository')));
    assert.ok(check(cause, set('- `src/gone.ts` — 12 lines')).some((m) => m.includes('src/gone.ts is not in abc1234')));
    assert.ok(check(cause, set('- `src/a.ts` — new, 120 lines')).some((m) => m.includes('is not new')));
    assert.ok(check(cause, set('src/a.ts 120')).some((m) => m.includes('must be')));
    assert.ok(check(cause, 'Counted at abc1234').some((m) => m.includes('lists no file')));
    assert.ok(check(cause, set('- `src/a.ts` — 120 lines', '- `src/b.ts` — 2900 lines')).some((m) => m.includes('3020 lines > 3000')));
  });

  it('the real commit reader: an unknown commit does not exist, a file of HEAD has its lines', async () => {
    const { spawnSync } = await import('node:child_process');
    assert.equal(cf.commitLines.exists('0000000'), false);
    assert.equal(cf.commitLines.exists('HEAD'), false, 'only a hexadecimal commit name');
    assert.equal(cf.commitLines.lineCount('0000000', 'package.json'), null);
    const head = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
    const shown = spawnSync('git', ['show', `${head}:package.json`], { encoding: 'utf8' }).stdout;
    assert.equal(cf.commitLines.exists(head), true);
    assert.equal(cf.commitLines.lineCount(head, 'package.json'), shown.replace(/\n$/, '').split('\n').length);
    assert.equal(cf.commitLines.lineCount(head, 'scripts/quality'), null, 'a folder is not a file');
  });
});

test('F22: a grandfathered kickoff keeps its old sections only while its text is the one recorded on 2026-11-16', () => {
  const old = ['# Task 962 — Outcome', '', ...KICKOFF_SECTIONS.filter((s) => s !== '## Cause' && s !== '## Read set').flatMap((s) => [s, s === '## Acceptance criteria' ? '- AC1 x — test: `src/a/x.test.ts`' : 'text', ''])].join('\n');
  const grandfathered = new Map([['962', cf.kickoffHash(old)]]);
  assert.deepEqual(kickoffFindings(old, { task: '962', grandfathered }), []);
  assert.equal(cf.kickoffHash(old.replace(/\n/g, '\r\n')), cf.kickoffHash(old), 'line endings do not change the text');
  // the 962 kickoff with a revision line added: no longer the recorded text, so it is held to the rule
  const revised = old.replace('## Review\ntext', '## Review\ntext\nRevision 2 — the read set grows');
  assert.ok(kickoffFindings(revised, { task: '962', grandfathered }).some((f) => f.message.includes('## Cause')));
  // a kickoff never listed is held to it: Task 956 (rewritten under the rule) and a new one
  assert.ok(kickoffFindings(old, { task: '956', grandfathered }).some((f) => f.message.includes('## Cause')));
  assert.ok(kickoffFindings(old, { task: '981', grandfathered }).some((f) => f.message.includes('## Cause')));
  // the real list: one sha256 per kickoff written before the rule; 956 is not among them
  assert.equal(cf.CAUSE_GRANDFATHERED.size, 30);
  for (const [task, hash] of cf.CAUSE_GRANDFATHERED) assert.match(`${task} ${hash}`, /^9\d\d [0-9a-f]{64}$/);
  assert.ok(!cf.CAUSE_GRANDFATHERED.has('956'));
});

test('lineCount reads only a regular file inside the repository', async () => {
  const { lineCount } = await import('./check-files.mjs');
  assert.equal(lineCount('scripts/quality/check-files.mjs'), readFileSync(new URL('./check-files.mjs', import.meta.url), 'utf8').replace(/\n$/, '').split('\n').length);
  assert.equal(lineCount('scripts/quality'), null, 'a folder');
  assert.equal(lineCount('../outside.md'), null, 'a path that leaves the root');
  assert.equal(lineCount('scripts/quality/no-such-file.mjs'), null);
});

test('every acceptance criterion names an automated test (quality-gates.md §8)', () => {
  const kickoff = (ac) => ['# Task 1 — Outcome', '', ...KICKOFF_SECTIONS.flatMap((s) => [s, s === '## Acceptance criteria' ? ac : 'text', ''])].join('\n');
  const acFindings = (ac) => kickoffFindings(kickoff(ac)).filter((f) => f.message.includes('names no automated test'));
  assert.equal(acFindings('- AC1 the owner looks at the page at 320 px').length, 1);
  assert.equal(acFindings('- AC1 checked by hand — test: manual').length, 1);
  assert.deepEqual(acFindings('- AC1 refused for a guest — `src/modules/x/__tests__/actions.security.test.ts`'), []);
  assert.deepEqual(acFindings('- AC1 no finding — `node scripts/quality/check-files.mjs --all`'), []);
  assert.deepEqual(acFindings('- AC1 the sheet opens — `src/stories/patterns/mantine/AuthSheet.stories.tsx` play function'), []);
  // The test may sit on an indented continuation line of the same criterion.
  assert.deepEqual(acFindings('- AC1 the role is kept\n  test: `src/a/role.test.tsx`'), []);
  // Only the criterion without a test is reported, with its own id.
  const two = acFindings('- AC1 ok — `npm run lint`\n- AC2 looks right');
  assert.equal(two.length, 1);
  assert.match(two[0].message, /^AC2 /);
  const items = acceptanceCriteria(['- AC1 a', '  more', '- AC2 b', 'not an item'], 10);
  assert.deepEqual(items.map((i) => [i.id, i.line]), [['AC1', 10], ['AC2', 12]]);
  assert.match(items[0].text, /more/);
  assert.ok(!AUTOMATED_TEST.test('describe the stories'));
  assert.ok(!AUTOMATED_TEST.test('`git status` shows nothing'));
});

test('active documents may not name a file or npm script that is not in the repository', () => {
  const exists = (p) => ['src/a.ts', 'src', 'docs/b.md', 'docs'].includes(p);
  setScripts(['lint', 'check:i18n']);
  const doc = (line) => stalePaths('docs/rules.md', `# Rules\n\n${line}\n`, exists).map((x) => x.target);
  assert.deepEqual(doc('Run `src/a.ts` and `src/` and `src/a.ts:12-14` and `src/a.ts:20,70`.'), []);
  assert.deepEqual(doc('The hook `.claude/hooks/gate.ps1` blocks the write.'), ['.claude/hooks/gate.ps1']);
  assert.deepEqual(doc('CI runs `.github/workflows/old.yml`.'), ['.github/workflows/old.yml']);
  // The same line may say the file is gone, local, or about to be created.
  assert.deepEqual(doc('The hook `.claude/hooks/gate.ps1` was removed 2026-11-06.'), []);
  assert.deepEqual(doc('Output `scripts/x.latest.json` (gitignored).'), []);
  assert.deepEqual(doc('The task creates `src/new.test.ts`.'), []);
  // Placeholders and globs are not paths.
  assert.deepEqual(doc('`docs/sessions/YYYY-MM-DD-x.md` `src/**/*.ts` `src/<module>/x.ts` `docs/sessions/...`'), []);
  // Commands: npm run must name a package.json script.
  assert.deepEqual(doc('Run `npm run lint` then npm run check:i18n.'), []);
  assert.deepEqual(doc('Run `npm run check:kickoff-ledger`.'), ['npm run check:kickoff-ledger']);
  // Code fences and records of the past keep the paths they had.
  assert.deepEqual(stalePaths('docs/rules.md', '```\n`src/gone.ts`\n```\n', exists), []);
  assert.deepEqual(stalePaths('docs/sessions/2026-01-01-x.md', '`src/gone.ts`\n', exists), []);
  assert.deepEqual(stalePaths('tasks/Sprints/Sprint_93_kickoff_prompt_Task_1_X.md', '`src/gone.ts`\n', exists), []);
  // Rules files are policy and are checked.
  assert.equal(stalePaths('.claude/rules/flow.md', '`scripts/workflow-gates/x.mjs`\n', exists).length, 1);
  // The finding reaches checkFile for any Markdown file.
  assert.ok(checkFile('docs/rules.md', Buffer.from('`src/gone.ts`\n'), { exists }).some((x) => x.rule === 'stale-path'));
  setScripts(Object.keys(JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).scripts));
});

test('package.json scripts run files that exist and call scripts that exist', () => {
  const exists = (p) => p === 'scripts/ok.mjs';
  const pkg = (scripts) => JSON.stringify({ scripts });
  assert.deepEqual(brokenScripts(pkg({ a: 'node scripts/ok.mjs --x', b: 'npm run a && eslint .' }), exists), []);
  assert.deepEqual(brokenScripts(pkg({ a: 'node scripts/workflow-gates/gone.mjs' }), exists), ['script "a" runs scripts/workflow-gates/gone.mjs, which is not in the repository']);
  assert.deepEqual(brokenScripts(pkg({ a: 'npm run missing' }), exists), ['script "a" calls npm run missing, which does not exist']);
  assert.ok(checkFile('package.json', Buffer.from(pkg({ a: 'node scripts/gone.mjs' })), { exists }).some((x) => x.rule === 'stale-path'));
  assert.ok(!checkFile('other/package.json', Buffer.from(pkg({ a: 'node scripts/gone.mjs' })), { exists }).some((x) => x.rule === 'stale-path'));
});

test('existence means the repository, not the disk: an ignored local file does not count', () => {
  assert.equal(inRepository('scripts/quality/check-files.mjs'), true);
  assert.equal(inRepository('scripts/quality'), true);
  assert.equal(inRepository('scripts/quality/'), true);
  assert.equal(inRepository('.env.local'), false);
  assert.equal(inRepository('node_modules/typescript/package.json'), false);
  assert.equal(inRepository('scripts/quality/no-such-file.mjs'), false);
});

test('a file is read through one descriptor: a regular file gives its bytes, a folder or a missing path gives null', () => {
  const here = fileURLToPath(new URL('./check-files.mjs', import.meta.url));
  assert.deepEqual(readRegularFile(here), readFileSync(here));
  assert.equal(readRegularFile(path.dirname(here)), null);
  assert.equal(readRegularFile(path.join(path.dirname(here), 'no-such-file.mjs')), null);
});

test('the kickoff template includes the mobile adaptation record (GR-3j)', () => {
  const good = ['# Task 1 — Outcome', '', ...KICKOFF_SECTIONS.flatMap((s) => [s, s === '## Acceptance criteria' ? '- AC1 x — test: `src/a/x.test.ts`' : 'text', ''])].join('\n');
  assert.ok(KICKOFF_SECTIONS.indexOf('## Mobile adaptation record') === KICKOFF_SECTIONS.indexOf('## UI') + 1);
  assert.ok(kickoffFindings(good.replace('## Mobile adaptation record\n', '')).some((f) => f.message.includes('Mobile adaptation record')));
});

test('shell scripts (by extension or shebang) are parsed with bash -n', async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  assert.ok(isShellScript('.githooks/pre-commit', '#!/bin/sh\nset -e\n'));
  assert.ok(isShellScript('run.sh', 'echo 1\n'));
  assert.ok(!isShellScript('README.md', '# Title\n'));
  const dir = mkdtempSync(path.join(os.tmpdir(), 'cf-sh-'));
  try {
    writeFileSync(path.join(dir, 'ok.sh'), 'if [ -n "$A" ]; then echo 1; fi\n');
    writeFileSync(path.join(dir, 'bad.sh'), 'if [ -n "$A" ]; then echo 1\n');
    const r = checkShell([{ rel: 'ok.sh', abs: path.join(dir, 'ok.sh') }, { rel: 'bad.sh', abs: path.join(dir, 'bad.sh') }]);
    assert.deepEqual(r.get('ok.sh'), []);
    assert.equal(r.get('bad.sh')[0].rule, 'shell');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('PowerShell files are parsed by the PowerShell parser', { skip: process.platform !== 'win32' && 'PowerShell parser checked on Windows' }, async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const dir = mkdtempSync(path.join(os.tmpdir(), 'cf-test-'));
  try {
    writeFileSync(path.join(dir, 'ok.ps1'), 'Write-Output 1\n');
    writeFileSync(path.join(dir, 'bad.ps1'), 'if ($a { Write-Output 1 }\n');
    const r = checkPowerShell([{ rel: 'ok.ps1', abs: path.join(dir, 'ok.ps1') }, { rel: 'bad.ps1', abs: path.join(dir, 'bad.ps1') }]);
    assert.deepEqual(r.get('ok.ps1'), []);
    assert.ok(r.get('bad.ps1').length > 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Owner 2026-11-07: the translations get quality protection, not a key census, and a found gap is closed where it is
// found. The locale and client-sink rules run on each file's own text at every commit and CI run (not only in a CI scan).
test('a locale file is held to locale-safety.mjs on its own text', () => {
  const en = JSON.parse(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'messages', 'en.json'), 'utf8'));
  assert.deepEqual(rules('messages/en.json', JSON.stringify(en), none), [], 'the real file passes');
  const bad = (k, v) => { const c = structuredClone(en); c.zz_planted = { [k]: v }; return JSON.stringify(c); };
  for (const v of ['<b>bold</b>', 'go to javascript:alert(1)', 'see http://example.com', 'broken {count, plural, one {x}']) {
    assert.ok(rules('messages/en.json', bad('a', v), none).includes('locale'), v);
  }
  assert.deepEqual(rules('locales/en.json', bad('a', '<b>x</b>'), none), [], 'only messages/<locale>.json is locale data');
});

test('product code is held to client-sinks.mjs and the translation bypass rule on its own text', () => {
  assert.ok(rules('src/a/View.tsx', 'export const V = () => { window.open(u, "_blank"); return null }\nconst x = el.innerHTML += s\n', none).includes('client-sink'));
  assert.ok(rules('src/a/View.tsx', 'export const V = ({ t }) => t.rich("k", {})\n', none).includes('locale'));
  assert.deepEqual(rules('src/a/View.tsx', 'export const V = ({ t }) => t("k")\n', none), []);
  assert.deepEqual(rules('src/a/__tests__/View.test.tsx', 'const x = el.innerHTML += s\n', none), [], 'tests are not product code');
});

// The golden rule (owner, 2026-11-07): a gap found is closed, never only reported.
test('a finding of an audit ledger is fixed with its test, handed to an open task that cites it, or accepted by the owner', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import('node:fs');
  const os = await import('node:os');
  const { ledgerFindings } = await import('./check-files.mjs');
  const root = mkdtempSync(path.join(os.tmpdir(), 'ledger-'));
  try {
    mkdirSync(path.join(root, 'docs'), { recursive: true });
    mkdirSync(path.join(root, 'tasks', 'Sprints'), { recursive: true });
    writeFileSync(path.join(root, 'docs', 'backlog.md'), '| **900** | open (X-09) |\n| **901** | open |\n');
    writeFileSync(path.join(root, 'tasks', 'Sprints', 'Sprint_93_kickoff_prompt_Task_901_Y.md'), 'Carries X-02.\n');
    const exists = (p) => p === 'src/a.test.ts';
    const rel = 'docs/security/audit-1/findings.md';
    const row = (id, status) => `| ${id} | Low | \`src/a.ts\` | a gap | Sheet | ${status} |`;
    const ids = (status, id = 'X-02') => ledgerFindings(rel, row(id, status), exists, { root }).map((f) => f.message.split(':')[0]);
    assert.deepEqual(ids('fixed here: `src/a.test.ts` plants it'), []);
    assert.deepEqual(ids('fixed here'), ['X-02'], 'fixed without the test that proves it');
    assert.deepEqual(ids('fixed: `src/missing.test.ts`'), ['X-02'], 'a test that does not exist');
    assert.deepEqual(ids('Task 901'), [], 'handed to an open task whose kickoff cites it');
    assert.deepEqual(ids('Task 901', 'X-03'), ['X-03'], 'the kickoff does not cite this finding');
    assert.deepEqual(ids('Task 900', 'X-09'), [], 'a task with no kickoff yet cites it in its backlog row');
    assert.deepEqual(ids('Task 900', 'X-02'), ['X-02']);
    assert.deepEqual(ids('Task 999'), ['X-02'], 'not an open task');
    assert.deepEqual(ids('accepted: low risk'), ['X-02'], 'only the owner accepts');
    assert.deepEqual(ids('accepted by the owner, D12: bounded by `src/a.test.ts`'), []);
    assert.deepEqual(ids('not a gap: proven by `src/a.test.ts`'), []);
    assert.deepEqual(ids('noted'), ['X-02'], 'only reported');
    assert.deepEqual(ledgerFindings('docs/notes.md', row('X-02', 'noted'), exists, { root }), [], 'only audit ledgers');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
