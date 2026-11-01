import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, readdirSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

export const sha256 = value => createHash('sha256').update(value).digest('hex');
// UTF-16 code-unit order (RFC 8785): localeCompare depends on the runtime's ICU default locale.
const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => byCodeUnit(a, b))) : v);
const concrete = value => typeof value === 'string' && value.trim().length >= 8
  && !/^(?:TODO|TBD|N\/A|NONE|UNKNOWN|<.*>)$/i.test(value.trim());
export const REQUIRED_PRODUCT_RULES = ['security-testing', 'security-test-quality', 'security-test-environment', 'workflow-gates']
  .map(name => `.claude/rules/shared/${name}.md`);
export function safePath(root, file, mustExist = true) {
  if (typeof file !== 'string' || !file || isAbsolute(file) || /[\\\0:*?<>|\r\n]/.test(file)
    || file.split('/').some(p => !p || p === '.' || p === '..')
    || /(?:^|\/)(?:\.env[^/]*|\.git|\.vercel|node_modules|[^/]*\.pem)(?:\/|$)/i.test(file)) {
    throw new Error('Invalid or sensitive repository path');
  }
  const target = resolve(root, file);
  if (mustExist && !existsSync(target)) throw new Error(`Missing file: ${file}`);
  let ancestor = target;
  while (!existsSync(ancestor) && dirname(ancestor) !== ancestor) ancestor = dirname(ancestor);
  if (existsSync(ancestor)) {
    const rel = relative(realpathSync(root), realpathSync(ancestor));
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error(`Symlink escapes repository: ${file}`);
  }
  return target;
}
// `overrides` maps a path to replacement bytes/text, or null for an absent file (diff-base recomputation, Task 935 R10).
export function digest(root, files, data, overrides) {
  const parts = [...files].sort().map(file => {
    const target = safePath(root, file, false);
    if (overrides?.has(file)) {
      const replaced = overrides.get(file);
      if (replaced === null || replaced === undefined) return [file, { absent: true }];
      const bytes = Buffer.isBuffer(replaced) ? replaced : Buffer.from(String(replaced), 'utf8');
      return [file, sha256(bytes.includes(0) ? bytes : bytes.toString('utf8').replace(/\r\n/g, '\n'))];
    }
    if (!existsSync(target)) return [file, { absent: true }];
    const bytes = readFileSync(target);
    const value = bytes.includes(0) ? bytes : bytes.toString('utf8').replace(/\r\n/g, '\n');
    return [file, sha256(value)];
  });
  return sha256(canonical({ files: parts, ...(data === undefined ? {} : { data }) }));
}
export function planDigest(root, contract) {
  const plan = { ...contract };
  delete plan.stage; delete plan.review;
  return digest(root, [], plan);
}
export function workflowRuleInputs(root, paths, overrides) {
  const main = '.claude/rules/shared/workflow-gates.md';
  const expanded = [...paths];
  // Legacy synthetic/unsplit rule fixtures have no companion section. The current split contract requires all
  // sections for both complete-read enforcement and proof freshness; a missing companion remains an error.
  const text = overrides?.has(main) ? String(overrides.get(main) ?? '') : paths.includes(main) ? readFileSync(safePath(root, main), 'utf8') : '';
  if (paths.includes(main) && text.includes('## Required companions')) {
    expanded.push(...['workflow-contract', 'workflow-evidence', 'workflow-ci', 'git-publication']
      .map(name => `.claude/rules/shared/${name}.md`));
  }
  return [...new Set(expanded)];
}
export function scopeDigest(root, contract, overrides) {
  const configs = readdirSync(root).filter(file => /^(?:next|vitest(?:\.[a-z0-9_-]+)?)\.config\.[cm]?[jt]s$/.test(file));
  const runtime = ['package.json', 'package-lock.json', 'tsconfig.json', '.nvmrc', 'src/tests/setup.ts', 'src/tests/integration/setup.ts', ...configs]
    .filter(file => existsSync(resolve(root, file)));
  let files = [...new Set([...contract.scope, ...(contract.inputs || []), ...workflowRuleInputs(root, contract.rules || [], overrides), ...contract.cases.map(row => row.testFile), ...runtime])];
  // A governance report records this digest, so its own bytes cannot be part of it (a fixed point is impossible).
  if (contract.kind === 'governance') files = files.filter(file => file !== contract.report);
  return digest(root, files, undefined, overrides);
}
// The planner and the write hook must agree on paths Sonnet cannot implement.
export const isPolicyPath = file => /^(?:\.claude\/|\.github\/workflows\/|scripts\/workflow-gates\/|scripts\/check-[^/]+|docs\/rules\/|docs\/(?:qa-profiles|qa-rules|golden-rules|agent-contract|rule-index)\.md$)/i.test(file);
// Runtime files and executable helpers require the same task scope in pre-write and CI; policy keeps its own owner.
export const isProductPath = file => /^(?:src\/|public\/|messages\/|(?:supabase|database|migrations)\/|(?:package(?:-lock)?\.json|next\.config\.[^/]+|vitest(?:\.integration)?\.config\.[^/]+|tsconfig\.json|vercel\.(?:json|ts)|\.nvmrc|sentry\.(?:server|edge|client)\.config\.[cm]?[jt]s|instrumentation(?:-client)?\.[cm]?[jt]s|(?:middleware|proxy)\.[cm]?[jt]s)$)/i.test(file)
  || (/^scripts\/.+\.(?:[cm]?[jt]sx?|ps1|py|sh)$/i.test(file) && !isPolicyPath(file));
export const isTaskDocument = file => /^tasks\/(?!Archive\/|Templates\/|Epics\/)(?!(?:README|index)\.md$).+\.md$/i.test(file);
const isDoc = file => /\.md$/.test(file) && /^(?:docs\/|tasks\/|\.claude\/rules\/|CLAUDE\.md$)/.test(file);
// Task 935: rules, hooks, settings, CI workflows and gate scripts are implemented by Opus under a governance contract.
export const REQUIRED_GOVERNANCE_RULES = ['security-testing', 'workflow-gates', 'git-publication', 'role-boundaries']
  .map(name => `.claude/rules/shared/${name}.md`);
export const isEvidencePath = file => /^docs\/sessions\/evidence\/[^/].*[^/]$/.test(file);
export const isGovernanceScopePath = file => !isProductPath(file)
  && (isPolicyPath(file) || isDoc(file) || /^tasks\/.+\.security\.json$/.test(file) || isEvidencePath(file));
export const isExecutablePolicyPath = file => isPolicyPath(file) && !/\.md$/i.test(file);

function readContractFile(root, file) {
  if (!/^tasks\/.+\.security\.json$/.test(file || '')) throw new Error(`not a task security contract path: ${file}`);
  try { return JSON.parse(readFileSync(safePath(root, file), 'utf8')); }
  catch (error) { throw new Error(/Missing file/.test(error.message) ? error.message : `Malformed or unreadable JSON: ${file}`); }
}
// The rebase evidence names the changed rule files as `- <path>` bullets under `## Changed rule files`.
export function rebaseFiles(text) {
  const section = String(text).replace(/\r\n/g, '\n').split(/^## /m).find(part => /^Changed rule files\s*\n/.test(part));
  if (!section) return [];
  return [...section.matchAll(/^- `?([^`\s]+)`?\s*$/gm)].map(match => match[1]);
}
// Task 935 R10: a reviewed contract made stale only by rule files that a reviewed governance contract approved.
export function rulesRebaseErrors(root, contract, current = scopeDigest(root, contract)) {
  const rebase = contract.review?.rulesRebase, errors = [];
  const check = (ok, message) => { if (!ok) errors.push(message); };
  if (!rebase || typeof rebase !== 'object' || Array.isArray(rebase)) return ['rulesRebase must be an object'];
  check(rebase.originalScopeSha256 === contract.review.scopeSha256, 'originalScopeSha256 is not the reviewed scope digest');
  check(rebase.rebasedScopeSha256 === current, 'rebasedScopeSha256 is not the current scope digest');
  let listed = [];
  try {
    check(isEvidencePath(rebase.evidence || ''), 'evidence must be under docs/sessions/evidence/');
    safePath(root, rebase.evidence);
    check(rebase.evidenceSha256 === digest(root, [rebase.evidence]), 'evidence hash is stale');
    listed = rebaseFiles(readFileSync(safePath(root, rebase.evidence), 'utf8'));
  } catch (error) { errors.push(`evidence unavailable (${error.message})`); }
  check(listed.length > 0, 'evidence lists no changed rule files');
  const inputs = workflowRuleInputs(root, contract.rules || []);
  for (const file of listed) check(/^\.claude\/rules\/.+\.md$/.test(file) && inputs.includes(file), `${file} is not a rule input of this contract`);
  try {
    const by = readContractFile(root, rebase.by);
    check(by.kind === 'governance' && by.stage === 'reviewed', `${rebase.by} is not a reviewed governance contract`);
    for (const file of listed) check(Array.isArray(by.scope) && by.scope.includes(file), `${file} is outside the scope of ${rebase.by}`);
  } catch (error) { errors.push(`approving governance contract unavailable (${error.message})`); }
  return errors;
}
// A recorded scope hash is current, or it is the original of a valid rule-only rebase.
export function scopeHashErrors(root, contract, recorded, stale) {
  const current = scopeDigest(root, contract);
  if (recorded === current) return [];
  if (!contract.review?.rulesRebase) return [stale];
  const problems = rulesRebaseErrors(root, contract, current);
  if (!problems.length && recorded === contract.review.rulesRebase.originalScopeSha256) return [];
  return [stale, ...problems.map(problem => `rulesRebase: ${problem}`)];
}

export function validateContract(root, value, { phase = 'plan' } = {}) {
  const errors = [];
  const check = (ok, message) => { if (!ok) errors.push(message); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['Contract must be an object'];
  check(value.version === 1, 'Contract version must be 1');
  check(['planned', 'implemented', 'reviewed'].includes(value.stage), 'stage must be planned, implemented or reviewed');
  if (Object.hasOwn(value, 'executionStatus')) check(value.executionStatus === 'ready',
    'Execution status must be ready; draft or blocked contracts cannot authorize execution or publication');
  if (phase !== 'plan' && value.kind === 'product') check(['implemented', 'reviewed'].includes(value.stage), 'Product verification requires an implemented or reviewed contract');
  if (phase !== 'plan' && value.kind === 'governance') {
    check(['implemented', 'reviewed'].includes(value.stage), 'Governance verification requires an implemented or reviewed contract');
    check(value.implementation?.role === 'Opus', 'Governance implementation.role must be Opus (owner decision 2026-11-01)');
  }
  if (phase === 'release' && ['product', 'governance'].includes(value.kind)) {
    check(value.stage === 'reviewed', 'Merge/release requires independently reviewed stage');
    const review = value.review;
    check(review?.role === 'Opus' && ['APPROVED', 'APPROVED WITH NOTES'].includes(review?.decision), 'Independent Opus review decision missing');
    try {
      safePath(root, review?.evidence);
      check(review?.evidenceSha256 === digest(root, [review?.evidence]), 'Independent review evidence hash is stale');
      errors.push(...scopeHashErrors(root, value, review?.scopeSha256, 'Independent review scope is stale'));
      safePath(root, value.report);
      check(review?.reportSha256 === digest(root, [value.report]), 'Independent review report is stale');
    } catch (error) { errors.push(error.message); }
  }
  check(['product', 'docs', 'governance'].includes(value.kind), 'kind must be product, docs or governance');
  check(/^Q[0-4]$/.test(value.qaProfile || ''), 'Select an existing QA profile (Q0 through Q4)');
  let taskText = '';
  try {
    check(/^tasks\/.+\.md$/.test(value.task || ''), 'Task path must be a saved task');
    taskText = readFileSync(safePath(root, value.task), 'utf8');
    check(digest(root, [value.task]) === value.taskSha256, 'Task hash is stale; revalidate the revised kickoff');
  } catch (error) { errors.push(error.message); }
  check(/^## Security test contract\s*$/m.test(taskText), 'Kickoff must contain ## Security test contract');
  const scope = Array.isArray(value.scope) ? value.scope : [];
  check(scope.length > 0 && new Set(scope).size === scope.length, 'scope must contain unique exact paths');
  for (const file of scope) {
    try { safePath(root, file, false); } catch (error) { errors.push(error.message); }
    if (value.kind === 'product') check(!isPolicyPath(file), `Executor scope contains policy path ${file}; Opus must resolve policy work before product handoff`);
    if (value.kind === 'governance') check(isGovernanceScopePath(file), `Governance scope contains a product or unrelated path ${file}`);
  }
  if (value.kind === 'governance') check(scope.some(isExecutablePolicyPath), 'Governance scope must contain an executable (non-Markdown) policy path');
  const rules = Array.isArray(value.rules) ? value.rules : [];
  check(rules.includes('.claude/rules/shared/security-testing.md'), 'Load the mandatory security-testing rule');
  if (value.kind === 'product') for (const file of REQUIRED_PRODUCT_RULES) check(rules.includes(file), `Mandatory product rule missing: ${file}`);
  if (value.kind === 'governance') for (const file of REQUIRED_GOVERNANCE_RULES) check(rules.includes(file), `Mandatory governance rule missing: ${file}`);
  for (const file of rules) {
    try { safePath(root, file); } catch (error) { errors.push(error.message); }
  }
  const cases = Array.isArray(value.cases) ? value.cases : [];
  if (value.kind === 'docs') {
    check(value.qaProfile === 'Q0' && scope.every(isDoc), 'N/A is permitted only for Q0 documentation/rules/task records');
    check(concrete(value.notApplicable) && cases.length === 0, 'Q0 requires a concrete runtime N/A explanation and no runtime claims');
    return errors;
  }
  if (value.kind === 'governance') {
    errors.push(...governanceCaseErrors(root, value, cases, phase));
    return errors;
  }
  check(value.qaProfile !== 'Q0', 'Product work cannot use Q0');
  const inputs = Array.isArray(value.inputs) ? value.inputs : [];
  check(value.inputs === undefined || Array.isArray(value.inputs), 'inputs must be an explicit path array');
  for (const file of inputs) { try { safePath(root, file, phase !== 'plan'); } catch (error) { errors.push(error.message); } }
  check([...scope, ...inputs].some(file => /^(?:src\/(?!tests\/)|database\/|migrations\/|supabase\/)/.test(file)
    && !/\.(?:test|spec)\.[^.]+$|\/__tests__\//.test(file)), 'Product contract must identify actual production source inputs, including unchanged consumers/guards');
  const retainedReview = phase !== 'plan' && value.stage === 'reviewed' && /^tasks\/Archive\/.+\.md$/i.test(value.task || '');
  check(isTaskDocument(value.task || '') || retainedReview, 'Product execution requires an active task; archived tasks are retained review evidence only');
  const ids = new Set();
  const tests = new Set();
  for (const row of cases) {
    if (!row || typeof row !== 'object') { errors.push('Case must be an object'); continue; }
    check(/^SEC-[A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(row.id || ''), 'Case ID must be SEC-<stable identifier>');
    check(!ids.has(row.id), `duplicate case ID: ${row.id}`); ids.add(row.id);
    for (const field of ['invariant', 'actor', 'resource', 'input', 'response']) check(concrete(row[field]), `${row.id}: concrete ${field} required`);
    check(['frontend', 'server', 'database', 'http', 'provider'].includes(row.layer), `${row.id}: invalid layer`);
    check(['allow', 'deny', 'error'].includes(row.outcome), `${row.id}: invalid outcome`);
    check(['unit', 'integration', 'browser'].includes(row.boundary), `${row.id}: explicit boundary required`);
    check(typeof row.critical === 'boolean', `${row.id}: critical must be explicit`);
    check(Array.isArray(row.forbiddenEffects) && row.forbiddenEffects.length > 0 && row.forbiddenEffects.every(concrete), `${row.id}: forbiddenEffects required`);
    check(typeof row.testName === 'string' && row.testName.includes(`[${row.id}]`), `${row.id}: exact testName must include [case ID]`);
    const testKey = `${row.testFile}\0${row.testName}`;
    check(!tests.has(testKey), `${row.id}: duplicate mapped test cannot count as two cases`); tests.add(testKey);
    try {
      check(/\.(?:test|spec)\.(?:[cm]?[jt]sx?)$/.test(row.testFile || ''), `${row.id}: runnable testFile required`);
      check(!/^docs\//.test(row.testFile || ''), `${row.id}: evidence documents are not regression test files`);
      safePath(root, row.testFile, phase !== 'plan');
    } catch (error) { errors.push(error.message); }
  }
  for (const layer of ['frontend', 'server']) {
    for (const outcome of ['allow', 'deny', 'error']) check(cases.some(c => c?.layer === layer && c.outcome === outcome), `${layer}: missing ${outcome} case`);
    check(cases.some(c => c?.layer === layer && c.boundary === 'unit'), `${layer}: missing runnable local unit/component case`);
  }
  const criticalInvariants = [...new Set(cases.filter(c => c?.critical).map(c => c.invariant))];
  if (criticalInvariants.length) check(value.qaProfile === 'Q4', 'Critical security work requires Q4');
  for (const invariant of criticalInvariants) for (const outcome of ['allow', 'deny']) {
    check(cases.some(c => c?.invariant === invariant && c.boundary !== 'unit' && c.outcome === outcome),
      `Critical invariant requires real-boundary ${outcome} control: ${invariant}`);
  }
  if (scope.some(file => /^(?:supabase|database|migrations)\/|\.sql$/.test(file))) {
    check(cases.some(c => c?.layer === 'database' && c.boundary === 'integration'), 'Database changes require real database integration cases');
  }
  return errors;
}

// A report is input to independent review, never a claim that JSON can prove test quality.
// In particular, exit 0 is insufficient when the harness reports vulnerabilities or cannot verify cleanup.
export function validateReport(root, contract, report) {
  const errors = [];
  const check = (ok, message) => { if (!ok) errors.push(message); };
  if (!report || typeof report !== 'object') return ['Security report is missing'];
  check(report.version === 1 && report.status === 'passed', 'Security report must be version 1 and passed');
  check(Array.isArray(report.errors) && report.errors.length === 0, 'Security report contains errors or has no errors array');
  check(Array.isArray(report.vulnerabilities) && report.vulnerabilities.length === 0, 'Security report contains vulnerabilities or omits their result');
  check(report.cleanup?.verified === true && report.cleanup.remaining === 0
    && Array.isArray(report.cleanup.errors) && report.cleanup.errors.length === 0, 'Synthetic cleanup is not verified; a failed query is not zero remaining');
  try {
    check(report.contractSha256 === planDigest(root, contract), 'Security report contract hash is stale');
    errors.push(...scopeHashErrors(root, contract, report.scopeSha256, 'Security report scope hash is stale'));
  } catch (error) { errors.push(error.message); }
  const rows = Array.isArray(report.cases) ? report.cases : [];
  check(new Set(rows.map(c => c?.id)).size === rows.length, 'Security report has duplicate cases');
  check(rows.every(row => contract.cases.some(c => c.id === row?.id)), 'Security report contains unknown cases');
  for (const row of contract.cases) {
    const proof = rows.find(c => c?.id === row.id);
    if (!proof) { errors.push(`${row.id}: missing result`); continue; }
    check(proof.status === 'passed', `${row.id}: result is ${proof.status || 'missing'}, including skipped/TODO`);
    check(Number.isInteger(proof.assertionCount) && proof.assertionCount > 0, `${row.id}: no assertions recorded`);
    if (row.critical) {
      const s = proof.sensitivity;
      check(s?.baseline === 'passed' && s?.mutant === 'failed' && s?.failureKind === 'assertion'
        && s?.restored === 'passed' && s?.testName === row.testName, `${row.id}: sensitivity requires baseline pass, intended assertion failure, restored pass`);
      try { safePath(root, s?.artifact); check(s?.artifactSha256 === digest(root, [s?.artifact]), `${row.id}: sensitivity artifact is stale`); }
      catch { errors.push(`${row.id}: sensitivity artifact is missing or invalid`); }
    }
  }
  return errors;
}

// Task 935 R1: governance cases replace the frontend/server rows with the hook, CI and validator layers.
function governanceCaseErrors(root, value, cases, phase) {
  const errors = [];
  const check = (ok, message) => { if (!ok) errors.push(message); };
  check(/^Q[1-4]$/.test(value.qaProfile || ''), 'Governance work requires Q1 through Q4');
  const retainedReview = phase !== 'plan' && value.stage === 'reviewed' && /^tasks\/Archive\/.+\.md$/i.test(value.task || '');
  check(isTaskDocument(value.task || '') || retainedReview, 'Governance execution requires an active task; archived tasks are retained review evidence only');
  const ids = new Set(), tests = new Set();
  for (const row of cases) {
    if (!row || typeof row !== 'object') { errors.push('Case must be an object'); continue; }
    check(/^GOV-[A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(row.id || ''), 'Case ID must be GOV-<stable identifier>');
    check(!ids.has(row.id), `duplicate case ID: ${row.id}`); ids.add(row.id);
    for (const field of ['invariant', 'actor', 'resource', 'input', 'response']) check(concrete(row[field]), `${row.id}: concrete ${field} required`);
    check(['hook', 'ci', 'validator'].includes(row.layer), `${row.id}: invalid governance layer`);
    check(['allow', 'deny', 'error'].includes(row.outcome), `${row.id}: invalid outcome`);
    check(['unit', 'process'].includes(row.boundary), `${row.id}: governance boundary must be unit or process`);
    check(typeof row.critical === 'boolean', `${row.id}: critical must be explicit`);
    check(Array.isArray(row.forbiddenEffects) && row.forbiddenEffects.length > 0 && row.forbiddenEffects.every(concrete), `${row.id}: forbiddenEffects required`);
    check(typeof row.testName === 'string' && row.testName.includes(`[${row.id}]`), `${row.id}: exact testName must include [case ID]`);
    const testKey = `${row.testFile}\0${row.testName}`;
    check(!tests.has(testKey), `${row.id}: duplicate mapped test cannot count as two cases`); tests.add(testKey);
    try {
      check(/^scripts\/workflow-gates\/[a-z0-9_-]+\.selftest\.mjs$/.test(row.testFile || ''), `${row.id}: testFile must be a scripts/workflow-gates/<name>.selftest.mjs file`);
      safePath(root, row.testFile, phase !== 'plan');
    } catch (error) { errors.push(error.message); }
  }
  for (const outcome of ['allow', 'deny', 'error']) check(cases.some(c => c?.outcome === outcome), `governance: missing ${outcome} case`);
  for (const layer of ['hook', 'ci']) check(cases.some(c => c?.layer === layer), `governance: missing ${layer} case`);
  for (const field of ['report', 'sensitivity']) {
    try { check(isEvidencePath(value[field] || ''), `${field} must be a path under docs/sessions/evidence/`); safePath(root, value[field], false); }
    catch (error) { errors.push(`${field}: ${error.message}`); }
  }
  return errors;
}

// Task 935 R3: `cli.mjs governance-report` writes this record; approval and CI only validate it.
export function validateGovernanceReport(root, contract, report) {
  const errors = [];
  const check = (ok, message) => { if (!ok) errors.push(message); };
  if (!report || typeof report !== 'object' || Array.isArray(report)) return ['Governance report is missing'];
  check(report.version === 1 && report.status === 'passed', 'Governance report must be version 1 and passed');
  check(Array.isArray(report.errors) && report.errors.length === 0, 'Governance report contains errors or has no errors array');
  try {
    check(report.contractSha256 === planDigest(root, contract), 'Governance report contract hash is stale');
    errors.push(...scopeHashErrors(root, contract, report.scopeSha256, 'Governance report scope hash is stale'));
  } catch (error) { errors.push(error.message); }
  const rows = Array.isArray(report.cases) ? report.cases : [];
  const cases = Array.isArray(contract.cases) ? contract.cases : [];
  check(new Set(rows.map(c => c?.id)).size === rows.length, 'Governance report has duplicate cases');
  check(rows.every(row => cases.some(c => c.id === row?.id)), 'Governance report contains unknown cases');
  for (const row of cases) {
    const proof = rows.find(c => c?.id === row.id);
    if (!proof) { errors.push(`${row.id}: missing result`); continue; }
    check(proof.status === 'passed' && proof.testName === row.testName && proof.testFile === row.testFile,
      `${row.id}: result is ${proof.status || 'missing'} for its exact mapped test, including skipped/TODO`);
    if (row.critical) {
      const s = proof.sensitivity;
      check(s?.baseline === 'passed' && s?.mutant === 'failed' && s?.failureKind === 'assertion' && s?.restored === 'passed'
        && s?.testName === row.testName, `${row.id}: sensitivity requires baseline pass, intended assertion failure, restored pass`);
      try { check(isEvidencePath(s?.artifact || '') && s?.artifactSha256 === digest(root, [s.artifact]), `${row.id}: sensitivity artifact is stale`); safePath(root, s?.artifact); }
      catch { errors.push(`${row.id}: sensitivity artifact is missing or invalid`); }
    }
  }
  return errors;
}

export function requiredResults(needs, expected) {
  if (!needs || typeof needs !== 'object') return ['CI needs results missing'];
  return [...expected.filter(id => needs[id]?.result !== 'success').map(id => `${id}: ${needs[id]?.result || 'missing'}`),
    ...Object.keys(needs).filter(id => !expected.includes(id)).map(id => `${id}: unexpected job`)];
}
export function selectShard(stories, shard) {
  const match = /^(\d+)\/(\d+)$/.exec(shard);
  const index = Number(match?.[1]), total = Number(match?.[2]);
  if (!match || !Number.isInteger(index) || index < 1 || total < index || total > stories.length) throw new Error('Invalid or empty locale shard');
  const sorted = [...stories].sort((a, b) => byCodeUnit(a.id, b.id));
  if (new Set(sorted.map(s => s.id)).size !== sorted.length) throw new Error('Duplicate Story IDs');
  return sorted.filter((_, i) => i % total === index - 1);
}
