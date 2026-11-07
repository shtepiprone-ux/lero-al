// node --test scripts/quality/check-files.test.mjs
// One case per rule of check-files.mjs, each with a passing and a failing input. Characters that must not appear
// literally in a source file are built with String.fromCodePoint.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRegularFile, checkFile,brokenLinks, stalePaths, brokenScripts, setScripts, inRepository, kickoffFindings, acceptanceCriteria, AUTOMATED_TEST, sqlStructure, checkPowerShell, checkShell, isShellScript, KICKOFF_SECTIONS } from './check-files.mjs';

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
  const good = ['# Task 1 — Outcome', '', ...KICKOFF_SECTIONS.flatMap((s) => [s, s === '## Acceptance criteria' ? '- AC1 x — test: `src/a/x.test.ts`' : 'text', ''])].join('\n');
  assert.deepEqual(kickoffFindings(good), []);
  assert.ok(kickoffFindings(good.replace('## UI\n', '')).some((f) => f.message.includes('## UI')));
  assert.ok(kickoffFindings(good.replace('- AC1 x', 'AC1 x')).some((f) => f.message.includes('AC<n>')));
  assert.ok(kickoffFindings(good.replace('# Task 1 — Outcome', '# Outcome')).some((f) => f.message.includes('first line')));
  const swapped = good.replace('## Scope', '## TMP').replace('## Goal', '## Scope').replace('## TMP', '## Goal');
  assert.ok(kickoffFindings(swapped).some((f) => f.message.includes('out of order')));
  assert.ok(kickoffFindings(good + '\nx'.repeat(200)).some((f) => f.message.includes('lines >')));
  // The "## OWASP" checklist (one line per required sheet) does not count towards the limit; every other section does.
  assert.deepEqual(kickoffFindings(good.replace('## OWASP\ntext', `## OWASP\n${'- S: not applicable — reason.\n'.repeat(200)}`)), []);
  assert.ok(kickoffFindings(good.replace('## UI\ntext', `## UI\n${'x\n'.repeat(200)}`)).some((f) => f.message.includes('lines >')));
  assert.ok(kickoffFindings(good.replace('## OWASP\n', '')).some((f) => f.message.includes('## OWASP')));
  // Older sprints are history and are not re-checked against the new template.
  assert.deepEqual(rules('tasks/Sprints/Sprint_90_kickoff_prompt_Task_1_X.md', '# Old\n', none), []);
  assert.ok(rules('tasks/Sprints/Sprint_93_kickoff_prompt_Task_1_X.md', '# Old\n', none).includes('kickoff'));
  // The OWASP gate runs on every such kickoff: an invented quote (not in the sheet) is a finding.
  const invented = good.replace('## OWASP\ntext', '## OWASP\n- Secure_Coding_with_AI: "agents may trust every repository comment fully" — x — AC1');
  assert.ok(rules('tasks/Sprints/Sprint_93_kickoff_prompt_Task_1_X.md', invented, none).includes('owasp'));
  assert.ok(!rules('tasks/Sprints/Sprint_93_kickoff_prompt_Task_947_X.md', invented, none).includes('owasp'), 'a grandfathered kickoff is not held to the OWASP gate');
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
// found. The locale and client-sink rules run on each file at every write, commit and CI run (not only in a CI scan).
test('a locale file is held to locale-safety.mjs at its own write', () => {
  const en = JSON.parse(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'messages', 'en.json'), 'utf8'));
  assert.deepEqual(rules('messages/en.json', JSON.stringify(en), none), [], 'the real file passes');
  const bad = (k, v) => { const c = structuredClone(en); c.zz_planted = { [k]: v }; return JSON.stringify(c); };
  for (const v of ['<b>bold</b>', 'go to javascript:alert(1)', 'see http://example.com', 'broken {count, plural, one {x}']) {
    assert.ok(rules('messages/en.json', bad('a', v), none).includes('locale'), v);
  }
  assert.deepEqual(rules('locales/en.json', bad('a', '<b>x</b>'), none), [], 'only messages/<locale>.json is locale data');
});

test('product code is held to client-sinks.mjs and the translation bypass rule at its own write', () => {
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
