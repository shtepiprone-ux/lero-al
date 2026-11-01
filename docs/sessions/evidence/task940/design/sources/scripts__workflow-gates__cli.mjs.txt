#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContract, validateReport, validateGovernanceReport, requiredResults, safePath, digest, planDigest, scopeDigest,
  isProductPath, isTaskDocument, isExecutablePolicyPath, rebaseFiles } from './contract.mjs';

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
// Task 935 R10(c): the base contents of the listed rule files must reproduce the reviewed scope (a new rebase), or
// the base already carried this exact rebase. Any other changed digest input (scope, inputs, tests, runtime) stays stale.
export function diffRebaseErrors(root, path, contract, { readBase, selected, issuesByPath, phase }) {
  const rebase = contract.review?.rulesRebase;
  if (!rebase) return [];
  if (typeof readBase !== 'function') return ['rulesRebase: the diff base is required to verify a rule-only rebase'];
  let listed = [];
  try { listed = rebaseFiles(readFileSync(safePath(root, rebase.evidence), 'utf8')); }
  catch (error) { return [`rulesRebase: evidence unavailable (${error.message})`]; }
  const baseDigest = scopeDigest(root, contract, new Map(listed.map(file => [file, readBase(file)])));
  let previous = null;
  try { previous = JSON.parse(readBase(path) ?? 'null'); } catch { previous = null; }
  const prior = previous?.review?.rulesRebase;
  if (prior && canonicalJson(prior) === canonicalJson(rebase)) {
    return baseDigest === rebase.rebasedScopeSha256 ? [] : ['rulesRebase: digest inputs changed after the retained rebase; the review is stale'];
  }
  const errors = [];
  const anchored = baseDigest === rebase.originalScopeSha256
    || (prior && previous.review?.scopeSha256 === contract.review?.scopeSha256 && prior.rebasedScopeSha256 === baseDigest);
  if (!anchored) errors.push('Independent review scope is stale', 'rulesRebase: files other than the listed rule files changed since the review');
  if (!selected.includes(rebase.by)) errors.push(`rulesRebase: approving governance contract ${rebase.by} is not part of this diff`);
  else if (issuesByPath.get(rebase.by)?.length) errors.push(`rulesRebase: approving governance contract ${rebase.by} does not validate at phase ${phase}`);
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
    if (phase !== 'plan' && contract.review?.rulesRebase) {
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
  } else throw new Error('Use plan, receipt, verify, governance-report, diff, hash, inventory, required, target, unit-report or release');
  if (errors.length) { errors.forEach(e => console.error(`BLOCKED: ${e}`)); process.exitCode = 1; }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(`BLOCKED: ${error.message}`); process.exitCode = 1; });
