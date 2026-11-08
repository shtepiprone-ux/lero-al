// Self-tests of the OWASP gate (scripts/quality/owasp.mjs). Each rule is proven by a planted case run through the same
// function the gate uses, and the repository's own mapping is checked when the sheet cache exists (CI syncs it first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ROOT, REGISTRY, CONTROLS, CACHE, VERIFIED, normalise, quotesOf, quoteFound, triggered, pathsIn, surfaceChanged,
  checkMapping, checkKickoff, checkReview, readReviewRecord, REVIEWS, loadJson, kickoffPlan, diffRegistry, sessionContext, OWASP_GRANDFATHERED, uncovered, checkGate, isDependencyOnly, lastVerdict, refreshCache, gitBlobSha, sheetText,
} from './owasp.mjs';

const SHEET_A = '# Alpha\n\nThe server **must** validate every `request` before use, [see](x.md) always.\n';
const SHEET_B = '# Beta\n\n- Never log a raw e-mail address in any log line at all.\n';
const QA = 'The server must validate every request before use';

/** A throw-away repository with two sheets, their cache, a control file, a backlog and an optional kickoff. */
function fixture({ kickoff } = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'owasp-'));
  mkdirSync(path.join(root, CACHE), { recursive: true });
  writeFileSync(path.join(root, CACHE, 'Alpha.md'), SHEET_A);
  writeFileSync(path.join(root, CACHE, 'Beta.md'), SHEET_B);
  mkdirSync(path.join(root, 'src'), { recursive: true });
  writeFileSync(path.join(root, 'src', 'guard.ts'), 'export const guard = () => parseRequest()\n');
  mkdirSync(path.join(root, 'docs'), { recursive: true });
  writeFileSync(path.join(root, 'docs', 'backlog.md'), '| **900** | open |\n');
  if (kickoff) {
    mkdirSync(path.join(root, 'tasks', 'Sprints'), { recursive: true });
    writeFileSync(path.join(root, 'tasks', 'Sprints', 'Sprint_93_kickoff_prompt_Task_900_X.md'), kickoff);
  }
  return root;
}
const registry = (over = {}) => ({
  commit: 'c0ffee', fetchedOn: new Date().toISOString(),
  sheets: [{ name: 'Alpha', sha: 'a1', url: 'u/a' }, { name: 'Beta', sha: 'b1', url: 'u/b' }], ...over,
});
const controls = (over = {}) => ({
  sheets: {
    Alpha: { applies: true, triggers: { paths: ['^src/'], words: ['\\bvalidat\\w*'] }, reviewedSha: 'a1', requirements: [{ quote: QA, control: 'src/guard.ts', evidence: 'parseRequest()' }] },
    Beta: { applies: false, why: 'the project writes no log lines at all', reviewedSha: 'b1' },
    ...over,
  },
});
const ids = (f) => f.map((x) => x.id).sort();
const KICK = (owasp, review = '') => `# Task 900 — X\n\n## Goal\nValidate the \`src/a.ts\` input.\n\n## Scope\n- x\n\n## Attack surface\nUnchanged\n\n## OWASP\n${owasp}\n\n## UI\nNo visible change\n\n## Acceptance criteria\n- AC1 x — test: \`src/a.test.ts\`\n\n## Review\n${review}\n`;

test('normalise and quote matching: markdown, links, spacing before punctuation and case are ignored', () => {
  assert.equal(quoteFound(QA, SHEET_A), true);
  assert.equal(quoteFound('validate every request before use, see always', SHEET_A), true);
  assert.equal(quoteFound('The server should validate every request', SHEET_A), false);
  assert.equal(quoteFound(QA, null), null);
  assert.equal(normalise('“Quoted” — **bold** `code` ,'), '"quoted" - bold code,');
  assert.deepEqual(quotesOf('- X: "one two three four five six" and "too short"'), ['one two three four five six']);
});

test('triggers: every-task always, surface-changed only when the surface changes, paths and words otherwise', () => {
  const c = { sheets: { E: { applies: true, always: 'every-task' }, S: { applies: true, always: 'surface-changed' }, P: { applies: true, triggers: { paths: ['^src/'] } }, W: { applies: true, triggers: { words: ['\\bupload\\b'] } }, N: { applies: false } } };
  assert.deepEqual(triggered(c, { text: '', paths: [] }), ['E']);
  assert.deepEqual(triggered(c, { text: 'an Upload form', paths: ['src/x.ts'], surfaceChanged: true }), ['E', 'P', 'S', 'W']);
  assert.equal(surfaceChanged('## Attack surface\nUnchanged — more of the same\n'), false);
  assert.equal(surfaceChanged('## Attack surface\nChanged: a route\n'), true);
  assert.deepEqual(pathsIn('`src/a.ts` `https://x.example/a/b` `@scope/pkg@1.2.3` `docs/env.md:3`'), ['src/a.ts', 'docs/env.md']);
});

test('the mapping check passes a complete, current and true mapping', () => {
  const root = fixture();
  try { assert.deepEqual(checkMapping(registry(), controls(), { root }), []); } finally { rmSync(root, { recursive: true, force: true }); }
});

test('the mapping check fails on each planted defect (O1-O8)', () => {
  const root = fixture({ kickoff: KICK('- Alpha: not applicable — planted kickoff without the handed quote') });
  const run = (reg, ctl) => ids(checkMapping(reg, ctl, { root }));
  try {
    assert.deepEqual(run(null, controls()), ['O1']);
    assert.deepEqual(run(registry({ fetchedOn: '2020-01-01T00:00:00Z' }), controls()), ['O1']);
    // an unchanged upstream read recently (sync --verify writes the marker) keeps an old registry current
    writeFileSync(path.join(root, CACHE, VERIFIED), JSON.stringify({ checkedOn: new Date().toISOString() }));
    assert.deepEqual(run(registry({ fetchedOn: '2020-01-01T00:00:00Z' }), controls()), []);
    rmSync(path.join(root, CACHE, VERIFIED));
    assert.deepEqual(run(registry(), controls({ Beta: undefined })), ['O2']);
    assert.deepEqual(run(registry(), controls({ Gamma: { applies: false, why: 'a sheet that upstream removed long ago' } })), ['O2']);
    assert.deepEqual(run(registry({ sheets: [{ name: 'Alpha', sha: 'a2', url: 'u' }, { name: 'Beta', sha: 'b1', url: 'u' }] }), controls()), ['O3']);
    assert.deepEqual(run(registry(), controls({ Beta: { applies: false, why: 'too short', reviewedSha: 'b1' } })), ['O4']);
    const base = controls().sheets.Alpha;
    assert.deepEqual(run(registry(), controls({ Alpha: { ...base, triggers: {} } })), ['O4']);
    assert.deepEqual(run(registry(), controls({ Alpha: { ...base, requirements: [] } })), ['O5']);
    assert.deepEqual(run(registry(), controls({ Alpha: { ...base, requirements: [{ ...base.requirements[0], quote: 'The server must sanitise every request before use' }] } })), ['O6']);
    assert.deepEqual(run(registry(), controls({ Alpha: { ...base, requirements: [{ ...base.requirements[0], quote: 'validate every request' }] } })), ['O6']);
    assert.deepEqual(run(registry(), controls({ Alpha: { ...base, requirements: [{ ...base.requirements[0], control: 'src/missing.ts' }] } })), ['O7']);
    assert.deepEqual(run(registry(), controls({ Alpha: { ...base, requirements: [{ quote: QA, control: 'src/guard.ts' }] } })), ['O7']);
    assert.deepEqual(run(registry(), controls({ Alpha: { ...base, requirements: [{ ...base.requirements[0], evidence: 'requireStaff()' }] } })), ['O7']);
    assert.deepEqual(run(registry(), controls({ Alpha: { ...base, requirements: [{ quote: QA, task: '901' }] } })), ['O7']);
    assert.deepEqual(run(registry(), controls({ Alpha: { ...base, requirements: [{ quote: QA, task: '900' }] } })), ['O8']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// Owner request 2026-11-07: every session starts held against the current reference (agent-check.mjs start).
test('the session context: upstream re-read after a day, a change or a read failure reported, findings first', () => {
  const root = fixture();
  const save = (rel, v) => { mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); writeFileSync(path.join(root, rel), JSON.stringify(v)); };
  const calls = [];
  const fake = (status, stdout = '') => (r) => { calls.push(r); return { status, stdout, stderr: '' }; };
  try {
    save(CONTROLS, controls());
    save(REGISTRY, registry());
    // read today: no network, the clean state and the commands
    let s = sessionContext({ root, sync: fake(0) });
    assert.equal(calls.length, 0);
    assert.match(s, /2 sheets mapped \(1 apply\)/);
    assert.match(s, /owasp\.mjs plan <kickoff>/);
    assert.match(s, /owasp\.mjs review <kickoff>/);
    // read two days ago: upstream is read again
    const later = Date.now() + 2 * 86_400_000;
    s = sessionContext({ root, now: later, sync: fake(0) });
    assert.equal(calls.length, 1);
    assert.match(s, /upstream read now, unchanged/);
    s = sessionContext({ root, now: later, sync: fake(1, 'changed: Alpha') });
    assert.match(s, /UPSTREAM CHANGED[^\n]*changed: Alpha/);
    s = sessionContext({ root, now: later, sync: () => ({ status: null, error: new Error('getaddrinfo ENOTFOUND'), stdout: '', stderr: '' }) });
    assert.match(s, /could not be read now \(getaddrinfo ENOTFOUND\)/);
    // a drifted mapping leads the context with its findings and the way to fix them
    save(CONTROLS, controls({ Beta: undefined }));
    s = sessionContext({ root, sync: fake(0) });
    assert.match(s.split('\n')[0], /1 finding\(s\) \(O2 1\)/);
    assert.match(s, /O2 Beta sheet not mapped/);
    // a broken file never stops the session: the context says the check could not run
    writeFileSync(path.join(root, CONTROLS), '{ broken');
    assert.match(sessionContext({ root, sync: fake(0) }), /the check could not run/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a requirement handed to a task passes once its kickoff cites the quote', () => {
  const root = fixture({ kickoff: KICK(`- Alpha: "${QA}" — schema first — AC1`) });
  try {
    const ctl = controls({ Alpha: { ...controls().sheets.Alpha, requirements: [{ quote: QA, task: '900' }] } });
    assert.deepEqual(checkMapping(registry(), ctl, { root }), []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('the kickoff check: every required sheet with a verified quote and an existing AC, or a reasoned not-applicable', () => {
  const root = fixture();
  const run = (owasp) => checkKickoff(KICK(owasp), registry(), controls(), { root }).map((f) => f.message);
  try {
    assert.deepEqual(run(`- Alpha: "${QA}" — the schema runs first — AC1`), []);
    assert.deepEqual(run('- Alpha: not applicable — the task reads no request at all'), []);
    assert.match(checkKickoff(KICK('').replace('## OWASP\n', ''), registry(), controls(), { root })[0].message, /missing section "## OWASP"/);
    assert.match(run('- Beta: not applicable — the task writes no log lines').join(), /required sheet Alpha is missing/);
    assert.match(run('- Alpha: "The server must sanitise every request before use" — x — AC1').join(), /quote not found/);
    assert.match(run(`- Alpha: "${QA}" — x — AC7`).join(), /AC7 is not an acceptance criterion/);
    assert.match(run(`- Alpha: "${QA}" — the schema runs first`).join(), /names no acceptance criterion/);
    assert.match(run('- Alpha: not applicable — no').join(), /at least five words/);
    assert.match(run('- Alpha: the server validates — AC1').join(), /no quote/);
    assert.match(run('- Alpha: not applicable — the task reads no request at all\n- Nope: not applicable — a sheet that does not exist').join(), /Nope is not a sheet/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('the review check: needed once a verdict is written; a verdict per sheet; "met" carries a verified quote and evidence', () => {
  const root = fixture();
  const owasp = `- Alpha: "${QA}" — x — AC1`;
  const body = (review) => `# Task 900 — Outcome\n\n${KICK(owasp, review)}`;
  const rec = (sheets, task = '900') => ({ task, sheets });
  const run = (review, record = null, extra = []) => checkReview(body(review), registry(), controls(), extra, { root, record }).map((f) => f.message);
  const met = { verdict: 'met', quotes: [QA], evidence: '`src/a.test.ts` passes' };
  try {
    assert.deepEqual(run('Not reviewed yet.'), []);
    assert.match(run('**APPROVED**').join(), /no record docs\/security\/owasp\/reviews\/Task_900\.json/);
    assert.deepEqual(run('**APPROVED**', rec({ Alpha: met })), []);
    assert.match(run('**APPROVED**', { unreadable: true }).join(), /not valid JSON/);
    assert.match(run('**APPROVED**', rec({ Alpha: met }, '901')).join(), /record is for Task 901/);
    assert.match(run('**APPROVED**', rec({ Beta: { verdict: 'not applicable', reason: 'the diff writes no log line' } })).join(), /no verdict for Alpha/);
    assert.match(run('**APPROVED**', rec({ Alpha: { ...met, evidence: 'looked fine' } })).join(), /needs its evidence/);
    assert.match(run('**APPROVED**', rec({ Alpha: { ...met, quotes: [] } })).join(), /needs the quote/);
    assert.match(run('**APPROVED**', rec({ Alpha: { ...met, quotes: ['this sentence is not in the sheet'] } })).join(), /quote not found/);
    assert.match(run('**APPROVED**', rec({ Alpha: { verdict: 'fine' } })).join(), /verdict must be/);
    assert.match(run('**APPROVED**', rec({ Alpha: { ...met, reason: 'also a reason' } })).join(), /field "reason" does not belong/);
    assert.match(run('**APPROVED**', rec({ Alpha: { verdict: 'not applicable', reason: 'no' } })).join(), /at least five words/);
    assert.match(run('**APPROVED**', rec({ Alpha: met, Nope: met })).join(), /Nope is not a sheet/);
    assert.match(run('**NEEDS REVISION**', rec({ Alpha: { verdict: 'finding', finding: 'one' } })).join(), /names its number/);
    assert.match(run('**NEEDS REVISION**', rec({ Alpha: { verdict: 'finding', finding: 'F1' } })).join(), /F1 is not in the findings/);
    assert.deepEqual(run('**NEEDS REVISION**\n\nF1 — no schema\n', rec({ Alpha: { verdict: 'finding', finding: 'F1', note: 'no schema' } })), []);
    assert.match(run('**NEEDS REVISION**\n\nF1 — no schema\n', rec({ Alpha: { verdict: 'finding', finding: 'F1' } }), ['Beta']).join(), /no verdict for Beta \(triggered by the diff\)/);
    assert.match(run('**APPROVED**\n\n### OWASP check\n- Alpha: met', rec({ Alpha: met })).join(), /no longer belongs in the kickoff/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a review record is found by the task number of its kickoff', () => {
  const root = fixture();
  const file = 'tasks/Sprints/Sprint_93_kickoff_prompt_Task_900_X.md';
  try {
    assert.equal(readReviewRecord(file, root), null);
    assert.equal(readReviewRecord('tasks/Sprints/other.md', root), null);
    mkdirSync(path.join(root, REVIEWS), { recursive: true });
    writeFileSync(path.join(root, REVIEWS, 'Task_900.json'), '{ "task": "900", "sheets": {} }');
    assert.deepEqual(readReviewRecord(file, root), { task: '900', sheets: {} });
    writeFileSync(path.join(root, REVIEWS, 'Task_900.json'), '{ broken');
    assert.deepEqual(readReviewRecord(file, root), { unreadable: true });
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// Owner request 2026-11-07: the mechanism holds every task, the existing ones and every one created later.
test('O9: every file but documentation is covered by a sheet, so a task touching it is held to that sheet', () => {
  const root = fixture();
  try {
    const files = ['src/guard.ts', 'docs/a.md', 'tasks/Sprints/x.md', 'README.md', 'LICENSE', 'styles/new.css'];
    const f = checkMapping(registry(), controls(), { root, files });
    assert.deepEqual(f.map((x) => `${x.id} ${x.at}`), ['O9 styles/new.css']);
    assert.deepEqual(uncovered(controls(), files), ['styles/new.css']);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('the task gate: code lands only with an approved task whose reviews cover every sheet the diff triggers', () => {
  const root = fixture();
  const record = { task: '900', sheets: { Alpha: { verdict: 'met', quotes: [QA], evidence: '`src/guard.ts` parseRequest()' } } };
  const head = '# Task 900 — Outcome\n\n';
  const approved = head + KICK(`- Alpha: "${QA}" — schema — AC1`, 'Verdict: APPROVED');
  const file = 'tasks/Sprints/Sprint_93_kickoff_prompt_Task_900_X.md';
  const gate = (over) => ids(checkGate({ files: ['src/a.ts'], added: '', kickoffs: [], registry: registry(), controls: controls(), root, ...over }));
  try {
    assert.deepEqual(gate({ files: ['docs/a.md', 'tasks/Sprints/y.md'] }), [], 'documentation alone needs no task');
    assert.deepEqual(gate({}), ['G1'], 'code without any task');
    assert.deepEqual(gate({ kickoffs: [{ file, body: KICK(`- Alpha: "${QA}" — schema — AC1`, 'Verdict: NEEDS REVISION') }] }), ['G1'], 'a task not approved');
    assert.deepEqual(gate({ kickoffs: [{ file, body: head + KICK(`- Alpha: "${QA}" — schema — AC1`, 'Review 1: NEEDS REVISION\n\nReview 2: APPROVED'), record }] }), [], 'the last verdict counts');
    assert.deepEqual(gate({ kickoffs: [{ file, body: approved, record }] }), []);
    assert.deepEqual(gate({ kickoffs: [{ file, body: approved }] }), ['G2', 'G3'], 'an approved review without its record');
    // the diff triggers Alpha by its path; an approved review that never judged Alpha does not cover it
    const other = head + KICK('- Alpha: not applicable — this task changes only the documentation pages', 'Verdict: APPROVED');
    assert.deepEqual(gate({ kickoffs: [{ file, body: other, record: { task: '900', sheets: { Alpha: { verdict: 'not applicable', reason: 'this task changes only the documentation pages' } } } }] }), []);
    assert.deepEqual(gate({ kickoffs: [{ file, body: head + KICK('', 'Verdict: APPROVED'), record: { task: '900', sheets: {} } }] }), ['G3']);
    assert.deepEqual(gate({ dependencyOnly: true }), [], 'a version-only dependency update is held by the dependency gates');
    assert.equal(lastVerdict('## Review\nReview 1: APPROVED\nReview 2: NEEDS REVISION\n'), 'NEEDS REVISION');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a dependency update is version-only when nothing but versions and full-SHA action pins change', () => {
  const pkg = (deps, scripts = {}) => JSON.stringify({ name: 'x', scripts, dependencies: deps });
  const at = { base: pkg({ a: '1.0.0' }), HEAD: pkg({ a: '1.0.1' }) };
  const show = (ref, f) => (f === 'package.json' ? at[ref === 'HEAD' ? 'HEAD' : 'base'] : '');
  const sha = 'a'.repeat(40);
  assert.equal(isDependencyOnly(['package.json', 'package-lock.json'], {}, show, 'base'), true);
  assert.equal(isDependencyOnly(['.github/workflows/ci.yml'], { '.github/workflows/ci.yml': [`      - uses: actions/checkout@${sha} # v5`, `      - uses: actions/checkout@${'b'.repeat(40)}`] }, show, 'base'), true);
  assert.equal(isDependencyOnly(['.github/workflows/ci.yml'], { '.github/workflows/ci.yml': ['        run: curl x | sh'] }, show, 'base'), false, 'a workflow step is code');
  assert.equal(isDependencyOnly(['.github/workflows/ci.yml'], { '.github/workflows/ci.yml': ['      - uses: actions/checkout@v5'] }, show, 'base'), false, 'a tag pin is not a full SHA');
  at.HEAD = pkg({ a: '1.0.1' }, { postinstall: 'node x' });
  assert.equal(isDependencyOnly(['package.json'], {}, show, 'base'), false, 'a new script is code');
  assert.equal(isDependencyOnly(['package-lock.json', 'src/a.ts'], {}, show, 'base'), false);
});

test('the grandfathered kickoffs only shrink: no kickoff written after the gate escapes it', () => {
  for (const n of OWASP_GRANDFATHERED) assert.ok(['947'].includes(n), `Task ${n} was added to OWASP_GRANDFATHERED; write its "## OWASP" section instead`);
});

test('the plan lists each required sheet with its trigger and marks requirements handed to the task', () => {
  const ctl = controls({ Alpha: { ...controls().sheets.Alpha, requirements: [{ quote: QA, task: '900' }] } });
  const plan = kickoffPlan(KICK(''), ctl, '900');
  assert.match(plan, /- Alpha: .*required by path src\/a\.ts/);
  assert.match(plan, /HANDED TO THIS TASK/);
  assert.deepEqual(diffRegistry(registry(), registry({ sheets: [{ name: 'Alpha', sha: 'a2' }, { name: 'Gamma', sha: 'g' }] })), { added: ['Gamma'], removed: ['Beta'], changed: ['Alpha'] });
});

test('the repository: every sheet mapped at its current version, every quote and every evidence verified', (t) => {
  if (!existsSync(path.join(ROOT, CACHE))) {
    if (process.env.CI) assert.fail(`${CACHE} is missing in CI: the workflow must run "node scripts/quality/owasp.mjs sync --verify" before the tests`);
    t.skip(`${CACHE} not present: run node scripts/quality/owasp.mjs sync`);
    return;
  }
  const reg = loadJson(REGISTRY);
  const ctl = loadJson(CONTROLS);
  const age = (Date.now() - Date.parse(reg.fetchedOn)) / 86_400_000;
  const findings = checkMapping(reg, ctl).filter((f) => !(f.id === 'O1' && age > 7 && !process.env.CI));
  assert.deepEqual(findings, []);
  // sensitivity on the real data: one altered quote and one removed evidence are caught by the same function
  const [name, sheet] = Object.entries(ctl.sheets).find(([, c]) => c.requirements?.some((r) => r.control));
  const r0 = sheet.requirements.find((r) => r.control);
  const broken = { sheets: { ...ctl.sheets, [name]: { ...sheet, requirements: [{ ...r0, quote: `${r0.quote} planted-word`, evidence: 'planted evidence that is nowhere' }] } } };
  assert.deepEqual([...new Set(ids(checkMapping({ ...reg, fetchedOn: new Date().toISOString() }, broken)))], ['O6', 'O7']);
});

// Task 963 AC10: the cache keeps only what upstream holds at the registry's commit.
const GOOD = Buffer.from('# Alpha\n\nThe server must validate every request before use.\n');
const cacheRegistry = (over = {}) => ({ commit: 'a'.repeat(40), sheets: [{ name: 'Alpha', file: 'Alpha_Cheat_Sheet.md', sha: gitBlobSha(GOOD) }], ...over });
const answering = (bytes) => { const calls = []; return { calls, get: async (url) => { calls.push(url); return new Response(bytes); } }; };

test('gitBlobSha is the Git object id the GitHub contents API gives (blob of "hello\n")', () => {
  assert.equal(gitBlobSha(Buffer.from('hello\n')), 'ce013625030ba8dba906f756967f9e9ca394464a');
});

test('cache: a download whose blob SHA differs from the registry is refused and not written', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'owasp-cache-'));
  const { get } = answering(Buffer.from('# Alpha\n\nplanted text\n'));
  await assert.rejects(refreshCache(cacheRegistry(), root, get), /does not match the registry/);
  assert.equal(existsSync(path.join(root, CACHE, 'Alpha.md')), false);
  rmSync(root, { recursive: true, force: true });
});

test('cache: a matching download is written once; a cached text that drifted is downloaded again', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'owasp-cache-'));
  const first = answering(GOOD);
  assert.equal(await refreshCache(cacheRegistry(), root, first.get), 1);
  assert.deepEqual(first.calls, [`https://raw.githubusercontent.com/OWASP/CheatSheetSeries/${'a'.repeat(40)}/cheatsheets/Alpha_Cheat_Sheet.md`]);
  assert.equal(sheetText('Alpha', root), GOOD.toString('utf8'));
  const again = answering(GOOD);
  assert.equal(await refreshCache(cacheRegistry(), root, again.get), 0);
  writeFileSync(path.join(root, CACHE, 'Alpha.md'), 'drifted');
  const third = answering(GOOD);
  assert.equal(await refreshCache(cacheRegistry(), root, third.get), 1);
  assert.equal(sheetText('Alpha', root), GOOD.toString('utf8'));
  rmSync(root, { recursive: true, force: true });
});

test('cache: a commit, sheet name, file name or blob id of another shape is refused before any request', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'owasp-cache-'));
  const sheet = cacheRegistry().sheets[0];
  for (const reg of [
    cacheRegistry({ commit: 'c0ffee' }),
    cacheRegistry({ commit: `${'a'.repeat(40)}/../evil` }),
    cacheRegistry({ sheets: [{ ...sheet, file: '../../evil.md' }] }),
    cacheRegistry({ sheets: [{ ...sheet, file: 'Alpha.md?x=1' }] }),
    cacheRegistry({ sheets: [{ ...sheet, name: '../Alpha' }] }),
    cacheRegistry({ sheets: [{ ...sheet, sha: 'not-a-sha' }] }),
  ]) {
    const { calls, get } = answering(GOOD);
    await assert.rejects(refreshCache(reg, root, get), /refused/);
    assert.deepEqual(calls, []);
  }
  rmSync(root, { recursive: true, force: true });
});
