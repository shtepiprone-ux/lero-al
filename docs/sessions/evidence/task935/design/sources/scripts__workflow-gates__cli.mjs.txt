#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContract, validateReport, requiredResults, safePath, digest, isProductPath, isTaskDocument } from './contract.mjs';

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
export function validateDiff(root, files, { phase = 'verify' } = {}) {
  const errors = [], contracts = [];
  const paths = allContracts(root);
  const tasks = files.filter(f => isTaskDocument(f) && existsSync(join(root, f)));
  const product = files.filter(isProductPath);
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
  for (const path of selected) {
    try {
      const contract = readJson(root, path);
      const affectsProduct = product.some(file => contract.scope?.includes(file));
      const selectedPhase = affectsProduct || contract.stage !== 'planned' ? phase : 'plan';
      const issues = validateContract(root, contract, { phase: selectedPhase });
      if (path !== `${contract.task?.slice(0, -3)}.security.json`) issues.push('Contract must be adjacent to its kickoff with the same basename');
      errors.push(...issues.map(e => `${path}: ${e}`));
      contracts.push({ path, contract, affectsProduct });
    } catch (error) { errors.push(`${path}: ${error.message}`); }
  }
  for (const file of product) {
    if (!contracts.some(c => c.contract.kind === 'product' && c.contract.scope?.includes(file))) errors.push(`${file}: outside every changed product contract scope`);
  }
  return { errors, contracts };
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
  } else if (command === 'diff') {
    const files = changedFiles(ROOT, { base: option('--base', process.env.GATES_BASE_SHA), head: option('--head', process.env.GATES_HEAD_SHA || 'HEAD'), working: args.includes('--working-tree') });
    const result = validateDiff(ROOT, files, { phase }); errors = result.errors;
    if (!errors.length && phase !== 'plan') {
      for (const { contract } of result.contracts.filter(c => c.contract.kind === 'product' && (c.affectsProduct || c.contract.stage !== 'planned'))) {
        errors.push(...runMappedTests(ROOT, contract));
        try { errors.push(...validateReport(ROOT, contract, readJson(ROOT, contract.report))); }
        catch (error) { errors.push(error.message); }
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
  } else throw new Error('Use plan, receipt, verify, diff, hash, inventory, required, target, unit-report or release');
  if (errors.length) { errors.forEach(e => console.error(`BLOCKED: ${e}`)); process.exitCode = 1; }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(`BLOCKED: ${error.message}`); process.exitCode = 1; });
