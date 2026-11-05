// Task 942 revision 7, prototype of owner decision D30: a `dependency` rebase entry for a dependency update. The gate files are copied to an ignored folder and patched there;
// nothing under scripts/ changes. Fixtures are temporary folders. Run from the repository root. The real change is the implementer's, against the code as Task 945 leaves it.
import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT = resolve('test-results/task942-proto/workflow-gates');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync('scripts/workflow-gates', OUT, { recursive: true });
const patch = (file, swaps) => {
  let text = readFileSync(join(OUT, file), 'utf8');
  for (const [from, to] of swaps) { if (text.split(from).length !== 2) throw new Error(`${file}: not once: ${from.slice(0, 70)}`); text = text.replace(from, () => to); }
  writeFileSync(join(OUT, file), text);
};
patch('contract.mjs', [
  ["export const testsRebaseFiles = text => evidenceList(text, 'Changed case test files');",
    "export const testsRebaseFiles = text => evidenceList(text, 'Changed case test files');\nexport const dependencyRebaseFiles = text => evidenceList(text, 'Changed dependency files');\nconst DEPENDENCY_FILES = ['package.json', 'package-lock.json'];"],
  ["if (!['rules', 'scope', 'tests'].includes(entry.kind))", "if (!['rules', 'scope', 'tests', 'dependency'].includes(entry.kind))"],
  ['// Task 940 R1 (c): entry 1 starts at the reviewed digest',
    `export function dependencyEntryErrors(root, contract, entry) {
  const errors = [];
  const check = (ok, message) => { if (!ok) errors.push(message); };
  const listed = rebaseEvidence(root, entry, errors, dependencyRebaseFiles);
  check(listed.length > 0, 'evidence lists no changed dependency files');
  for (const file of listed) check(DEPENDENCY_FILES.includes(file), \`\${file} is not a dependency file; other runtime files are never rebased\`);
  try {
    const by = readContractFile(root, entry.by);
    check(by.task !== contract.task, \`\${entry.by} is the rebased contract itself\`);
    check(by.kind === 'product' && by.stage === 'reviewed', \`\${entry.by} is not a reviewed product contract\`);
    for (const file of listed) check(Array.isArray(by.scope) && by.scope.includes(file), \`\${file} is outside the scope of \${entry.by}\`);
  } catch (error) { errors.push(\`approving contract unavailable (\${error.message})\`); }
  return errors;
}
// Task 940 R1 (c): entry 1 starts at the reviewed digest`],
  ['problems.push(...({ rules: rulesEntryErrors, scope: scopeEntryErrors, tests: testsEntryErrors }[kind])(root, contract, entry));',
    'problems.push(...({ rules: rulesEntryErrors, scope: scopeEntryErrors, tests: testsEntryErrors, dependency: dependencyEntryErrors }[kind])(root, contract, entry));'],
  ['export function validateContract(root, value, { phase = \'plan\' } = {}) {',
    `// D30: a report must have run on the updated dependencies: at the digest of the last dependency entry or a later one of the chain.
export function reportHashErrors(root, contract, recorded, stale) {
  const { entries } = rebaseChain(contract);
  const last = entries.map(row => row.kind).lastIndexOf('dependency');
  if (last < 0) return scopeHashErrors(root, contract, recorded, stale);
  const problems = rebaseChainErrors(root, contract, scopeDigest(root, contract));
  if (problems.length) return [stale, ...problems];
  return entries.slice(last).some(row => row.entry.rebasedScopeSha256 === recorded) ? [] : [stale, 'rebases: the cases did not run on the updated dependencies'];
}

export function validateContract(root, value, { phase = 'plan' } = {}) {`],
  ["errors.push(...scopeHashErrors(root, contract, report.scopeSha256, 'Security report scope hash is stale'));", "errors.push(...reportHashErrors(root, contract, report.scopeSha256, 'Security report scope hash is stale'));"],
  ["errors.push(...scopeHashErrors(root, contract, report.scopeSha256, 'Governance report scope hash is stale'));", "errors.push(...reportHashErrors(root, contract, report.scopeSha256, 'Governance report scope hash is stale'));"],
]);
patch('cli.mjs', [
  ['rebaseFiles, scopeRebaseFiles, testsRebaseFiles, rebaseChain, scopeHashErrors,', 'rebaseFiles, scopeRebaseFiles, testsRebaseFiles, dependencyRebaseFiles, rebaseChain, scopeHashErrors, reportHashErrors,'],
  ['const list = { rules: rebaseFiles, scope: scopeRebaseFiles, tests: testsRebaseFiles }[kind];', 'const list = { rules: rebaseFiles, scope: scopeRebaseFiles, tests: testsRebaseFiles, dependency: dependencyRebaseFiles }[kind];'],
  ['  for (const { entry, label, legacy } of fresh) {\n    const owner =',
    `  if (fresh.some(row => row.kind === 'dependency')) {
    const fields = text => { const value = JSON.parse(text ?? '{}'); for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) delete value[key]; return canonicalJson(value); };
    try { if (fields(readBase('package.json')) !== fields(readFileSync(safePath(root, 'package.json'), 'utf8'))) errors.push('rebases: a dependency entry covers dependency versions only; another field of package.json changed'); }
    catch (error) { errors.push(\`rebases: package.json unavailable (\${error.message})\`); }
  }
  for (const { entry, label, legacy } of fresh) {
    const owner =`],
  ["errors.push(...scopeHashErrors(root, contract, report?.scopeSha256, 'Security report scope hash is stale')", "errors.push(...reportHashErrors(root, contract, report?.scopeSha256, 'Security report scope hash is stale')"],
]);
const load = dir => Promise.all([import(pathToFileURL(join(dir, 'contract.mjs')).href), import(pathToFileURL(join(dir, 'cli.mjs')).href)]);
const [P, PC] = await load(OUT);
const [R, RC] = await load(resolve('scripts/workflow-gates'));

// Fixtures: one reviewed contract, a later reviewed product contract that scopes the dependency files.
const put = (root, file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
const saveJson = (root, file, value) => put(root, file, `${JSON.stringify(value, null, 2)}\n`);
const git = (root, ...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
const A = 'tasks/a_kickoff.security.json', L = 'tasks/later_kickoff.security.json', EV = 'docs/sessions/evidence/a/dependency.md', LOCK = 'package-lock.json', PKG = 'package.json';
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'dependency-rebase-'));
  for (const file of new Set([...P.REQUIRED_GOVERNANCE_RULES, ...P.REQUIRED_PRODUCT_RULES, ...['workflow-contract', 'workflow-evidence', 'workflow-ci', 'git-publication'].map(n => `.claude/rules/shared/${n}.md`)])) put(root, file, file.endsWith('workflow-gates.md') ? '# Gates\n\n## Required companions\nx\n' : `Rule ${file}.\n`);
  put(root, PKG, '{ "name": "fixture", "scripts": { "build": "x" }, "dependencies": { "next": "1.0.0" } }\n');
  put(root, LOCK, '{ "lockfileVersion": 2, "packages": { "node_modules/next": { "version": "1.0.0" } } }\n');
  put(root, 'tsconfig.json', '{}\n');
  put(root, '.nvmrc', '22\n');
  const make = (name, scope) => {
    const task = `tasks/${name}_kickoff.md`;
    put(root, task, `## Security test contract\n${name}\n`);
    put(root, `src/${name}.test.ts`, `// ${['F', 'S'].flatMap(l => ['ALLOW', 'DENY', 'ERROR'].map(o => `[SEC-${name.toUpperCase()}-${l}-${o}] x`)).join(' ')}\n`);
    put(root, `src/${name}.ts`, `export const x = '${name}';\n`);
    const cases = ['frontend', 'server'].flatMap(layer => ['allow', 'deny', 'error'].map(outcome => ({ id: `SEC-${name.toUpperCase()}-${layer[0].toUpperCase()}-${outcome.toUpperCase()}`, layer, outcome, boundary: 'unit', critical: false, invariant: 'Only the owner may update their display name', actor: 'Synthetic account', resource: 'Synthetic profile', input: 'Synthetic display name', response: 'Synthetic profile response', forbiddenEffects: ['No foreign profile update'], testFile: `src/${name}.test.ts`, testName: `[SEC-${name.toUpperCase()}-${layer[0].toUpperCase()}-${outcome.toUpperCase()}] x` })));
    return { version: 1, stage: 'reviewed', kind: 'product', qaProfile: 'Q2', task, taskSha256: P.digest(root, [task]), scope: [`src/${name}.ts`, `src/${name}.test.ts`, ...scope], rules: [...P.REQUIRED_PRODUCT_RULES], cases, report: `docs/sessions/evidence/${name}/report.json` };
  };
  const signed = (path, c) => {
    report(root, c);
    put(root, `docs/sessions/evidence/${path}/review.md`, 'review\n');
    c.review = { role: 'Opus', decision: 'APPROVED', evidence: `docs/sessions/evidence/${path}/review.md`, evidenceSha256: P.digest(root, [`docs/sessions/evidence/${path}/review.md`]), scopeSha256: P.scopeDigest(root, c), reportSha256: P.digest(root, [c.report]) };
    return c;
  };
  const a = signed('a', make('a', [])), later = signed('later', make('later', [PKG, LOCK]));
  saveJson(root, A, a); saveJson(root, L, later);
  git(root, 'init', '-q'); git(root, 'add', '.'); git(root, '-c', 'user.name=x', '-c', 'user.email=x@x', 'commit', '-qm', 'base');
  const base = git(root, 'rev-parse', 'HEAD').stdout.trim();
  return { root, a, later, base };
}
function report(root, c) {
  saveJson(root, c.report, { version: 1, status: 'passed', errors: [], vulnerabilities: [], cleanup: { verified: true, remaining: 0, errors: [] }, contractSha256: P.planDigest(root, c), scopeSha256: P.scopeDigest(root, c), cases: c.cases.map(row => ({ id: row.id, status: 'passed', assertionCount: 1 })) });
}
const updateLock = root => put(root, LOCK, '{ "lockfileVersion": 2, "packages": { "node_modules/next": { "version": "2.0.0" } } }\n');
const updatePkg = root => put(root, PKG, '{ "name": "fixture", "scripts": { "build": "x" }, "dependencies": { "next": "2.0.0" } }\n');
function dependencyEntry(root, a, { listed = [PKG, LOCK], by = L, kind = 'dependency', heading = 'Changed dependency files' } = {}) {
  put(root, EV, `# Dependency update\n\n## ${heading}\n${listed.map(file => `- \`${file}\``).join('\n')}\n`);
  const previous = a.review.rebases?.at(-1)?.rebasedScopeSha256 ?? a.review.scopeSha256;
  a.review.rebases = [...(a.review.rebases ?? []), { kind, by, evidence: EV, evidenceSha256: P.digest(root, [EV]), originalScopeSha256: previous, rebasedScopeSha256: P.scopeDigest(root, a) }];
}
function refreshLater(root, later) { later.review.scopeSha256 = P.scopeDigest(root, later); report(root, later); later.review.reportSha256 = P.digest(root, [later.report]); saveJson(root, L, later); }
const seal = (root, a) => { a.review.reportSha256 = P.digest(root, [a.report]); saveJson(root, A, a); };
const verdict = (root, base, a, files = [PKG, LOCK, A, L, EV, a.report]) => {
  const release = P.validateContract(root, a, { phase: 'release' });
  const reportErrors = P.validateReport(root, a, JSON.parse(readFileSync(join(root, a.report), 'utf8')));
  const diff = PC.validateDiff(root, files, { phase: 'release', base, readBase: PC.gitBaseReader(root, base) }).errors.filter(e => e.startsWith(A));
  return [...new Set([...release, ...reportErrors, ...diff.map(e => e.slice(A.length + 2))])];
};
const results = [];
const scenario = (name, expected, build) => {
  const f = fixture();
  let errors;
  try { errors = build(f); } catch (error) { errors = [`THREW ${error.message}`]; }
  rmSync(f.root, { recursive: true, force: true, maxRetries: 3 });
  const good = expected === 'pass' ? errors.length === 0 : errors.some(e => e.includes(expected));
  results.push(good);
  console.log(`${good ? 'OK' : 'WRONG'}: ${name}; ${errors.length ? errors[0].slice(0, 130) : 'no error'}`);
};
const update = ({ root, later }) => { updatePkg(root); updateLock(root); refreshLater(root, later); };
scenario('no entry: an updated lock file stays stale', 'stale', f => { update(f); return verdict(f.root, f.base, f.a); });
scenario('entry, cases rerun on the update: valid', 'pass', f => { update(f); dependencyEntry(f.root, f.a); report(f.root, f.a); seal(f.root, f.a); return verdict(f.root, f.base, f.a); });
scenario('entry, cases not rerun: refused', 'did not run on the updated dependencies', f => { update(f); dependencyEntry(f.root, f.a); seal(f.root, f.a); return verdict(f.root, f.base, f.a); });
scenario('lock file only, cases rerun: valid', 'pass', f => { updateLock(f.root); refreshLater(f.root, f.later); dependencyEntry(f.root, f.a, { listed: [LOCK] }); report(f.root, f.a); seal(f.root, f.a); return verdict(f.root, f.base, f.a); });
for (const file of ['tsconfig.json', '.nvmrc']) scenario(`${file} listed: refused`, 'is not a dependency file', f => { put(f.root, file, 'changed\n'); refreshLater(f.root, f.later); dependencyEntry(f.root, f.a, { listed: [file] }); report(f.root, f.a); seal(f.root, f.a); return verdict(f.root, f.base, f.a); });
scenario('a script of package.json changed: refused', 'dependency versions only', f => { put(f.root, PKG, '{ "name": "fixture", "scripts": { "build": "curl evil" }, "dependencies": { "next": "2.0.0" } }\n'); updateLock(f.root); refreshLater(f.root, f.later); dependencyEntry(f.root, f.a); report(f.root, f.a); seal(f.root, f.a); return verdict(f.root, f.base, f.a); });
scenario('npm overrides added: refused', 'dependency versions only', f => { put(f.root, PKG, '{ "name": "fixture", "scripts": { "build": "x" }, "overrides": { "next": "9" }, "dependencies": { "next": "2.0.0" } }\n'); refreshLater(f.root, f.later); dependencyEntry(f.root, f.a); report(f.root, f.a); seal(f.root, f.a); return verdict(f.root, f.base, f.a); });
scenario('another file changed under the entry: refused', 'files other than the listed files', f => { update(f); put(f.root, 'src/a.ts', 'export const x = 1;\n'); dependencyEntry(f.root, f.a); report(f.root, f.a); seal(f.root, f.a); return verdict(f.root, f.base, f.a); });
scenario('an approver that is not reviewed: refused', 'not a reviewed product contract', f => { update(f); f.later.stage = 'implemented'; saveJson(f.root, L, f.later); dependencyEntry(f.root, f.a); report(f.root, f.a); seal(f.root, f.a); return verdict(f.root, f.base, f.a); });
scenario('an approver without the files in scope: refused', 'outside the scope', f => { update(f); f.later.scope = f.later.scope.filter(s => s !== LOCK); saveJson(f.root, L, f.later); dependencyEntry(f.root, f.a); report(f.root, f.a); seal(f.root, f.a); return verdict(f.root, f.base, f.a); });
scenario('the contract approving itself: refused', 'the rebased contract itself', f => { update(f); f.a.scope.push(PKG, LOCK); dependencyEntry(f.root, f.a, { by: A }); report(f.root, f.a); seal(f.root, f.a); return verdict(f.root, f.base, f.a); });
scenario('a scope entry cannot carry a dependency file, as today', 'runtime files are never rebased', f => { update(f); dependencyEntry(f.root, f.a, { kind: 'scope', heading: 'Changed scope files' }); report(f.root, f.a); seal(f.root, f.a); return verdict(f.root, f.base, f.a); });
scenario('a later scope entry keeps a report of the dependency digest', 'pass', f => {
  update(f); dependencyEntry(f.root, f.a); report(f.root, f.a); seal(f.root, f.a);
  put(f.root, 'src/a.ts', 'export const x = 2;\n'); f.later.scope.push('src/a.ts'); refreshLater(f.root, f.later);
  const first = f.a.review.rebases[0].evidence;
  put(f.root, 'docs/sessions/evidence/a/scope.md', '# s\n\n## Changed scope files\n- `src/a.ts`\n');
  f.a.review.rebases.push({ kind: 'scope', by: L, evidence: 'docs/sessions/evidence/a/scope.md', evidenceSha256: P.digest(f.root, ['docs/sessions/evidence/a/scope.md']), originalScopeSha256: f.a.review.rebases[0].rebasedScopeSha256, rebasedScopeSha256: P.scopeDigest(f.root, f.a) });
  saveJson(f.root, A, f.a);
  return [...P.validateContract(f.root, f.a, { phase: 'release' }), ...P.validateReport(f.root, f.a, JSON.parse(readFileSync(join(f.root, f.a.report), 'utf8'))), ...(first ? [] : ['no first'])];
});
console.log(`scenarios ${results.length}; as expected ${results.filter(Boolean).length}`);

// Old against new on the real tree, every contract and every report.
const contracts = ['tasks/Archive', 'tasks/Sprints'].flatMap(dir => readdirSync(dir).filter(f => f.endsWith('.security.json')).map(f => `${dir}/${f}`));
let same = 0, different = 0;
for (const path of contracts) {
  const c = JSON.parse(readFileSync(path, 'utf8'));
  const run = (mod, cli) => JSON.stringify([mod.validateContract(process.cwd(), c, { phase: 'plan' }), c.stage === 'reviewed' ? mod.validateContract(process.cwd(), c, { phase: 'release' }) : [], c.stage === 'reviewed' ? cli.reviewedFreshnessErrors(process.cwd(), contracts.filter(p => p !== path)) : []]);
  if (run(P, PC) === run(R, RC)) same += 1; else { different += 1; console.log(`DIFFERENT ${path}`); }
}
console.log(`real contracts ${contracts.length}: same result old and new ${same}, different ${different}`);

// Each selftest that holds rebases, run against the patched copy.
for (const file of readdirSync(OUT).filter(f => /rebase|contract|governance/i.test(f) && f.endsWith('.selftest.mjs'))) {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', join(OUT, file)], { encoding: 'utf8', maxBuffer: 1 << 27, timeout: 280000 });
  const count = key => (new RegExp(`^# ${key} (\\d+)`, 'm').exec(r.stdout) ?? [])[1];
  console.log(`patched ${file}: exit ${r.status}; pass ${count('pass')}, fail ${count('fail')}`);
}
copyFileSync(join(OUT, 'contract.mjs'), resolve('test-results/task942-proto/contract.patched.mjs'));
