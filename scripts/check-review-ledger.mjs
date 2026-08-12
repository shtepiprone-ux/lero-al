#!/usr/bin/env node
/**
 * check-review-ledger.mjs — fail-closed approval-evidence validator.
 *
 * A persisted review ledger is intentionally stricter than a Markdown summary:
 * it records the final subject, required scope, exact evidence, counter-check,
 * and verdict for every primary acceptance criterion. This script validates the
 * ledger shape, artifact paths, declared tuple coverage, exact-generated-rule
 * records, and approval/handoff consistency.
 *
 * Modes:
 *   npm run check:review-ledger -- --file docs/reviews/<task>.review-ledger.json
 *   npm run check:review-ledger                         # validate all retained ledgers
 *   npm run check:review-ledger -- --ci                 # validate PR ledgers and require one
 *   npm run check:review-ledger:verify                  # in-memory failing-arm self-test
 *
 * Rule: docs/agent-contract.md §9a; docs/orchestrator-procedures.md
 *       "Approval-closure gate".
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const REVIEW_DIR = join(ROOT, 'docs', 'reviews');

const args = process.argv.slice(2);
const VALID_DECISIONS = new Set([
  'APPROVED',
  'APPROVED WITH NOTES',
  'NEEDS REVISION',
  'PARTIALLY VERIFIED',
  'BLOCKED',
]);
const VALID_STATUSES = new Set(['VERIFIED', 'UNVERIFIED', 'INFERENCE', 'UNKNOWN', 'BLOCKED']);
const VALID_PRIORITIES = new Set(['P0', 'P1', 'P2', 'P3', 'NOTE']);
const PRIMARY_PRIORITIES = new Set(['P0', 'P1', 'P2']);
const SCOPE_DIMENSIONS = ['subjects', 'stories', 'locales', 'viewports', 'states', 'phases'];
const SCHEMA_VERSION = 4;
const SEMANTIC_ENVELOPE_FIELDS = [
  'selector',
  'media',
  'supports',
  'layer',
  'specificity',
  'sourceOrder',
  'declarations',
  'customProperties',
];
const MAX_SCOPE_TUPLES = 20_000;
const TAILWIND_DEPENDENCY_MARKER = '__REVIEW_LEDGER_TAILWIND_DEPENDENCIES__';
const TAILWIND_PROBE_SCRIPT = [
  "import { compile } from '@tailwindcss/node';",
  'const css = process.env.REVIEW_LEDGER_TAILWIND_INPUT_CSS;',
  'const dependencies = [];',
  "const compiler = await compile(css, { base: process.env.REVIEW_LEDGER_TAILWIND_BASE_DIR, from: process.env.REVIEW_LEDGER_TAILWIND_INPUT_PATH, onDependency(path) { dependencies.push(path); } });",
  'process.stdout.write(compiler.build([process.env.REVIEW_LEDGER_TAILWIND_CANDIDATE]));',
  "process.stderr.write('__REVIEW_LEDGER_TAILWIND_DEPENDENCIES__' + JSON.stringify(dependencies));",
].join('\n');
const SELF_TEST_TAILWIND_RULE = String.raw`/*! tailwindcss v4.3.0 | MIT License | https://tailwindcss.com */
.group-hover\:\[--text-color\:var\(--primary\)\] {
  &:is(:where(.group):hover *) {
    @media (hover: hover) {
      --text-color: var(--primary);
    }
  }
}`;
const SELF_TEST_AFTER_RULE = '@media (hover: hover) { .fixture-card:hover .fixture-card-title { --text-color: var(--primary); } }';
const SELF_TEST_UNGUARDED_AFTER_RULE = '.fixture-card:hover .fixture-card-title { --text-color: var(--primary); }';

function gitCommand(args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0 && !allowFailure) {
    throw new Error((result.stderr || result.stdout || `git ${args.join(' ')} failed`).trim());
  }
  return result;
}

function currentHeadRevision() {
  return gitCommand(['rev-parse', 'HEAD']).stdout.trim();
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonBlankString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function addError(errors, message) {
  errors.push(message);
}

function requireString(value, label, errors) {
  if (!isNonBlankString(value)) addError(errors, `${label} must be a non-empty string`);
  return isNonBlankString(value) ? value.trim() : '';
}

function requireArray(value, label, errors, { min = 1 } = {}) {
  if (!Array.isArray(value)) {
    addError(errors, `${label} must be an array`);
    return [];
  }
  if (value.length < min) addError(errors, `${label} must contain at least ${min} item(s)`);
  return value;
}

function requireStringArray(value, label, errors, { min = 0 } = {}) {
  const values = requireArray(value, label, errors, { min });
  const cleaned = [];
  const seen = new Set();
  for (const item of values) {
    if (!isNonBlankString(item)) {
      addError(errors, `${label} values must be non-empty strings`);
      continue;
    }
    const normalized = item.trim();
    if (seen.has(normalized)) {
      addError(errors, `${label} contains duplicate value "${normalized}"`);
      continue;
    }
    seen.add(normalized);
    cleaned.push(normalized);
  }
  return cleaned;
}

function normalizedRepoPath(value, label, errors, { checkExists = true } = {}) {
  const path = requireString(value, label, errors);
  if (!path) return null;
  const absolute = resolve(ROOT, path);
  const rel = relative(ROOT, absolute);
  if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || resolve(ROOT, rel) !== absolute) {
    addError(errors, `${label} must stay inside the repository: ${path}`);
    return null;
  }
  if (checkExists && !existsSync(absolute)) addError(errors, `${label} does not exist: ${path}`);
  return rel.replaceAll('\\', '/');
}

function immutableCommit(value, label, errors) {
  const revision = requireString(value, label, errors).toLowerCase();
  if (!revision) return '';
  if (!/^[0-9a-f]{40}$/.test(revision)) {
    addError(errors, `${label} must be a full 40-character immutable commit SHA`);
    return '';
  }
  const result = gitCommand(['cat-file', '-e', `${revision}^{commit}`], { allowFailure: true });
  if (result.status !== 0) addError(errors, `${label} does not resolve to a local commit: ${revision}`);
  return revision;
}

function readGitRevisionFile(revision, path, label, errors) {
  if (!revision || !path) return '';
  const result = gitCommand(['show', `${revision}:${path}`], { allowFailure: true });
  if (result.status !== 0) {
    addError(errors, `${label} does not exist at ${revision}: ${path}`);
    return '';
  }
  return result.stdout;
}

function validateScope(value, label, errors, { allowNotApplicable = false } = {}) {
  if (!isObject(value)) {
    addError(errors, `${label} must be an object`);
    return {};
  }

  const scope = {};
  for (const dimension of SCOPE_DIMENSIONS) {
    if (value[dimension] === undefined) continue;
    const values = requireArray(value[dimension], `${label}.${dimension}`, errors);
    const cleaned = [];
    const seen = new Set();
    for (const item of values) {
      if (!isNonBlankString(item)) {
        addError(errors, `${label}.${dimension} values must be non-empty strings`);
        continue;
      }
      const normalized = item.trim();
      if (seen.has(normalized)) {
        addError(errors, `${label}.${dimension} contains duplicate value "${normalized}"`);
        continue;
      }
      seen.add(normalized);
      cleaned.push(normalized);
    }
    scope[dimension] = cleaned;
  }

  if (value.notApplicable === undefined) {
    if (allowNotApplicable) {
      for (const dimension of SCOPE_DIMENSIONS.filter(dimension => dimension !== 'subjects')) {
        if (value[dimension] === undefined) {
          addError(errors, `${label}.${dimension} must be named or explicitly declared notApplicable with a concrete reason`);
        }
      }
    }
    return scope;
  }

  if (!allowNotApplicable) {
    addError(errors, `${label}.notApplicable is allowed only in requirements[].requiredScope`);
    return scope;
  }
  if (!isObject(value.notApplicable)) {
    addError(errors, `${label}.notApplicable must be an object mapping dimensions to concrete reasons`);
    return scope;
  }

  for (const [dimension, reason] of Object.entries(value.notApplicable)) {
    if (!SCOPE_DIMENSIONS.includes(dimension) || dimension === 'subjects') {
      addError(errors, `${label}.notApplicable may name only stories, locales, viewports, states, or phases`);
      continue;
    }
    if (value[dimension] !== undefined) {
      addError(errors, `${label}.${dimension} cannot be both scoped and notApplicable`);
    }
    requireString(reason, `${label}.notApplicable.${dimension}`, errors);
  }

  for (const dimension of SCOPE_DIMENSIONS.filter(dimension => dimension !== 'subjects')) {
    if (value[dimension] === undefined && value.notApplicable[dimension] === undefined) {
      addError(errors, `${label}.${dimension} must be named or explicitly declared notApplicable with a concrete reason`);
    }
  }
  return scope;
}

function tupleCount(scope) {
  return Object.values(scope).reduce((count, values) => count * values.length, 1);
}

function expandScope(scope) {
  const dimensions = Object.keys(scope).filter(dimension => scope[dimension].length > 0);
  if (dimensions.length === 0) return [{}];
  const tuples = [{}];
  for (const dimension of dimensions) {
    const next = [];
    for (const tuple of tuples) {
      for (const value of scope[dimension]) next.push({ ...tuple, [dimension]: value });
    }
    tuples.splice(0, tuples.length, ...next);
  }
  return tuples;
}

function scopeCoversTuple(scope, tuple) {
  return Object.entries(tuple).every(([dimension, value]) =>
    Array.isArray(scope[dimension]) && scope[dimension].includes(value),
  );
}

function scopeTupleKey(tuple) {
  return JSON.stringify(Object.entries(tuple).sort(([left], [right]) => left.localeCompare(right)));
}

function validateCoverageGaps(value, requiredScope, evidenceScopes, label, errors) {
  const rows = requireArray(value, `${label}.coverageGaps`, errors, { min: 0 });
  const tupleTotal = tupleCount(requiredScope);
  if (tupleTotal > MAX_SCOPE_TUPLES) {
    addError(errors, `${label}.requiredScope expands to ${tupleTotal} tuples; split the ledger row into smaller auditable scopes`);
    return [];
  }

  const uncovered = new Map();
  for (const tuple of expandScope(requiredScope)) {
    if (!evidenceScopes.some(scope => scopeCoversTuple(scope, tuple))) uncovered.set(scopeTupleKey(tuple), tuple);
  }

  const declared = new Map();
  const findingIds = [];
  for (const [index, row] of rows.entries()) {
    const entryLabel = `${label}.coverageGaps[${index}]`;
    if (!isObject(row)) {
      addError(errors, `${entryLabel} must be an object`);
      continue;
    }
    const scope = validateScope(row.scope, `${entryLabel}.scope`, errors);
    for (const dimension of Object.keys(requiredScope)) {
      if (!Array.isArray(scope[dimension]) || scope[dimension].length === 0) {
        addError(errors, `${entryLabel}.scope.${dimension} must explicitly enumerate the missing values`);
        continue;
      }
      for (const candidate of scope[dimension]) {
        if (!requiredScope[dimension].includes(candidate)) {
          addError(errors, `${entryLabel}.scope.${dimension} includes value outside requiredScope: ${candidate}`);
        }
      }
    }
    for (const dimension of Object.keys(scope)) {
      if (!Object.hasOwn(requiredScope, dimension)) {
        addError(errors, `${entryLabel}.scope.${dimension} is not an applicable required-scope dimension`);
      }
    }
    const findingId = requireString(row.findingId, `${entryLabel}.findingId`, errors);
    requireString(row.reason, `${entryLabel}.reason`, errors);
    if (findingId) findingIds.push(findingId);
    for (const tuple of expandScope(scope)) {
      const key = scopeTupleKey(tuple);
      if (declared.has(key)) {
        addError(errors, `${entryLabel}.scope duplicates the coverage-gap tuple ${JSON.stringify(tuple)}`);
      } else {
        declared.set(key, tuple);
      }
    }
  }

  const undeclared = [...uncovered.entries()].filter(([key]) => !declared.has(key));
  const overdeclared = [...declared.entries()].filter(([key]) => !uncovered.has(key));
  if (undeclared.length > 0) {
    const preview = undeclared.slice(0, 6).map(([, tuple]) => JSON.stringify(tuple)).join(', ');
    const more = undeclared.length > 6 ? ` (+${undeclared.length - 6} more)` : '';
    addError(errors, `${label} has ${undeclared.length} required scope tuple(s) with no evidence or declared coverage gap: ${preview}${more}`);
  }
  if (overdeclared.length > 0) {
    const preview = overdeclared.slice(0, 6).map(([, tuple]) => JSON.stringify(tuple)).join(', ');
    const more = overdeclared.length > 6 ? ` (+${overdeclared.length - 6} more)` : '';
    addError(errors, `${label}.coverageGaps declares ${overdeclared.length} tuple(s) that evidence already covers or that are outside requiredScope: ${preview}${more}`);
  }
  return findingIds;
}

function validateEvidence(evidence, label, errors, { checkPaths }) {
  const rows = requireArray(evidence, label, errors);
  const scopes = [];
  for (const [index, row] of rows.entries()) {
    const entryLabel = `${label}[${index}]`;
    if (!isObject(row)) {
      addError(errors, `${entryLabel} must be an object`);
      continue;
    }
    normalizedRepoPath(row.path, `${entryLabel}.path`, errors, { checkExists: checkPaths });
    requireString(row.command, `${entryLabel}.command`, errors);
    requireString(row.observable, `${entryLabel}.observable`, errors);
    requireString(row.freshness, `${entryLabel}.freshness`, errors);
    const coverageRole = requireString(row.coverageRole, `${entryLabel}.coverageRole`, errors);
    if (coverageRole && !new Set(['COVERS', 'GAP_WITNESS']).has(coverageRole)) {
      addError(errors, `${entryLabel}.coverageRole must be COVERS or GAP_WITNESS`);
    }
    const scope = validateScope(row.scope, `${entryLabel}.scope`, errors);
    if (coverageRole === 'COVERS') scopes.push(scope);
  }
  return scopes;
}

function validateCounterChecks(counterChecks, label, errors, { checkPaths }) {
  const rows = requireArray(counterChecks, label, errors);
  for (const [index, row] of rows.entries()) {
    const entryLabel = `${label}[${index}]`;
    if (!isObject(row)) {
      addError(errors, `${entryLabel} must be an object`);
      continue;
    }
    requireString(row.claim, `${entryLabel}.claim`, errors);
    requireString(row.kind, `${entryLabel}.kind`, errors);
    normalizedRepoPath(row.path, `${entryLabel}.path`, errors, { checkExists: checkPaths });
    requireString(row.result, `${entryLabel}.result`, errors);
  }
}

function canonicalCss(value) {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, '')
    .replace(/;}/g, '}');
}

function wrapperConditions(css, atRule) {
  const matcher = new RegExp(`@${atRule}\\s*([^{}]+)\\{`, 'g');
  const conditions = [];
  for (const match of css.matchAll(matcher)) {
    const condition = match[1].trim().replace(/\s+/g, ' ');
    if (!conditions.includes(condition)) conditions.push(condition);
  }
  return conditions;
}

function valuesMatch(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateSemanticEnvelope(value, label, errors) {
  if (!isObject(value)) {
    addError(errors, `${label} must be an object`);
    return {};
  }
  const customProperties = value.customProperties;
  if (!isObject(customProperties)) {
    addError(errors, `${label}.customProperties must be an object`);
  }
  return {
    selector: requireString(value.selector, `${label}.selector`, errors),
    media: requireStringArray(value.media, `${label}.media`, errors),
    supports: requireStringArray(value.supports, `${label}.supports`, errors),
    layer: requireString(value.layer, `${label}.layer`, errors),
    specificity: requireString(value.specificity, `${label}.specificity`, errors),
    sourceOrder: requireString(value.sourceOrder, `${label}.sourceOrder`, errors),
    declarations: requireStringArray(value.declarations, `${label}.declarations`, errors, { min: 1 }),
    customProperties: isObject(customProperties)
      ? {
        reads: requireStringArray(customProperties.reads, `${label}.customProperties.reads`, errors),
        writes: requireStringArray(customProperties.writes, `${label}.customProperties.writes`, errors),
        fallbacks: requireStringArray(customProperties.fallbacks, `${label}.customProperties.fallbacks`, errors),
      }
      : {},
  };
}

function validateSemanticSide(value, label, errors, { checkPaths }) {
  if (!isObject(value)) {
    addError(errors, `${label} must be an object`);
    return { envelope: {} };
  }
  const artifact = normalizedRepoPath(value.artifact, `${label}.artifact`, errors, { checkExists: checkPaths });
  const rawRule = requireString(value.rawRule, `${label}.rawRule`, errors);
  if (checkPaths && artifact && rawRule) {
    try {
      const artifactText = readFileSync(resolve(ROOT, artifact), 'utf8');
      if (!canonicalCss(artifactText).includes(canonicalCss(rawRule))) {
        addError(errors, `${label}.rawRule is not retained verbatim in ${artifact}`);
      }
    } catch (error) {
      addError(errors, `${label}.artifact could not be read: ${error.message}`);
    }
  }
  const envelope = validateSemanticEnvelope(value.envelope, `${label}.envelope`, errors);
  if (rawRule) {
    const media = wrapperConditions(rawRule, 'media');
    const supports = wrapperConditions(rawRule, 'supports');
    if (!valuesMatch(media, envelope.media)) {
      addError(errors, `${label}.envelope.media does not match wrappers retained in ${label}.rawRule`);
    }
    if (!valuesMatch(supports, envelope.supports)) {
      addError(errors, `${label}.envelope.supports does not match wrappers retained in ${label}.rawRule`);
    }
  }
  return { artifact, rawRule, envelope };
}

function validateAllowedSemanticDeltas(value, before, after, label, errors, { checkPaths }) {
  const rows = requireArray(value, label, errors, { min: 0 });
  const allowed = new Map();
  for (const [index, row] of rows.entries()) {
    const entryLabel = `${label}[${index}]`;
    if (!isObject(row)) {
      addError(errors, `${entryLabel} must be an object`);
      continue;
    }
    const field = requireString(row.field, `${entryLabel}.field`, errors);
    if (field && !SEMANTIC_ENVELOPE_FIELDS.includes(field)) {
      addError(errors, `${entryLabel}.field must be one of ${SEMANTIC_ENVELOPE_FIELDS.join(', ')}`);
    }
    if (field && allowed.has(field)) addError(errors, `${entryLabel}.field duplicates ${field}`);
    normalizedRepoPath(row.ownerDecisionArtifact, `${entryLabel}.ownerDecisionArtifact`, errors, { checkExists: checkPaths });
    requireString(row.reason, `${entryLabel}.reason`, errors);
    if (field) allowed.set(field, row);
  }

  return allowed;
}

function validateObservedSemanticDeltas(value, label, errors) {
  const rows = requireArray(value, label, errors, { min: 0 });
  const observed = new Map();
  for (const [index, row] of rows.entries()) {
    const entryLabel = `${label}[${index}]`;
    if (!isObject(row)) {
      addError(errors, `${entryLabel} must be an object`);
      continue;
    }
    const field = requireString(row.field, `${entryLabel}.field`, errors);
    if (field && !SEMANTIC_ENVELOPE_FIELDS.includes(field)) {
      addError(errors, `${entryLabel}.field must be one of ${SEMANTIC_ENVELOPE_FIELDS.join(', ')}`);
    }
    if (field && observed.has(field)) addError(errors, `${entryLabel}.field duplicates ${field}`);
    const findingId = requireString(row.findingId, `${entryLabel}.findingId`, errors);
    requireString(row.reason, `${entryLabel}.reason`, errors);
    if (field) observed.set(field, { findingId });
  }
  return observed;
}

function validateSemanticDeltaAccounting(assessment, allowed, observed, before, after, label, errors) {
  for (const field of SEMANTIC_ENVELOPE_FIELDS) {
    const changed = !valuesMatch(before.envelope[field], after.envelope[field]);
    const ownerAuthorized = allowed.has(field);
    const recordedMismatch = observed.has(field);
    if (ownerAuthorized && recordedMismatch) {
      addError(errors, `${label}.${field} cannot be both owner-authorized and recorded as a finding`);
    }
    if (changed && !ownerAuthorized && !recordedMismatch) {
      addError(errors, `${label} leaves changed ${field} neither owner-authorized nor recorded as a finding`);
    }
    if (!changed && (ownerAuthorized || recordedMismatch)) {
      addError(errors, `${label} declares a delta for unchanged ${field}`);
    }
  }
  if (assessment === 'EQUIVALENT' && observed.size > 0) {
    addError(errors, `${label}.assessment EQUIVALENT cannot contain observedSemanticDeltas`);
  }
  if (assessment === 'MISMATCH_RECORDED' && observed.size === 0) {
    addError(errors, `${label}.assessment MISMATCH_RECORDED requires at least one observedSemanticDeltas entry`);
  }
}

function validateNegativeProbes(value, label, errors, { checkPaths, assessment }) {
  const rows = requireArray(value, label, errors);
  const findingIds = [];
  for (const [index, row] of rows.entries()) {
    const entryLabel = `${label}[${index}]`;
    if (!isObject(row)) {
      addError(errors, `${entryLabel} must be an object`);
      continue;
    }
    requireString(row.condition, `${entryLabel}.condition`, errors);
    requireString(row.command, `${entryLabel}.command`, errors);
    normalizedRepoPath(row.artifact, `${entryLabel}.artifact`, errors, { checkExists: checkPaths });
    const beforeOutcome = requireString(row.beforeOutcome, `${entryLabel}.beforeOutcome`, errors);
    const afterOutcome = requireString(row.afterOutcome, `${entryLabel}.afterOutcome`, errors);
    if (typeof row.equivalent !== 'boolean') {
      addError(errors, `${entryLabel}.equivalent must be true or false`);
      continue;
    }
    if (row.equivalent) {
      if (beforeOutcome && afterOutcome && beforeOutcome !== afterOutcome) {
        addError(errors, `${entryLabel} claims an equivalent negative probe but its outcomes differ`);
      }
      if (row.findingId !== undefined) {
        addError(errors, `${entryLabel}.findingId is only allowed when equivalent is false`);
      }
      continue;
    }
    if (assessment === 'EQUIVALENT') {
      addError(errors, `${entryLabel}.equivalent false requires assessment MISMATCH_RECORDED`);
    }
    if (beforeOutcome && afterOutcome && beforeOutcome === afterOutcome) {
      addError(errors, `${entryLabel} records a negative-probe mismatch but its outcomes are identical`);
    }
    const findingId = requireString(row.findingId, `${entryLabel}.findingId`, errors);
    if (findingId) findingIds.push(findingId);
  }
  return findingIds;
}

function escapedCssClass(candidate) {
  return candidate.replace(/[^a-zA-Z0-9_-]/g, character => `\\${character}`);
}

function extractCandidateRule(css, candidate) {
  const start = css.indexOf(`.${escapedCssClass(candidate)}`);
  if (start === -1) return '';
  const openBrace = css.indexOf('{', start);
  if (openBrace === -1) return '';
  let depth = 0;
  for (let index = openBrace; index < css.length; index++) {
    if (css[index] === '{') depth++;
    if (css[index] === '}') {
      depth--;
      if (depth === 0) return css.slice(start, index + 1);
    }
  }
  return '';
}

function installedTailwindVersion() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'node_modules', 'tailwindcss', 'package.json'), 'utf8')).version;
  } catch {
    return '';
  }
}

function tailwindCompilerDependencies(stderr, label, errors) {
  const markerIndex = stderr.lastIndexOf(TAILWIND_DEPENDENCY_MARKER);
  if (markerIndex === -1) {
    addError(errors, `${label}.compiler did not report the stylesheet dependencies it read`);
    return [];
  }
  try {
    const dependencies = JSON.parse(stderr.slice(markerIndex + TAILWIND_DEPENDENCY_MARKER.length));
    if (!Array.isArray(dependencies) || dependencies.some(dependency => !isNonBlankString(dependency))) {
      throw new Error('expected an array of absolute stylesheet paths');
    }
    return [...new Set(dependencies.map(dependency => resolve(dependency)))];
  } catch (error) {
    addError(errors, `${label}.compiler reported unreadable stylesheet dependencies: ${error.message}`);
    return [];
  }
}

function validateTailwindDependencySnapshot(dependencies, baseRevision, label, errors) {
  const nodeModulesRoot = resolve(ROOT, 'node_modules');
  const nodeModulesPrefix = `${nodeModulesRoot}${sep}`;
  let baseLock;
  let baseLockLoaded = false;

  function readBaseLock() {
    if (baseLockLoaded) return baseLock;
    baseLockLoaded = true;
    const lockText = readGitRevisionFile(baseRevision, 'package-lock.json', `${label}.compiler`, errors);
    if (!lockText) return null;
    try {
      baseLock = JSON.parse(lockText);
      return baseLock;
    } catch (error) {
      addError(errors, `${label}.compiler could not parse package-lock.json at the base revision: ${error.message}`);
      return null;
    }
  }

  function validateNodeModuleDependency(dependency) {
    const dependencyPath = relative(nodeModulesRoot, dependency);
    const segments = dependencyPath.split(sep);
    const packageSegmentCount = segments[0]?.startsWith('@') ? 2 : 1;
    const packagePath = join(nodeModulesRoot, ...segments.slice(0, packageSegmentCount));
    const lockKey = `node_modules/${segments.slice(0, packageSegmentCount).join('/')}`;
    try {
      const installed = JSON.parse(readFileSync(join(packagePath, 'package.json'), 'utf8'));
      const base = readBaseLock()?.packages?.[lockKey];
      if (!isNonBlankString(base?.version)) {
        addError(errors, `${label}.compiler dependency is not locked at the base revision: ${lockKey}`);
      } else if (installed.version !== base.version) {
        addError(errors, `${label}.compiler dependency version differs from the base revision: ${lockKey} (${installed.version} != ${base.version})`);
      }
    } catch (error) {
      addError(errors, `${label}.compiler dependency package metadata could not be read: ${lockKey} (${error.message})`);
    }
  }

  for (const dependency of dependencies) {
    if (dependency.startsWith(nodeModulesPrefix)) {
      validateNodeModuleDependency(dependency);
      continue;
    }

    const repositoryPath = relative(ROOT, dependency);
    if (repositoryPath === '' || repositoryPath === '..' || repositoryPath.startsWith(`..${sep}`)) {
      addError(errors, `${label}.compiler read an unpinned external stylesheet dependency: ${dependency}`);
      continue;
    }
    const normalizedPath = repositoryPath.replaceAll('\\', '/');
    const baseContent = readGitRevisionFile(baseRevision, normalizedPath, `${label}.compiler dependency`, errors);
    if (!baseContent) continue;
    try {
      const worktreeContent = readFileSync(dependency, 'utf8');
      if (worktreeContent !== baseContent) {
        addError(errors, `${label}.compiler dependency differs from the base revision: ${normalizedPath}`);
      }
    } catch (error) {
      addError(errors, `${label}.compiler dependency could not be read from the worktree: ${normalizedPath} (${error.message})`);
    }
  }
}

function validateTailwindCompiler(compiler, candidate, before, label, errors, { baseRevision }) {
  if (!isObject(compiler)) {
    addError(errors, `${label}.compiler must be an object`);
    return;
  }
  const kind = requireString(compiler.kind, `${label}.compiler.kind`, errors);
  requireString(compiler.command, `${label}.compiler.command`, errors);
  requireString(compiler.version, `${label}.compiler.version`, errors);
  const compilerCandidate = requireString(compiler.candidate, `${label}.compiler.candidate`, errors);
  if (compilerCandidate && candidate && compilerCandidate !== candidate) {
    addError(errors, `${label}.compiler.candidate must equal the exact removed candidate, not a sibling utility`);
  }
  if (candidate.includes(',')) {
    addError(errors, `${label}.candidate must name exactly one generated candidate; make one exact-semantics row per utility`);
  }
  if (kind !== 'TAILWIND_V4') {
    if (kind !== 'ARTIFACT_ONLY') addError(errors, `${label}.compiler.kind must be TAILWIND_V4 or ARTIFACT_ONLY`);
    return;
  }

  const installedVersion = installedTailwindVersion();
  const version = requireString(compiler.version, `${label}.compiler.version`, errors);
  if (installedVersion && version && version !== `tailwindcss ${installedVersion}`) {
    addError(errors, `${label}.compiler.version must equal the installed compiler version tailwindcss ${installedVersion}`);
  }
  if (!isObject(compiler.input)) {
    addError(errors, `${label}.compiler.input must identify the exact base-revision source file`);
    return;
  }
  const inputKind = requireString(compiler.input.kind, `${label}.compiler.input.kind`, errors);
  if (inputKind !== 'BASE_REVISION_FILE') {
    addError(errors, `${label}.compiler.input.kind must be BASE_REVISION_FILE`);
    return;
  }
  const inputPath = normalizedRepoPath(compiler.input.path, `${label}.compiler.input.path`, errors, { checkExists: false });
  const inputRevision = immutableCommit(compiler.input.revision, `${label}.compiler.input.revision`, errors);
  if (inputRevision && baseRevision && inputRevision !== baseRevision) {
    addError(errors, `${label}.compiler.input.revision must equal review.baseRevision`);
  }
  const inputCss = readGitRevisionFile(inputRevision, inputPath, `${label}.compiler.input`, errors);
  if (!inputCss || !candidate || candidate.includes(',')) return;

  const probeInputPath = join(ROOT, inputPath);
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', TAILWIND_PROBE_SCRIPT], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 10_000,
    maxBuffer: 2 * 1024 * 1024,
    env: {
      ...process.env,
      REVIEW_LEDGER_TAILWIND_BASE_DIR: ROOT,
      REVIEW_LEDGER_TAILWIND_INPUT_PATH: probeInputPath,
      REVIEW_LEDGER_TAILWIND_INPUT_CSS: inputCss,
      REVIEW_LEDGER_TAILWIND_CANDIDATE: candidate,
    },
  });
  if (result.status !== 0) {
    addError(errors, `${label}.compiler could not compile the exact candidate: ${(result.stderr || result.stdout || 'unknown failure').trim()}`);
    return;
  }
  const dependencies = tailwindCompilerDependencies(result.stderr, label, errors);
  validateTailwindDependencySnapshot(dependencies, baseRevision, label, errors);
  const compiled = extractCandidateRule(result.stdout, candidate);
  if (!compiled) {
    addError(errors, `${label}.compiler output does not contain the exact candidate`);
    return;
  }
  if (canonicalCss(compiled) !== canonicalCss(before.rawRule)) {
    addError(errors, `${label}.before.rawRule does not equal the exact compiled rule for the candidate`);
  }
  const media = wrapperConditions(compiled, 'media');
  const supports = wrapperConditions(compiled, 'supports');
  if (!valuesMatch(media, before.envelope.media)) {
    addError(errors, `${label}.before.envelope.media does not match the exact compiled candidate`);
  }
  if (!valuesMatch(supports, before.envelope.supports)) {
    addError(errors, `${label}.before.envelope.supports does not match the exact compiled candidate`);
  }
}

function validateExactSemantics(value, label, errors, { checkPaths, baseRevision }) {
  if (!isObject(value)) {
    addError(errors, `${label} must be an object when exact generated semantics are required`);
    return { observedFindingIds: [], negativeProbeFindingIds: [] };
  }
  const candidate = requireString(value.candidate, `${label}.candidate`, errors);
  const assessment = requireString(value.assessment, `${label}.assessment`, errors);
  if (assessment && !new Set(['EQUIVALENT', 'MISMATCH_RECORDED']).has(assessment)) {
    addError(errors, `${label}.assessment must be EQUIVALENT or MISMATCH_RECORDED`);
  }
  const before = validateSemanticSide(value.before, `${label}.before`, errors, { checkPaths });
  const after = validateSemanticSide(value.after, `${label}.after`, errors, { checkPaths });
  validateTailwindCompiler(value.compiler, candidate, before, label, errors, { baseRevision });
  const allowed = validateAllowedSemanticDeltas(value.allowedSemanticDeltas, before, after, `${label}.allowedSemanticDeltas`, errors, { checkPaths });
  const observed = validateObservedSemanticDeltas(value.observedSemanticDeltas, `${label}.observedSemanticDeltas`, errors);
  validateSemanticDeltaAccounting(assessment, allowed, observed, before, after, label, errors);
  const negativeProbeFindingIds = validateNegativeProbes(value.negativeProbes, `${label}.negativeProbes`, errors, { checkPaths, assessment });
  return {
    observedFindingIds: [...observed.values()].map(row => row.findingId).filter(Boolean),
    negativeProbeFindingIds,
  };
}

function validateRequirement(requirement, index, errors, { checkPaths, baseRevision }) {
  const label = `requirements[${index}]`;
  if (!isObject(requirement)) {
    addError(errors, `${label} must be an object`);
    return { id: '', priority: '', status: '', findingIds: [], coverageGapFindingIds: [], observedSemanticFindingIds: [], negativeProbeFindingIds: [] };
  }

  const id = requireString(requirement.id, `${label}.id`, errors);
  const priority = requireString(requirement.priority, `${label}.priority`, errors);
  if (priority && !VALID_PRIORITIES.has(priority)) addError(errors, `${label}.priority must be one of ${[...VALID_PRIORITIES].join(', ')}`);
  const status = requireString(requirement.status, `${label}.status`, errors);
  if (status && !VALID_STATUSES.has(status)) addError(errors, `${label}.status must be one of ${[...VALID_STATUSES].join(', ')}`);
  const findingIds = requireStringArray(requirement.findingIds, `${label}.findingIds`, errors, { min: 0 });

  if (!isObject(requirement.finalSubject)) {
    addError(errors, `${label}.finalSubject must be an object`);
  } else {
    normalizedRepoPath(requirement.finalSubject.path, `${label}.finalSubject.path`, errors, { checkExists: checkPaths });
    requireString(requirement.finalSubject.symbol, `${label}.finalSubject.symbol`, errors);
    const hunks = requireArray(requirement.finalSubject.diffHunks, `${label}.finalSubject.diffHunks`, errors);
    for (const [hunkIndex, hunk] of hunks.entries()) requireString(hunk, `${label}.finalSubject.diffHunks[${hunkIndex}]`, errors);
  }

  const requiredScope = validateScope(requirement.requiredScope, `${label}.requiredScope`, errors, { allowNotApplicable: true });
  if (!Array.isArray(requiredScope.subjects) || requiredScope.subjects.length === 0) {
    addError(errors, `${label}.requiredScope.subjects must name the final subject(s) this row covers`);
  }
  const evidenceScopes = validateEvidence(requirement.evidence, `${label}.evidence`, errors, { checkPaths });
  const coverageGapFindingIds = validateCoverageGaps(requirement.coverageGaps, requiredScope, evidenceScopes, label, errors);
  if (coverageGapFindingIds.length > 0 && status === 'VERIFIED') {
    addError(errors, `${label}.status cannot be VERIFIED while coverageGaps are declared`);
  }

  if (PRIMARY_PRIORITIES.has(priority)) validateCounterChecks(requirement.counterChecks, `${label}.counterChecks`, errors, { checkPaths });
  else if (requirement.counterChecks !== undefined) validateCounterChecks(requirement.counterChecks, `${label}.counterChecks`, errors, { checkPaths });

  if (PRIMARY_PRIORITIES.has(priority) && !isObject(requirement.semanticCheck)) {
    addError(errors, `${label}.semanticCheck is mandatory for every primary criterion`);
  } else if (isObject(requirement.semanticCheck)) {
    const mode = requireString(requirement.semanticCheck.mode, `${label}.semanticCheck.mode`, errors);
    if (!new Set(['EXACT_GENERATED', 'NOT_APPLICABLE']).has(mode)) {
      addError(errors, `${label}.semanticCheck.mode must be EXACT_GENERATED or NOT_APPLICABLE`);
    }
    requireString(requirement.semanticCheck.reason, `${label}.semanticCheck.reason`, errors);
    if (mode === 'EXACT_GENERATED' && requirement.exactGeneratedSemantics === undefined) {
      addError(errors, `${label}.exactGeneratedSemantics is required when semanticCheck.mode is EXACT_GENERATED`);
    }
  }

  const semanticReferences = requirement.exactGeneratedSemantics !== undefined
    ? validateExactSemantics(requirement.exactGeneratedSemantics, `${label}.exactGeneratedSemantics`, errors, { checkPaths, baseRevision })
    : { observedFindingIds: [], negativeProbeFindingIds: [] };
  if (semanticReferences.observedFindingIds.length > 0 && status === 'VERIFIED') {
    addError(errors, `${label}.status cannot be VERIFIED while observedSemanticDeltas are declared`);
  }

  return {
    id,
    priority,
    status,
    findingIds,
    coverageGapFindingIds,
    observedSemanticFindingIds: semanticReferences.observedFindingIds,
    negativeProbeFindingIds: semanticReferences.negativeProbeFindingIds,
  };
}

function validateFinding(finding, index, errors) {
  const label = `findings[${index}]`;
  if (!isObject(finding)) {
    addError(errors, `${label} must be an object`);
    return { id: '', priority: '', status: '', requirementIds: [] };
  }
  const id = requireString(finding.id, `${label}.id`, errors);
  const priority = requireString(finding.priority, `${label}.priority`, errors);
  if (priority && !VALID_PRIORITIES.has(priority)) addError(errors, `${label}.priority must be one of ${[...VALID_PRIORITIES].join(', ')}`);
  const status = requireString(finding.status, `${label}.status`, errors);
  if (status && !new Set(['OPEN', 'RESOLVED', 'NOTE']).has(status)) addError(errors, `${label}.status must be OPEN, RESOLVED, or NOTE`);
  requireString(finding.requirements, `${label}.requirements`, errors);
  const requirementIds = requireStringArray(finding.requirementIds, `${label}.requirementIds`, errors, { min: 1 });
  requireString(finding.evidence, `${label}.evidence`, errors);
  return { id, priority, status, requirementIds };
}

function validateRecordedFindingReference(findingId, row, findingsById, decision, kind, fileLabel, errors) {
  const finding = findingsById.get(findingId);
  const label = `${fileLabel}: ${row.id} ${kind} finding ${findingId || '<missing>'}`;
  if (!finding) {
    addError(errors, `${label} must reference an existing finding`);
    return;
  }
  if (!PRIMARY_PRIORITIES.has(finding.priority) || finding.status !== 'OPEN') {
    addError(errors, `${label} must reference an OPEN P0/P1/P2 finding`);
  }
  if (!finding.requirementIds.includes(row.id)) {
    addError(errors, `${label} must list ${row.id} in finding.requirementIds`);
  }
  if (decision === 'APPROVED' || decision === 'APPROVED WITH NOTES') {
    addError(errors, `${label} is forbidden for an approval decision`);
  }
}

function validateFindingReferences(rows, findings, decision, fileLabel, errors) {
  const findingsById = new Map();
  for (const finding of findings) {
    if (!finding.id) continue;
    if (findingsById.has(finding.id)) {
      addError(errors, `${fileLabel}.findings contains duplicate id ${finding.id}`);
      continue;
    }
    findingsById.set(finding.id, finding);
  }
  const requirementIds = new Set(rows.map(row => row.id).filter(Boolean));
  for (const finding of findings) {
    for (const requirementId of finding.requirementIds) {
      if (!requirementIds.has(requirementId)) {
        addError(errors, `${fileLabel}: finding ${finding.id || '<missing>'} references unknown requirement id ${requirementId}`);
      }
    }
  }
  for (const row of rows) {
    const rowFindings = row.findingIds.map(findingId => findingsById.get(findingId)).filter(Boolean);
    for (const findingId of row.findingIds) {
      const finding = findingsById.get(findingId);
      if (!finding) {
        addError(errors, `${fileLabel}: ${row.id} findingIds references unknown finding ${findingId}`);
      } else if (!finding.requirementIds.includes(row.id)) {
        addError(errors, `${fileLabel}: ${row.id} findingIds entry ${findingId} must list ${row.id} in finding.requirementIds`);
      }
    }
    if (PRIMARY_PRIORITIES.has(row.priority) && row.status !== 'VERIFIED' && !rowFindings.some(finding => PRIMARY_PRIORITIES.has(finding.priority) && finding.status === 'OPEN')) {
      addError(errors, `${fileLabel}: non-VERIFIED primary ${row.id} must name an OPEN P0/P1/P2 finding in findingIds`);
    }
    for (const findingId of row.coverageGapFindingIds) {
      if (!row.findingIds.includes(findingId)) {
        addError(errors, `${fileLabel}: ${row.id} coverage gap finding ${findingId} must also appear in requirement.findingIds`);
      }
      validateRecordedFindingReference(findingId, row, findingsById, decision, 'coverage gap', fileLabel, errors);
    }
    for (const findingId of row.observedSemanticFindingIds) {
      if (!row.findingIds.includes(findingId)) {
        addError(errors, `${fileLabel}: ${row.id} semantic mismatch finding ${findingId} must also appear in requirement.findingIds`);
      }
      validateRecordedFindingReference(findingId, row, findingsById, decision, 'semantic mismatch', fileLabel, errors);
    }
    for (const findingId of row.negativeProbeFindingIds) {
      if (!row.observedSemanticFindingIds.includes(findingId)) {
        addError(errors, `${fileLabel}: ${row.id} negative-probe mismatch finding ${findingId} must also record an observed semantic delta`);
      }
      validateRecordedFindingReference(findingId, row, findingsById, decision, 'negative-probe mismatch', fileLabel, errors);
    }
  }
}

function validateCoverageSummary(review, rows, findings, fileLabel, errors) {
  if (!isObject(review.coverage)) {
    addError(errors, `${fileLabel}.review.coverage must be an object`);
    return;
  }
  const primaryRows = rows.filter(row => PRIMARY_PRIORITIES.has(row.priority));
  const expected = {
    total: primaryRows.length,
    verified: primaryRows.filter(row => row.status === 'VERIFIED').length,
    unverified: primaryRows.filter(row => row.status !== 'VERIFIED').length,
    openP0: findings.filter(finding => finding.priority === 'P0' && finding.status === 'OPEN').length,
    openP1: findings.filter(finding => finding.priority === 'P1' && finding.status === 'OPEN').length,
    openP2: findings.filter(finding => finding.priority === 'P2' && finding.status === 'OPEN').length,
  };
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (!Number.isInteger(review.coverage[field]) || review.coverage[field] !== expectedValue) {
      addError(errors, `${fileLabel}.review.coverage.${field} must equal the ledger-derived value ${expectedValue}`);
    }
  }
}

function validateGateReceipt(review, fileLabel, priorErrors, errors) {
  if (!isObject(review.ledgerGate)) {
    addError(errors, `${fileLabel}.review.ledgerGate must record the final validator result`);
    return;
  }
  const receiptErrorCount = errors.length;
  const command = requireString(review.ledgerGate.command, `${fileLabel}.review.ledgerGate.command`, errors);
  if (command && !command.includes('check:review-ledger')) {
    addError(errors, `${fileLabel}.review.ledgerGate.command must invoke check:review-ledger for this ledger`);
  }
  const status = requireString(review.ledgerGate.status, `${fileLabel}.review.ledgerGate.status`, errors);
  if (!new Set(['PASSED', 'FAILED']).has(status)) {
    addError(errors, `${fileLabel}.review.ledgerGate.status must be PASSED or FAILED`);
  }
  const exitCode = review.ledgerGate.exitCode;
  if (exitCode !== 0 && exitCode !== 1) {
    addError(errors, `${fileLabel}.review.ledgerGate.exitCode must be 0 or 1`);
  }
  const expectedStatus = priorErrors.length === 0 && errors.length === receiptErrorCount ? 'PASSED' : 'FAILED';
  const expectedExitCode = expectedStatus === 'PASSED' ? 0 : 1;
  if (status && status !== expectedStatus) {
    addError(errors, `${fileLabel}.review.ledgerGate.status claims ${status}, but this ledger evaluates to ${expectedStatus}`);
  }
  if ((exitCode === 0 || exitCode === 1) && exitCode !== expectedExitCode) {
    addError(errors, `${fileLabel}.review.ledgerGate.exitCode claims ${exitCode}, but this ledger evaluates to ${expectedExitCode}`);
  }
}

function validateSupersedes(review, fileLabel, errors, { checkPaths }) {
  const paths = requireStringArray(review.supersedes, `${fileLabel}.review.supersedes`, errors, { min: 0 });
  for (const [index, path] of paths.entries()) {
    const normalized = normalizedRepoPath(path, `${fileLabel}.review.supersedes[${index}]`, errors, { checkExists: checkPaths });
    if (normalized && !normalized.endsWith('.review-ledger.SUPERSEDED.json')) {
      addError(errors, `${fileLabel}.review.supersedes[${index}] must name a retained .review-ledger.SUPERSEDED.json artifact`);
    }
  }
  return paths;
}

function validateLedger(ledger, fileLabel, { checkPaths = true, requireApproval = false } = {}) {
  const errors = [];
  let baseRevision = '';
  if (!isObject(ledger)) return [`${fileLabel}: root must be an object`];

  if (ledger.schemaVersion !== SCHEMA_VERSION) addError(errors, `${fileLabel}.schemaVersion must equal ${SCHEMA_VERSION}`);
  requireString(ledger.task, `${fileLabel}.task`, errors);

  if (!isObject(ledger.review)) {
    addError(errors, `${fileLabel}.review must be an object`);
  } else {
    const decision = requireString(ledger.review.decision, `${fileLabel}.review.decision`, errors);
    if (decision && !VALID_DECISIONS.has(decision)) addError(errors, `${fileLabel}.review.decision is not an allowed decision`);
    baseRevision = immutableCommit(ledger.review.baseRevision, `${fileLabel}.review.baseRevision`, errors);
    requireString(ledger.review.reviewedRevision, `${fileLabel}.review.reviewedRevision`, errors);
    const reviewedPaths = requireArray(ledger.review.reviewedPaths, `${fileLabel}.review.reviewedPaths`, errors);
    for (const [index, path] of reviewedPaths.entries()) normalizedRepoPath(path, `${fileLabel}.review.reviewedPaths[${index}]`, errors, { checkExists: checkPaths });
    validateSupersedes(ledger.review, fileLabel, errors, { checkPaths });
  }

  const requirements = requireArray(ledger.requirements, `${fileLabel}.requirements`, errors);
  const rows = requirements.map((requirement, index) => validateRequirement(requirement, index, errors, { checkPaths, baseRevision }));
  const ids = new Set();
  for (const row of rows) {
    if (!row.id) continue;
    if (ids.has(row.id)) addError(errors, `${fileLabel}.requirements contains duplicate id ${row.id}`);
    ids.add(row.id);
  }

  const findings = requireArray(ledger.findings, `${fileLabel}.findings`, errors, { min: 0 });
  const findingRows = findings.map((finding, index) => validateFinding(finding, index, errors));
  const decision = ledger.review?.decision;
  validateFindingReferences(rows, findingRows, decision, fileLabel, errors);

  if (isObject(ledger.review)) validateCoverageSummary(ledger.review, rows, findingRows, fileLabel, errors);

  if (!isObject(ledger.handoff)) {
    addError(errors, `${fileLabel}.handoff must be an object`);
  } else {
    const commitPush = requireString(ledger.handoff.commitPush, `${fileLabel}.handoff.commitPush`, errors);
    if (!new Set(['ALLOWED', 'PROHIBITED']).has(commitPush)) addError(errors, `${fileLabel}.handoff.commitPush must be ALLOWED or PROHIBITED`);
  }

  if (!isObject(ledger.attestation)) {
    addError(errors, `${fileLabel}.attestation must be an object`);
  } else {
    const lowest = requireString(ledger.attestation.lowestEvidenceRequirement, `${fileLabel}.attestation.lowestEvidenceRequirement`, errors);
    if (lowest && !ids.has(lowest)) addError(errors, `${fileLabel}.attestation.lowestEvidenceRequirement must reference a requirement id`);
    requireString(ledger.attestation.reviewer, `${fileLabel}.attestation.reviewer`, errors);
  }

  const approval = decision === 'APPROVED' || decision === 'APPROVED WITH NOTES';
  if (requireApproval && !approval) {
    addError(errors, `${fileLabel}: reviewable PR requires APPROVED or APPROVED WITH NOTES, received ${decision || '<missing>'}`);
  }
  if (approval) {
    for (const row of rows) {
      if (PRIMARY_PRIORITIES.has(row.priority) && row.status !== 'VERIFIED') {
        addError(errors, `${fileLabel}: ${decision} is forbidden while ${row.id} (${row.priority}) is ${row.status || 'missing status'}`);
      }
    }
    for (const finding of findingRows) {
      if (PRIMARY_PRIORITIES.has(finding.priority) && finding.status === 'OPEN') {
        addError(errors, `${fileLabel}: ${decision} is forbidden with an OPEN ${finding.priority} finding`);
      }
    }
  } else if (ledger.handoff?.commitPush !== 'PROHIBITED') {
    addError(errors, `${fileLabel}: non-approved decision ${decision || '<missing>'} must prohibit commit/push handoff`);
  }

  if (isObject(ledger.review)) validateGateReceipt(ledger.review, fileLabel, [...errors], errors);

  return errors;
}

function walkFilesWithSuffix(dir, suffix, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walkFilesWithSuffix(full, suffix, out);
    else if (entry.endsWith(suffix)) out.push(full);
  }
  return out;
}

function walkLedgers(dir, out = []) {
  return walkFilesWithSuffix(dir, '.review-ledger.json', out);
}

function readLedger(path, errors) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    addError(errors, `${relative(ROOT, path)}: invalid JSON — ${error.message}`);
    return null;
  }
}

function gitDiffNames(base) {
  const result = spawnSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || 'git diff failed').trim());
  return result.stdout.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function isReviewableChange(path) {
  return path.startsWith('src/') ||
    path.startsWith('scripts/') ||
    path.startsWith('tasks/') ||
    path.startsWith('.github/workflows/') ||
    path === 'package.json' ||
    path === 'eslint.config.mjs' ||
    path === 'docs/agent-contract.md' ||
    path === 'docs/orchestrator-procedures.md' ||
    path === 'docs/orchestrator-role.md' ||
    path === 'docs/qa-profiles.md' ||
    path === 'docs/storybook-governance.md' ||
    path === 'docs/critical-flow-registry.md' ||
    path === 'docs/review-ledger.schema.json' ||
    path === 'docs/review-ledger-template.json' ||
    path.startsWith('docs/reviews/');
}

function validFixture({
  status = 'VERIFIED',
  decision = 'APPROVED',
  includeMedia = true,
  completeScope = true,
  handoff = 'ALLOWED',
  declareUnusedScopes = true,
  includeSupports = true,
  exactCandidate = true,
  multipleCandidates = false,
  preserveNegativeOutcome = true,
  dropAfterMedia = false,
  compilerInputRevision = currentHeadRevision(),
  wrongCoverage = false,
  recordedMismatch = false,
  recordedCoverageGap = false,
  ledgerGateCommand = 'npm run check:review-ledger -- --file docs/reviews/fixture.review-ledger.json',
  ledgerGateStatus = 'PASSED',
  ledgerGateExitCode = 0,
} = {}) {
  const baseRevision = currentHeadRevision();
  const scope = completeScope
    ? { subjects: ['fixture subject'], stories: ['Pattern', 'Primitive'], phases: ['before', 'after'] }
    : { subjects: ['fixture subject'], stories: ['Pattern', 'Primitive'], phases: ['before', 'after'] };
  if (declareUnusedScopes) {
    scope.notApplicable = {
      locales: 'fixture has no user-facing locale dimension',
      viewports: 'fixture is not rendered UI',
      states: 'fixture has no independent runtime state dimension',
    };
  }
  const evidenceScope = recordedCoverageGap
    ? { subjects: ['fixture subject'], stories: ['Pattern'], phases: ['before', 'after'] }
    : completeScope
    ? { subjects: ['fixture subject'], stories: ['Pattern', 'Primitive'], phases: ['before', 'after'] }
    : { subjects: ['fixture subject'], stories: ['Pattern'], phases: ['before'] };
  const afterDropsMedia = dropAfterMedia || recordedMismatch;
  const effectiveStatus = recordedMismatch || recordedCoverageGap ? 'UNVERIFIED' : status;
  const effectiveDecision = recordedMismatch || recordedCoverageGap ? 'NEEDS REVISION' : decision;
  const effectiveHandoff = recordedMismatch || recordedCoverageGap ? 'PROHIBITED' : handoff;
  const candidate = multipleCandidates
    ? 'group-hover:[--text-color:var(--primary)], group-hover:opacity-100'
    : 'group-hover:[--text-color:var(--primary)]';
  return {
    schemaVersion: SCHEMA_VERSION,
    task: 'fixture',
    review: {
      decision: effectiveDecision,
      baseRevision,
      reviewedRevision: 'fixture-final',
      reviewedPaths: ['package.json'],
      supersedes: [],
      coverage: wrongCoverage
        ? { total: 1, verified: 0, unverified: 1, openP0: 0, openP1: 0, openP2: 0 }
        : { total: 1, verified: effectiveStatus === 'VERIFIED' ? 1 : 0, unverified: effectiveStatus === 'VERIFIED' ? 0 : 1, openP0: recordedMismatch || recordedCoverageGap ? 1 : 0, openP1: 0, openP2: 0 },
      ledgerGate: { command: ledgerGateCommand, status: ledgerGateStatus, exitCode: ledgerGateExitCode },
    },
    requirements: [{
      id: 'AC1',
      priority: 'P0',
      status: effectiveStatus,
      findingIds: recordedMismatch || recordedCoverageGap ? ['F1'] : [],
      finalSubject: { path: 'package.json', symbol: 'fixture', diffHunks: ['package.json:1'] },
      requiredScope: scope,
      evidence: [{ path: 'package.json', command: 'node fixture', observable: 'fixture result', freshness: 'final', coverageRole: 'COVERS', scope: evidenceScope }],
      coverageGaps: recordedCoverageGap ? [{
        scope: { subjects: ['fixture subject'], stories: ['Primitive'], phases: ['before', 'after'] },
        findingId: 'F1',
        reason: 'The fixture deliberately retains this uncovered tuple as an open review finding.',
      }] : [],
      counterChecks: [{ claim: 'fixture counterexample', kind: 'EXECUTED', path: 'package.json', result: 'fixture passed' }],
      semanticCheck: { mode: 'EXACT_GENERATED', reason: 'fixture requires exact generated semantics' },
      exactGeneratedSemantics: {
        candidate,
        assessment: recordedMismatch ? 'MISMATCH_RECORDED' : 'EQUIVALENT',
        compiler: {
          kind: 'TAILWIND_V4',
          command: 'node --input-type=module semantic probe',
          version: `tailwindcss ${installedTailwindVersion()}`,
          input: { kind: 'BASE_REVISION_FILE', path: 'src/app/globals.css', revision: compilerInputRevision },
          candidate: exactCandidate ? candidate : 'group-hover:opacity-100',
        },
        before: {
          artifact: 'scripts/check-review-ledger.mjs',
          rawRule: SELF_TEST_TAILWIND_RULE,
          envelope: {
            selector: 'ancestor hover descendant relation',
            media: includeMedia ? ['(hover: hover)'] : [],
            supports: includeSupports ? [] : ['(color: color-mix(in lab, red, red))'],
            layer: '@layer utilities',
            specificity: '(0,1,0)',
            sourceOrder: 'not decisive',
            declarations: ['--text-color: var(--primary)'],
            customProperties: { reads: ['--primary'], writes: ['--text-color'], fallbacks: [] },
          },
        },
        after: {
          artifact: 'scripts/check-review-ledger.mjs',
          rawRule: afterDropsMedia ? SELF_TEST_UNGUARDED_AFTER_RULE : SELF_TEST_AFTER_RULE,
          envelope: {
            selector: 'ancestor hover descendant relation',
            media: afterDropsMedia ? [] : ['(hover: hover)'],
            supports: [],
            layer: '@layer utilities',
            specificity: '(0,1,0)',
            sourceOrder: 'not decisive',
            declarations: ['--text-color: var(--primary)'],
            customProperties: { reads: ['--primary'], writes: ['--text-color'], fallbacks: [] },
          },
        },
        allowedSemanticDeltas: [],
        observedSemanticDeltas: recordedMismatch ? [{
          field: 'media',
          findingId: 'F1',
          reason: 'The fixture deliberately records the missing hover guard as a review finding.',
        }] : [],
        negativeProbes: [{
          condition: 'hover: none',
          command: 'fixture negative probe',
          artifact: 'package.json',
          beforeOutcome: 'declaration inactive',
          afterOutcome: recordedMismatch || !preserveNegativeOutcome ? 'declaration active' : 'declaration inactive',
          equivalent: !recordedMismatch,
          ...(recordedMismatch ? { findingId: 'F1' } : {}),
        }],
      },
    }],
    findings: recordedMismatch || recordedCoverageGap ? [{
      id: 'F1',
      priority: 'P0',
      status: 'OPEN',
      requirements: 'AC1',
      requirementIds: ['AC1'],
      evidence: 'The fixture retains a finding-backed non-approval defect.',
    }] : [],
    handoff: { commitPush: effectiveHandoff },
    attestation: { lowestEvidenceRequirement: 'AC1', reviewer: 'fixture' },
  };
}

function runSelfTest() {
  const cases = [
    ['valid approval', validFixture(), true],
    ['finding-backed semantic mismatch validates locally as needs revision', validFixture({ recordedMismatch: true }), true],
    ['finding-backed coverage gap validates locally as needs revision', validFixture({ recordedCoverageGap: true }), true],
    ['unverified primary AC blocks approval', validFixture({ status: 'UNVERIFIED' }), false],
    ['non-verified primary must cite an open finding', validFixture({ status: 'UNVERIFIED', decision: 'NEEDS REVISION', handoff: 'PROHIBITED' }), false],
    ['missing tuple coverage blocks approval', validFixture({ completeScope: false }), false],
    ['compiled media guard mismatch blocks exact semantics', validFixture({ includeMedia: false }), false],
    ['dropped after media guard blocks exact semantics', validFixture({ dropAfterMedia: true }), false],
    ['compiled supports mismatch blocks exact semantics', validFixture({ includeSupports: false }), false],
    ['sibling candidate blocks exact semantics', validFixture({ exactCandidate: false }), false],
    ['multiple candidates in one semantics row are rejected', validFixture({ multipleCandidates: true }), false],
    ['non-immutable compiler input blocks exact semantics', validFixture({ compilerInputRevision: '0'.repeat(40) }), false],
    ['negative guard outcome mismatch blocks exact semantics', validFixture({ preserveNegativeOutcome: false }), false],
    ['recorded semantic mismatch cannot make a reviewable PR green', validFixture({ recordedMismatch: true }), false, true],
    ['recorded coverage gap cannot make a reviewable PR green', validFixture({ recordedCoverageGap: true }), false, true],
    ['incorrect coverage summary blocks approval', validFixture({ wrongCoverage: true }), false],
    ['passed gate receipt cannot conceal a failed ledger', validFixture({ status: 'UNVERIFIED', ledgerGateStatus: 'PASSED', ledgerGateExitCode: 0 }), false],
    ['invalid gate command invalidates a passed ledger', validFixture({ ledgerGateCommand: 'npm test' }), false],
    ['missing explicit not-applicable scope declaration blocks approval', validFixture({ declareUnusedScopes: false }), false],
    ['non-approved decision prohibits handoff', validFixture({ decision: 'PARTIALLY VERIFIED', handoff: 'ALLOWED' }), false],
    ['CI rejects a non-approved reviewable PR ledger', validFixture({ decision: 'PARTIALLY VERIFIED', handoff: 'PROHIBITED' }), false, true],
  ];
  let failures = 0;
  for (const [name, fixture, shouldPass, requireApproval] of cases) {
    const errors = validateLedger(fixture, `fixture:${name}`, { checkPaths: true, requireApproval: Boolean(requireApproval) });
    const passed = errors.length === 0;
    if (passed !== shouldPass) {
      failures++;
      console.error(`  FAIL ${name}: expected ${shouldPass ? 'pass' : 'fail'}, got ${passed ? 'pass' : 'fail'}`);
      for (const error of errors) console.error(`    ${error}`);
    } else {
      console.log(`  PASS ${name}`);
    }
  }
  if (failures > 0) {
    console.error(`❌ check:review-ledger self-test FAILED — ${failures} unexpected result(s)`);
    return 1;
  }
  console.log('✅ check:review-ledger self-test PASSED — valid approval and two finding-backed non-approval ledgers accepted; eighteen failing arms rejected');
  return 0;
}

function parseFileArgument() {
  const index = args.indexOf('--file');
  if (index === -1) return null;
  if (!args[index + 1]) throw new Error('--file requires a repository-relative ledger path');
  return resolve(ROOT, args[index + 1]);
}

function runValidation() {
  const ciMode = args.includes('--ci');
  const explicitFile = parseFileArgument();
  let ledgerPaths;
  let requireApproval = false;
  const draftPaths = !explicitFile && !ciMode ? walkFilesWithSuffix(REVIEW_DIR, '.review-ledger.DRAFT.json') : [];
  const supersededPaths = !explicitFile && !ciMode ? walkFilesWithSuffix(REVIEW_DIR, '.review-ledger.SUPERSEDED.json') : [];

  if (explicitFile) {
    ledgerPaths = [explicitFile];
  } else if (ciMode) {
    const base = process.env.REVIEW_LEDGER_BASE_SHA;
    if (!isNonBlankString(base)) throw new Error('--ci requires REVIEW_LEDGER_BASE_SHA from the PR base commit');
    const changed = gitDiffNames(base);
    const changedLedgers = changed
      .filter(path => path.startsWith('docs/reviews/') && path.endsWith('.review-ledger.json'))
      .map(path => resolve(ROOT, path));
    const reviewable = changed.filter(isReviewableChange);
    if (reviewable.length > 0 && changedLedgers.length === 0) {
      throw new Error(`reviewable PR changes require a changed docs/reviews/*.review-ledger.json; found: ${reviewable.join(', ')}`);
    }
    ledgerPaths = changedLedgers;
    requireApproval = reviewable.length > 0;
  } else {
    ledgerPaths = walkLedgers(REVIEW_DIR);
  }

  if (ledgerPaths.length === 0) {
    if (draftPaths.length > 0 || supersededPaths.length > 0) {
      if (draftPaths.length > 0) {
        console.error(`❌ check:review-ledger FAILED — draft ledger(s) are inside docs/reviews and cannot be excluded from the retained-ledger gate: ${draftPaths.map(path => relative(ROOT, path).replaceAll('\\', '/')).join(', ')}`);
      }
      if (supersededPaths.length > 0) {
        console.error(`❌ check:review-ledger FAILED — superseded ledger(s) require a retained v4 successor that names them in review.supersedes: ${supersededPaths.map(path => relative(ROOT, path).replaceAll('\\', '/')).join(', ')}`);
      }
      return 1;
    }
    console.log('✅ check:review-ledger PASSED — no retained ledger requires validation');
    return 0;
  }

  let failures = 0;
  const validLedgers = [];
  if (draftPaths.length > 0) {
    failures++;
    console.error(`❌ check:review-ledger FAILED — draft ledger(s) are inside docs/reviews and cannot be excluded from the retained-ledger gate: ${draftPaths.map(path => relative(ROOT, path).replaceAll('\\', '/')).join(', ')}`);
  }
  for (const ledgerPath of ledgerPaths) {
    const label = relative(ROOT, ledgerPath).replaceAll('\\', '/');
    if (!existsSync(ledgerPath)) {
      console.error(`❌ ${label}: ledger file does not exist`);
      failures++;
      continue;
    }
    const parseErrors = [];
    const ledger = readLedger(ledgerPath, parseErrors);
    const errors = ledger ? [...parseErrors, ...validateLedger(ledger, label, { checkPaths: true, requireApproval })] : parseErrors;
    if (errors.length === 0) {
      console.log(`✅ ${label} — valid fail-closed review ledger`);
      validLedgers.push(ledger);
    } else {
      failures++;
      console.error(`❌ ${label} — ${errors.length} ledger violation(s)`);
      for (const error of errors) console.error(`   - ${error}`);
    }
  }

  if (!explicitFile && !ciMode && supersededPaths.length > 0) {
    const referenced = new Set(validLedgers
      .flatMap(ledger => ledger.review?.supersedes || [])
      .map(path => relative(ROOT, resolve(ROOT, path)).replaceAll('\\', '/')));
    for (const supersededPath of supersededPaths) {
      const normalized = relative(ROOT, supersededPath).replaceAll('\\', '/');
      if (!referenced.has(normalized)) {
        failures++;
        console.error(`❌ ${normalized} — superseded ledger is not named by a valid retained v4 successor in review.supersedes`);
      }
    }
  }

  if (failures > 0) {
    console.error(`❌ check:review-ledger FAILED — ${failures} invalid ledger file(s)`);
    return 1;
  }
  console.log(`✅ check:review-ledger PASSED — ${ledgerPaths.length} ledger file(s) validated`);
  return 0;
}

if (args.includes('--verify-gate')) {
  process.exitCode = runSelfTest();
} else {
  try {
    process.exitCode = runValidation();
  } catch (error) {
    console.error(`❌ check:review-ledger FAILED — ${error.message}`);
    process.exitCode = 1;
  }
}
