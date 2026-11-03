#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve, relative, posix } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateContract, validateReport, validateGovernanceReport, requiredResults, safePath, digest, planDigest, scopeDigest,
  isProductPath, isTaskDocument, isExecutablePolicyPath, rebaseFiles, scopeRebaseFiles, testsRebaseFiles, rebaseChain, scopeHashErrors,
  isEvidencePath } from './contract.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
export function readJson(root, file) {
  const target = safePath(root, file);
  try { return JSON.parse(readFileSync(target, 'utf8')); }
  catch { throw new Error(`Malformed or unreadable JSON: ${file}`); }
}
export function validateReceipt(root, contract) {
  const archived = /^tasks\/Archive\//i.test(contract?.task || '');
  const errors = validateContract(root, contract, { phase: archived ? 'release' : 'plan' });
  if (archived) {
    if (contract?.stage !== 'reviewed') errors.push('An archived closure receipt requires reviewed stage');
    if (contract?.kind === 'product') {
      try { errors.push(...validateReport(root, contract, readJson(root, contract.report))); }
      catch (error) { errors.push(error.message); }
    }
    if (contract?.kind === 'governance') {
      try { errors.push(...validateGovernanceReport(root, contract, readJson(root, contract.report))); }
      catch (error) { errors.push(error.message); }
    }
  }
  return errors;
}
export function allContracts(root) {
  function walk(dir) {
    if (!existsSync(join(root, dir))) return [];
    return readdirSync(join(root, dir), { withFileTypes: true }).flatMap(e => e.isDirectory()
      ? walk(`${dir}/${e.name}`) : e.name.endsWith('.security.json') ? [`${dir}/${e.name}`] : []);
  }
  return walk('tasks');
}
export function changedFiles(root, { base, head = 'HEAD', working = false }) {
  if (!base || !/^[a-f0-9]{40}$/i.test(base) || /^0+$/.test(base)) throw new Error('A full, available nonzero base SHA is required');
  if (!/^(?:HEAD|[a-f0-9]{40})$/i.test(head)) throw new Error('Head must be HEAD or a full commit SHA');
  const git = args => execFileSync('git', ['--no-optional-locks', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  git(['cat-file', '-e', `${base}^{commit}`]);
  // Treat renames as removal plus addition so a move out of src cannot hide a product deletion.
  const files = git(['diff', '--no-renames', '--name-only', '-z', ...(working ? [base] : [base, head]), '--']).split('\0').filter(Boolean);
  if (working) files.push(...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean));
  return [...new Set(files)];
}
// Read-only `git show <base>:<file>`; null when the file did not exist at the base.
export function gitBaseReader(root, base) {
  return file => {
    try { return execFileSync('git', ['--no-optional-locks', 'show', `${base}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); }
    catch { return null; }
  };
}
const canonicalJson = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : v);
// Task 935 R10(c) / Task 940 R4: the rebase chain at the diff base must be a prefix of the current chain. The entries
// after it are new: the base contents of every file they list must reproduce the last digest of the base chain (the
// reviewed digest when it is empty), and each approving contract must be part of this diff and validate. Any other
// changed digest input (scope, inputs, case tests, runtime) stays stale. A retained chain adds nothing here; the
// file-level chain check still compares its last digest with the current scope.
export function diffRebaseErrors(root, path, contract, { readBase, selected, issuesByPath, phase }) {
  const { entries } = rebaseChain(contract);
  if (!entries.length) return [];
  if (typeof readBase !== 'function') {
    return [entries[0].legacy ? 'rulesRebase: the diff base is required to verify a rule-only rebase' : 'rebases: the diff base is required to verify a rebase'];
  }
  let previous = null;
  try { previous = JSON.parse(readBase(path) ?? 'null'); } catch { previous = null; }
  // R4 (e): a review written inside this diff (absent or different at the base) has no base anchor; (c) still applies.
  const reviewedAtBase = Boolean(previous?.review?.scopeSha256) && previous.review.scopeSha256 === contract.review?.scopeSha256;
  const base = reviewedAtBase ? rebaseChain(previous).entries : [];
  const same = (a, b) => a.legacy === b.legacy && canonicalJson(a.entry) === canonicalJson(b.entry);
  let first = 0;
  while (first < base.length && first < entries.length && same(base[first], entries[first])) first += 1;
  const errors = base.slice(first).map((entry, i) => `${entry.label}: the entry recorded at the diff base was ${first + i < entries.length ? 'edited or replaced' : 'removed'}`);
  const fresh = entries.slice(first);
  if (!fresh.length) return errors;
  if (reviewedAtBase) {
    const listed = new Set();
    for (const { kind, entry, label } of fresh) {
      const list = { rules: rebaseFiles, scope: scopeRebaseFiles, tests: testsRebaseFiles }[kind];
      try { for (const file of list(readFileSync(safePath(root, entry.evidence), 'utf8'))) listed.add(file); }
      catch (error) { errors.push(`${label}: evidence unavailable (${error.message})`); }
    }
    const anchor = first === 0 ? previous.review.scopeSha256 : base[first - 1].entry.rebasedScopeSha256;
    if (scopeDigest(root, contract, new Map([...listed].map(file => [file, readBase(file)]))) !== anchor) {
      errors.push('Independent review scope is stale', fresh.length === 1 && fresh[0].legacy
        ? 'rulesRebase: files other than the listed rule files changed since the review'
        : 'rebases: files other than the listed files changed since the review');
    }
  }
  for (const { entry, label, legacy } of fresh) {
    const owner = legacy ? 'approving governance contract' : 'approving contract';
    if (!selected.includes(entry.by)) errors.push(`${label}: ${owner} ${entry.by} is not part of this diff`);
    else if (issuesByPath.get(entry.by)?.length) errors.push(`${label}: ${owner} ${entry.by} does not validate at phase ${phase}`);
  }
  return errors;
}
export function validateDiff(root, files, { phase = 'verify', base, readBase = base ? gitBaseReader(root, base) : undefined } = {}) {
  const errors = [], contracts = [];
  const paths = allContracts(root);
  const tasks = files.filter(f => isTaskDocument(f) && existsSync(join(root, f)));
  const product = files.filter(isProductPath);
  // Task 935 R5: every changed executable policy file (deletions included) needs a governance contract.
  const policy = files.filter(isExecutablePolicyPath);
  const retained = [];
  const registryPath = 'scripts/workflow-gates/release-blockers.json';
  if (existsSync(join(root, registryPath))) {
    const registry = readJson(root, registryPath);
    for (const finding of registry.findings || []) if (finding.status === 'resolved' && finding.contract) retained.push(finding.contract);
  }
  const selected = [...new Set([...paths.filter(p => files.includes(p) || tasks.some(t => p === `${t.slice(0, -3)}.security.json`)), ...retained])];
  if (product.length > 0 && selected.length === 0) errors.push('Product diff requires a changed task security contract');
  for (const task of tasks) {
    const path = `${task.slice(0, -3)}.security.json`;
    if (!selected.includes(path)) errors.push(`${task}: missing ${path}`);
  }
  const issuesByPath = new Map();
  for (const path of selected) {
    try {
      const contract = readJson(root, path);
      const affectsProduct = product.some(file => contract.scope?.includes(file));
      const affectsPolicy = contract.kind === 'governance' && policy.some(file => contract.scope?.includes(file));
      const selectedPhase = affectsProduct || affectsPolicy || contract.stage !== 'planned' ? phase : 'plan';
      const issues = validateContract(root, contract, { phase: selectedPhase });
      if (path !== `${contract.task?.slice(0, -3)}.security.json`) issues.push('Contract must be adjacent to its kickoff with the same basename');
      issuesByPath.set(path, issues);
      contracts.push({ path, contract, affectsProduct, affectsPolicy });
    } catch (error) { issuesByPath.set(path, [error.message]); errors.push(`${path}: ${error.message}`); }
  }
  for (const { path, contract } of contracts) {
    const issues = [...issuesByPath.get(path)];
    if (phase !== 'plan') {
      for (const issue of diffRebaseErrors(root, path, contract, { readBase, selected, issuesByPath, phase })) if (!issues.includes(issue)) issues.push(issue);
    }
    errors.push(...issues.map(e => `${path}: ${e}`));
  }
  for (const file of product) {
    if (!contracts.some(c => c.contract.kind === 'product' && c.contract.scope?.includes(file))) errors.push(`${file}: outside every changed product contract scope`);
  }
  for (const file of policy) {
    if (!contracts.some(c => c.contract.kind === 'governance' && c.contract.scope?.includes(file))) errors.push(`${file}: outside every changed governance contract scope`);
  }
  return { errors, contracts };
}
// Task 943 R11: a reviewed contract outside the diff selection goes stale when a shared file of its digest changes (C50,
// C54), and a deleted contract is validated by nothing (C59). Every reviewed contract not in `selected` must keep a
// current review and report digest (or a valid rebase chain); a contract reviewed at the base may leave the head only
// as a reviewed contract with the same file name (a move to the archive or a revision of the same kickoff).
export function reviewedFreshnessErrors(root, selected, { files = [], readBase } = {}) {
  const errors = [];
  const paths = allContracts(root);
  const reviewedAt = path => { try { return readJson(root, path).stage === 'reviewed'; } catch { return false; } };
  for (const path of paths) {
    if (selected.includes(path)) continue;
    let contract;
    try { contract = readJson(root, path); } catch (error) { errors.push(`${path}: reviewed freshness: contract unavailable (${error.message})`); continue; }
    if (contract?.stage !== 'reviewed') continue;
    try { errors.push(...scopeHashErrors(root, contract, contract.review?.scopeSha256, 'Independent review scope is stale').map(error => `${path}: ${error}`)); }
    catch (error) { errors.push(`${path}: reviewed freshness: review digest unavailable (${error.message})`); }
    try {
      const report = readJson(root, contract.report);
      errors.push(...scopeHashErrors(root, contract, report?.scopeSha256, 'Security report scope hash is stale').map(error => `${path}: ${error}`));
    } catch (error) { errors.push(`${path}: reviewed freshness: security report unavailable (${error.message})`); }
  }
  for (const file of files) {
    if (!/^tasks\/.+\.security\.json$/.test(file) || paths.includes(file)) continue;
    let base = null;
    try { base = JSON.parse((typeof readBase === 'function' ? readBase(file) : null) ?? 'null'); } catch { base = null; }
    if (base?.stage !== 'reviewed') continue;
    const name = file.split('/').at(-1);
    if (!paths.some(path => path.split('/').at(-1) === name && reviewedAt(path))) errors.push(`reviewed contract removed: ${file}`);
  }
  return errors;
}

// Task 935 R3: TAP lines of `node --test`; `#` and `\` in names are escaped by the reporter.
export function parseTap(output) {
  const results = [];
  for (const line of String(output).split(/\r?\n/)) {
    const match = /^\s*(not ok|ok) \d+ - (.*)$/.exec(line);
    if (!match) continue;
    const directive = /(?<!\\) # (SKIP|TODO)\b/i.exec(match[2]);
    const name = (directive ? match[2].slice(0, directive.index) : match[2]).replace(/\\#/g, '#').replace(/\\\\/g, '\\');
    results.push({ name, status: directive ? directive[1].toLowerCase() === 'skip' ? 'skipped' : 'todo' : match[1] === 'ok' ? 'passed' : 'failed' });
  }
  return results;
}
export function governanceReport(root, contract, { run = file => spawnSync(process.execPath, ['--test', '--test-reporter=tap', file],
  { cwd: root, env: unitEnvironment(process.env), encoding: 'utf8', timeout: 5 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 }) } = {}) {
  const errors = validateContract(root, contract, { phase: 'verify' }).map(error => `contract: ${error}`);
  const results = new Map();
  for (const file of new Set(contract.cases.map(row => row.testFile))) {
    try { safePath(root, file); } catch (error) { errors.push(`${file}: ${error.message}`); results.set(file, []); continue; }
    const child = run(file);
    if (child.status !== 0 || child.error) errors.push(`${file}: test process exited with ${child.error ? child.error.message : `code ${child.status}`}`);
    results.set(file, parseTap(child.stdout));
  }
  let sensitivity = [];
  try {
    if (existsSync(safePath(root, contract.sensitivity, false))) sensitivity = readJson(root, contract.sensitivity).cases || [];
  } catch (error) { errors.push(`sensitivity: ${error.message}`); }
  const cases = contract.cases.map(row => {
    const matches = (results.get(row.testFile) || []).filter(result => result.name === row.testName);
    const status = matches.length === 1 ? matches[0].status : matches.length ? 'duplicate' : 'missing';
    if (status !== 'passed') errors.push(`${row.id}: mapped test is ${status}`);
    const record = { id: row.id, status, testFile: row.testFile, testName: row.testName };
    const proof = sensitivity.filter(s => s?.id === row.id);
    if (proof.length === 1) record.sensitivity = proof[0];
    if (row.critical && proof.length !== 1) errors.push(`${row.id}: critical case has no single sensitivity record`);
    return record;
  });
  const report = { version: 1, status: errors.length ? 'failed' : 'passed', task: contract.task, contractSha256: planDigest(root, contract),
    scopeSha256: scopeDigest(root, contract), node: process.version, platform: process.platform, cases, errors };
  if (!errors.length) report.errors.push(...validateGovernanceReport(root, contract, report).map(error => `report: ${error}`));
  if (report.errors.length) report.status = 'failed';
  return report;
}

// Run mapped local and real-boundary suites separately. Unit children receive no live credentials.
export function unitEnvironment(environment) {
  const allowed = /^(?:path|pathext|systemroot|comspec|windir|temp|tmp|home|userprofile|appdata|localappdata|ci|github_actions|github_workspace|number_of_processors|processor_architecture|tz|lang|lc_all)$/i;
  return { ...Object.fromEntries(Object.entries(environment).filter(([key]) => allowed.test(key))), NODE_ENV: 'test' };
}

// Task 944 R1 (owner D15, D16, 2026-11-03): a governance sensitivity break exists only in the memory of the mutant's test
// process (sensitivity-register.mjs and sensitivity-hooks.mjs through NODE_OPTIONS). The live tree is never edited, so a
// break can no longer leave a hook-loaded module unparseable and every tool refused (the 2026-11-03 incident).
const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const lf = text => String(text).replace(/\r\n/g, '\n');
const SENSITIVITY_REGISTER = fileURLToPath(new URL('./sensitivity-register.mjs', import.meta.url));
const SENSITIVITY_SPEC_KEYS = ['case', 'find', 'replace', 'target', 'version'];
// The TAP lines of the named result: its `ok`/`not ok` line and its indented YAML diagnostic block (`---` … `...`).
export function tapResultBlock(output, name) {
  const lines = String(output).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)(?:not ok|ok) \d+ - /.exec(lines[i]);
    if (!match || parseTap(lines[i])[0]?.name !== name) continue;
    const indent = match[1].length + 2;
    const block = [lines[i]];
    if (lines[i + 1]?.trim() !== '---') return lines[i];
    for (let j = i + 1; j < lines.length; j++) {
      block.push(lines[j]);
      if (j > i + 1 && lines[j].trim() === '...' && lines[j].length - lines[j].trimStart().length === indent) break;
    }
    return block.join('\n');
  }
  return '';
}
// R1 (b)-(f): every refusal returns { error } with a message starting `SENSITIVITY:` and writes no file; success writes the
// artifact and the record and returns { record, artifact }.
export function runSensitivity(root, contractPath, breakPath) {
  const refuse = message => ({ error: `SENSITIVITY: ${message}` });
  let contract;
  try { contract = readJson(root, contractPath); } catch (error) { return refuse(`the contract is unavailable (${error.message})`); }
  if (contract?.kind !== 'governance') return refuse('the contract is not a governance contract; this command proves governance cases only');
  const scope = Array.isArray(contract.scope) ? contract.scope : [];
  const inputs = Array.isArray(contract.inputs) ? contract.inputs : [];
  if (typeof breakPath !== 'string' || !isEvidencePath(breakPath)) return refuse(`the break spec ${breakPath} is outside the evidence tree docs/sessions/evidence/`);
  if (!scope.includes(breakPath)) return refuse(`the break spec ${breakPath} is not listed in the contract scope`);
  let spec;
  try { spec = readJson(root, breakPath); } catch (error) { return refuse(`the break spec is unavailable or malformed (${error.message})`); }
  if (!spec || typeof spec !== 'object' || Array.isArray(spec) || spec.version !== 1
    || Object.keys(spec).sort().join() !== SENSITIVITY_SPEC_KEYS.join() || !['case', 'target', 'find', 'replace'].every(key => typeof spec[key] === 'string')) {
    return refuse('the break spec is malformed; it must be { "version": 1, "case", "target", "find", "replace" } with string values');
  }
  const row = (Array.isArray(contract.cases) ? contract.cases : []).find(c => c?.id === spec.case);
  if (!row) return refuse(`unknown case ${spec.case}`);
  if (row.critical !== true) return refuse(`case ${spec.case} is not critical`);
  const id = row.id;
  let target;
  try { target = safePath(root, spec.target); } catch (error) { return refuse(`the target ${spec.target} is missing or invalid (${error.message})`); }
  if (!/\.(?:mjs|cjs|js)$/.test(spec.target)) return refuse(`the target ${spec.target} is not a .mjs, .cjs or .js file`);
  if (spec.target === row.testFile) return refuse(`the target ${spec.target} is the test file of ${id}`);
  if (!scope.includes(spec.target) && !inputs.includes(spec.target)) return refuse(`the target ${spec.target} is in neither the scope nor the inputs of the contract`);
  try { safePath(root, row.testFile); } catch (error) { return refuse(`the test file ${row.testFile} of ${id} is missing or invalid (${error.message})`); }
  const find = lf(spec.find), replace = lf(spec.replace);
  if (!find) return refuse('find is empty');
  if (replace === find) return refuse('replace equals find');
  const count = lf(readFileSync(target, 'utf8')).split(find).length - 1;
  if (count !== 1) return refuse(`find occurs ${count} times in ${spec.target}, not exactly once`);
  let sensitivityFile, sensitivity;
  try {
    if (!isEvidencePath(contract.sensitivity || '')) throw new Error('not a path under docs/sessions/evidence/');
    sensitivityFile = safePath(root, contract.sensitivity, false);
    sensitivity = existsSync(sensitivityFile) ? readJson(root, contract.sensitivity) : { version: 1, task: contract.task, cases: [] };
    if (!sensitivity || typeof sensitivity !== 'object' || !Array.isArray(sensitivity.cases)) throw new Error('no cases array');
  } catch (error) { return refuse(`the sensitivity file ${contract.sensitivity} is invalid (${error.message})`); }

  const args = ['--test', '--test-reporter=tap', `--test-name-pattern=^${escapeRegExp(row.testName)}$`, row.testFile];
  const environment = unitEnvironment(process.env);
  const added = { NODE_OPTIONS: `--import=${pathToFileURL(SENSITIVITY_REGISTER).href}`, SENSITIVITY_BREAK: safePath(root, breakPath) };
  const digests = () => ({ target: digest(root, [spec.target]), test: digest(root, [row.testFile]) });
  const before = digests();
  const runs = [['baseline', {}], ['mutant', added], ['restored', {}]].map(([name, extra]) => {
    const child = spawnSync(process.execPath, args, { cwd: root, env: { ...environment, ...extra }, encoding: 'utf8',
      timeout: 5 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 });
    return { name, extra, child, results: parseTap(child.stdout ?? '').filter(result => result.name === row.testName) };
  });
  const after = digests();
  if (before.target !== after.target || before.test !== after.test) return refuse('a live file changed during the run');
  const [baseline, mutant, restored] = runs;
  const passed = r => !r.child.error && r.child.status === 0 && r.results.length === 1 && r.results[0].status === 'passed';
  const assertion = !mutant.child.error && mutant.results.length === 1 && mutant.results[0].status === 'failed'
    && /code: 'ERR_ASSERTION'/.test(tapResultBlock(mutant.child.stdout, row.testName));
  if (!passed(baseline) || !assertion || !passed(restored)) {
    const detail = !passed(baseline) ? 'baseline did not pass' : !assertion ? 'the mutant did not fail the named test with ERR_ASSERTION' : 'restored did not pass';
    return refuse(`the break did not fail ${id} with an assertion (${detail})`);
  }

  const artifact = posix.join(posix.dirname(breakPath), `${id}.txt`);
  const breakSha256 = digest(root, [breakPath]);
  const text = [`# Sensitivity run of ${id} by cli.mjs sensitivity (Task 944 R1): the break exists only in the mutant's test process`,
    `node ${process.version}; platform ${process.platform}; UTC ${new Date().toISOString()}`,
    `contract: ${contractPath}`, `break spec: ${breakPath} sha256 ${breakSha256}`, `testName: ${row.testName}`,
    `target: ${spec.target} digest before ${before.target} after ${after.target}`,
    `test file: ${row.testFile} digest before ${before.test} after ${after.test}`,
    ...runs.flatMap(({ name, extra, child }) => ['', `## ${name}`,
      `command: ${Object.keys(extra).length ? `NODE_OPTIONS=${extra.NODE_OPTIONS} SENSITIVITY_BREAK=${extra.SENSITIVITY_BREAK} ` : ''}node ${args.join(' ')}`,
      `exit code: ${child.status}`, '--- TAP', String(child.stdout ?? '').replace(/\r\n/g, '\n').trimEnd(), '--- end TAP']), ''].join('\n');
  writeFileSync(safePath(root, artifact, false), text);
  const record = { id, testName: row.testName, baseline: 'passed', mutant: 'failed', failureKind: 'assertion', restored: 'passed',
    method: 'in-memory', break: breakPath, breakSha256, artifact, artifactSha256: digest(root, [artifact]) };
  const index = sensitivity.cases.findIndex(entry => entry?.id === id);
  sensitivity.cases = index === -1 ? [...sensitivity.cases, record]
    : sensitivity.cases.filter((entry, i) => entry?.id !== id || i === index).map(entry => (entry?.id === id ? record : entry));
  mkdirSync(resolve(sensitivityFile, '..'), { recursive: true });
  writeFileSync(sensitivityFile, `${JSON.stringify(sensitivity, null, 2)}\n`);
  return { record, artifact };
}
export function integrationTargetErrors(environment) {
  const ref = environment.SECURITY_TEST_PROJECT_REF;
  if (environment.SECURITY_TEST_TARGET !== 'development' || !/^[a-z0-9]{20}$/.test(ref || '')) return ['Approved development project identity is required for boundary tests'];
  try {
    const url = new URL(environment.NEXT_PUBLIC_SUPABASE_URL);
    if (url.protocol !== 'https:' || url.hostname !== `${ref}.supabase.co` || url.username || url.password) return ['Boundary test URL does not match the approved development project'];
  } catch { return ['Approved development Supabase URL is missing or invalid']; }
  return [];
}
export function unitReportErrors(data) {
  const assertions = Array.isArray(data?.testResults) ? data.testResults.flatMap(file => Array.isArray(file?.assertionResults) ? file.assertionResults : []) : [];
  return data?.success !== true || !Number.isInteger(data.numTotalTests) || data.numTotalTests < 1
    || !Number.isInteger(data.numPassedTests) || data.numPassedTests !== data.numTotalTests || data.numFailedTests !== 0 || data.numPendingTests !== 0
    || assertions.length !== data.numTotalTests || assertions.some(result => result?.status !== 'passed')
    ? ['Unit test collection is empty, incomplete, skipped or unsuccessful'] : [];
}
export function runMappedTests(root, contract) {
  const errors = [];
  for (const boundary of ['unit', 'external']) {
    const cases = contract.cases.filter(c => boundary === 'unit' ? c.boundary === 'unit' : c.boundary !== 'unit');
    if (!cases.length) continue;
    if (boundary === 'external') {
      const targetErrors = integrationTargetErrors(process.env);
      if (targetErrors.length) { errors.push(...targetErrors); continue; }
    }
    errors.push(...runCaseGroup(root, cases, boundary === 'unit' ? unitEnvironment(process.env) : process.env, boundary, contract));
  }
  return errors;
}
function runCaseGroup(root, cases, environment, boundary, contract) {
    const dir = join(root, 'test-results/workflow-gates/security-runs', digest(root, [], { task: contract.task }).slice(0, 16));
    mkdirSync(dir, { recursive: true });
    const output = join(dir, `${boundary}.json`);
    rmSync(output, { force: true });
    const result = spawnSync(process.execPath, [join(root, 'scripts/workflow-gates/vitest-runner.mjs'), output,
      `--boundary=${boundary}`, ...new Set(cases.map(c => c.testFile))], { cwd: root, env: environment, stdio: 'inherit', timeout: 10 * 60 * 1000 });
    if (result.status !== 0 || result.error || !existsSync(output)) return ['Mapped security tests failed, timed out or produced no JSON result'];
    let data;
    try { data = JSON.parse(readFileSync(output, 'utf8')); }
    catch { return ['Mapped security test JSON result is malformed']; }
    const assertions = (data.testResults || []).flatMap(f => (f.assertionResults || []).map(a => ({ ...a, file: relative(root, f.name).replaceAll('\\', '/') })));
    const errors = [];
    errors.push(...unitReportErrors(data));
    for (const row of cases) {
      const matches = assertions.filter(a => a.file === row.testFile && a.fullName === row.testName);
      if (matches.length !== 1 || matches[0].status !== 'passed') errors.push(`${row.id}: exact mapped test absent, duplicate, failed or skipped`);
    }
    return errors;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const option = (name, fallback) => { const i = args.indexOf(name); return i === -1 ? fallback : args[i + 1]; };
  const phase = option('--phase', 'verify');
  if (!['plan', 'verify', 'release'].includes(phase)) throw new Error('Unknown phase');
  let errors = [];
  if (command === 'plan' || command === 'verify' || command === 'receipt') {
    const path = option('--contract');
    const contract = readJson(ROOT, path);
    errors = command === 'receipt' ? validateReceipt(ROOT, contract)
      : validateContract(ROOT, contract, { phase: command === 'verify' ? 'verify' : 'plan' });
    if (command === 'receipt' && !errors.length) console.log(`SECURITY TASK PREFLIGHT COMPLETE - contract: ${path}.`);
    if (command === 'verify' && !errors.length && contract.kind === 'product') {
      errors.push(...runMappedTests(ROOT, contract));
      errors.push(...validateReport(ROOT, contract, readJson(ROOT, contract.report)));
    }
    if (command === 'verify' && !errors.length && contract.kind === 'governance') {
      try { errors.push(...validateGovernanceReport(ROOT, contract, readJson(ROOT, contract.report))); }
      catch (error) { errors.push(error.message); }
    }
  } else if (command === 'governance-report') {
    const path = option('--contract');
    const contract = readJson(ROOT, path);
    if (contract.kind !== 'governance') throw new Error('governance-report requires a governance contract');
    const report = governanceReport(ROOT, contract);
    const target = safePath(ROOT, contract.report, false);
    mkdirSync(resolve(target, '..'), { recursive: true });
    writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
    for (const row of report.cases) console.log(`${row.status === 'passed' ? 'PASS' : 'FAIL'} ${row.id} (${row.status})`);
    console.log(`Governance report: ${report.status}, ${report.cases.length} case(s), written to ${contract.report}.`);
    errors = report.errors;
  } else if (command === 'sensitivity') {
    // Task 944 R1: `sensitivity --contract <sidecar> --break <break spec>`; every refusal exits 1.
    const result = runSensitivity(ROOT, option('--contract'), option('--break'));
    if (result.error) { console.error(result.error); process.exitCode = 1; return; }
    console.log(`SENSITIVITY PASSED - ${result.record.id}`);
  } else if (command === 'diff') {
    const base = option('--base', process.env.GATES_BASE_SHA);
    const files = changedFiles(ROOT, { base, head: option('--head', process.env.GATES_HEAD_SHA || 'HEAD'), working: args.includes('--working-tree') });
    const result = validateDiff(ROOT, files, { phase, base }); errors = result.errors;
    if (!errors.length && phase !== 'plan') {
      for (const { contract } of result.contracts.filter(c => c.contract.kind === 'product' && (c.affectsProduct || c.contract.stage !== 'planned'))) {
        errors.push(...runMappedTests(ROOT, contract));
        try { errors.push(...validateReport(ROOT, contract, readJson(ROOT, contract.report))); }
        catch (error) { errors.push(error.message); }
      }
      for (const { path, contract } of result.contracts.filter(c => c.contract.kind === 'governance' && (c.affectsPolicy || c.contract.stage !== 'planned'))) {
        try { errors.push(...validateGovernanceReport(ROOT, contract, readJson(ROOT, contract.report)).map(error => `${path}: ${error}`)); }
        catch (error) { errors.push(`${path}: ${error.message}`); }
      }
    }
    // Task 943 R11: reviewed contracts outside the selection stay fresh, and no reviewed contract silently disappears.
    if (phase === 'release') {
      errors.push(...reviewedFreshnessErrors(ROOT, result.contracts.map(entry => entry.path), { files, readBase: gitBaseReader(ROOT, base) }));
    }
    console.log(`Security scope: ${files.length} changed files, ${result.contracts.length} task contract(s).`);
  } else if (command === 'hash') {
    const task = option('--task');
    console.log(digest(ROOT, [task]));
  } else if (command === 'required') {
    const expected = readJson(ROOT, 'scripts/workflow-gates/pipeline.json').requiredJobs;
    errors = requiredResults(JSON.parse(process.env.GATES_NEEDS_JSON || 'null'), expected);
  } else if (command === 'target') {
    errors = integrationTargetErrors(process.env);
  } else if (command === 'unit-report') {
    errors = unitReportErrors(readJson(ROOT, 'test-results/unit.json'));
  } else if (command === 'release') {
    const registry = readJson(ROOT, 'scripts/workflow-gates/release-blockers.json');
    if (registry.version !== 1 || !Array.isArray(registry.findings) || registry.findings.length === 0) errors.push('Release blocker registry is missing or malformed');
    for (const id of ['S59', 'S60', 'S61', 'S62']) if (!registry.findings?.some(f => f.id === id)) errors.push(`${id}: known finding was removed instead of resolved`);
    for (const finding of registry.findings || []) {
      if (!['open', 'resolved'].includes(finding.status)) errors.push(`${finding.id}: invalid finding status`);
      if (finding.status !== 'resolved') errors.push(`${finding.id}: unresolved ${finding.severity} security finding`);
      else {
        try {
          const contract = readJson(ROOT, finding.contract);
          if (contract.stage !== 'reviewed') errors.push(`${finding.id}: independently reviewed contract required`);
          errors.push(...validateContract(ROOT, contract, { phase: 'release' }));
          errors.push(...validateReport(ROOT, contract, readJson(ROOT, contract.report)));
          const rows = Array.isArray(finding.caseIds) ? contract.cases.filter(c => finding.caseIds.includes(c.id)) : [];
          if (!rows.some(c => c.critical && c.layer === 'server' && c.outcome === 'deny')
            || !rows.some(c => c.boundary !== 'unit' && c.outcome === 'deny')) errors.push(`${finding.id}: critical server and real-boundary regression case IDs required`);
        } catch (error) { errors.push(`${finding.id}: ${error.message}`); }
      }
    }
  } else if (command === 'inventory') {
    const policy = readJson(ROOT, 'scripts/workflow-gates/pipeline.json');
    const files = [];
    const walk = dir => { for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (e.isDirectory()) walk(`${dir}/${e.name}`); else if (e.name.endsWith('.md')) files.push(`${dir}/${e.name}`);
    } };
    policy.ruleRoots.forEach(walk); files.push(...policy.ruleEntries);
    const rows = [...new Set(files)].sort().map(file => ({ path: file, sha256: digest(ROOT, [file]), bytes: readFileSync(safePath(ROOT, file)).length }));
    const out = resolve(ROOT, 'test-results/workflow-gates'); mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'rules-inventory.json'), JSON.stringify({ version: 1, files: rows }, null, 2));
    console.log(`Inventoried ${rows.length} rule/role documents; SHA-256 inventory retained in test-results/workflow-gates/rules-inventory.json.`);
  } else throw new Error('Use plan, receipt, verify, governance-report, sensitivity, diff, hash, inventory, required, target, unit-report or release');
  if (errors.length) { errors.forEach(e => console.error(`BLOCKED: ${e}`)); process.exitCode = 1; }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(`BLOCKED: ${error.message}`); process.exitCode = 1; });
