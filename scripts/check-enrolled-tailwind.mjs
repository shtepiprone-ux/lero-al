#!/usr/bin/env node
/**
 * check-enrolled-tailwind.mjs — a compiler-backed Tailwind-utility detector for ENROLLED files
 * (Task 829).
 *
 * Manifest enrolment (`scripts/mantine-migration-scope.json`) tells every other gate a file is
 * "migrated", but nothing checks that an enrolled file has actually stopped RENDERING Tailwind
 * utilities. Task 825's regex heuristic found 3 of the 4 files that genuinely carry one — see
 * `docs/sessions/evidence/task825/design/02_manifest-tailwind-utility-scan.txt` — and missed
 * `MantineListingContactPattern.tsx`'s `animate-spin`. This gate replaces the heuristic with the
 * project's own Tailwind v4 compiler as the oracle: a token is a Tailwind utility iff
 * `@tailwindcss/node`'s `__unstable__loadDesignSystem(globals.css).candidatesToCss` returns real
 * CSS for it, never a name-pattern guess.
 *
 * Extraction (R2) walks the TypeScript AST for every `className`/`classNames` JSX attribute in
 * each enrolled file and collects: string literals, no-substitution template literals, template
 * literal static parts, and the string LEAVES of object/array literals (never object keys).
 * Conditional (`? :`) and logical (`&&`, `||`, `??`) expressions and every call-expression argument
 * (`cn(...)`, `clsx(...)`, or any other call) are recursed into. A plain identifier resolves to a
 * same-file MODULE-LEVEL `const` initializer (recursively, with a cycle guard), including a
 * property/element access on such a const, by resolving the whole initializer, the same rule the
 * design-time measurement script `docs/sessions/evidence/task829/design/90_scan829.mjs` used —
 * see that file's own comment on `styles.foo` vs. a local const object. An identifier that does not
 * resolve to a same-file module-level const (imported from elsewhere, a prop, a hook return) simply
 * yields nothing, by design — this is one of the printed blind spots below, not a bug.
 *
 * The oracle NEVER passes on a failure to load. If `@tailwindcss/node`'s
 * `__unstable__loadDesignSystem` is missing or throws, the gate exits 2 naming it — an unavailable
 * oracle is a tooling failure, not "0 violations" (R3).
 *
 * Baseline (`scripts/enrolled-tailwind-baseline.json`) is a REMOVE-ONLY debt ledger, one entry per
 * `"<file> :: <token>"` key, `{ count, owner, reason }`, `count` = the token's actual occurrence
 * count in that file's extracted set (not a distinct-token count — repeating an already-baselined
 * utility a second time in the same file is itself new debt). A key absent from the baseline, or a
 * key whose measured count is now HIGHER than the baseline's, is new debt and fails the gate; a
 * baseline key whose measured count is now LOWER, or has vanished entirely, is STALE — paid-down
 * debt that must be recorded via `--update-baseline`, and also fails until it is. Owner decision
 * 2026-09-17 (Task 829, Sprint 75, kickoff §5.1): the 3 tokens this task owns
 * (`MantineListingContactPattern.tsx`'s `animate-spin`, `MantineListingDetailPattern.tsx`'s
 * `shrink-0`/`text-muted-foreground`) are migrated to canonical Mantine sources in this same task,
 * never baselined. The 27 remaining tokens across `MantineListingGalleryPattern.tsx` (26) and
 * `ListingDetailView.tsx` (1, the LCP static-frame/interactive-shell mechanism —
 * `docs/backlog-reserved.md:18`) are owned by Task 794, which is obliged to empty the baseline.
 *
 * Two writers, both refuse wholesale (no partial write) rather than silently launder debt:
 *   `--seed-baseline` runs ONLY when the baseline file does not exist yet, and only ever writes
 *     findings whose file is in the fixed `SEEDABLE_FILES` constant below — a finding anywhere else
 *     refuses the whole write.
 *   `--update-baseline` runs ONLY against an EXISTING baseline, and may only lower a count or drop a
 *     key entirely (paid-down debt) — any count/key INCREASE refuses the whole write; increased debt
 *     is not something a baseline updater can absorb.
 *
 * Cannot see (printed every run, R8): class strings built in another module and imported (only a
 * same-file module-level const resolves); runtime-computed strings (function return values);
 * Tailwind applied through CSS (`@apply` inside a `.module.css` file — this gate never reads CSS
 * files); non-enrolled files (that gap is `check:surface-census:changed`'s, not this gate's); and
 * any JSX attribute name other than `className`/`classNames` (a bare `class` on a non-JSX host, or a
 * differently-named prop, is invisible here).
 *
 * Usage:
 *   node scripts/check-enrolled-tailwind.mjs                    # gate check (CI default)
 *   npm run check:enrolled-tailwind
 *   npm run check:enrolled-tailwind:update-baseline
 *   npm run check:enrolled-tailwind:verify                       # CI-safe gate self-test (--verify-gate)
 *   node scripts/check-enrolled-tailwind.mjs --seed-baseline      # one-time initial write, not an npm script
 *                                                                  (house pattern: check-surface-census-changed.mjs)
 *
 * Docs: docs/design-system.md §23.10, docs/golden-rules.md GR-2.
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'scripts', 'mantine-migration-scope.json');
const BASELINE_PATH = join(ROOT, 'scripts', 'enrolled-tailwind-baseline.json');
const GLOBALS_CSS_PATH = join(ROOT, 'src', 'app', 'globals.css');
const TAILWIND_PKG_PATH = join(ROOT, 'node_modules', 'tailwindcss', 'package.json');
const BASELINE_VERSION = 1;

// Owner decision 2026-09-17 (Task 829, Sprint 75, kickoff §5.1, "Детектор + 3 токени, галерея в 794"):
// only these two 794-owned gallery/LCP-mechanism files may ever be written by --seed-baseline. Every
// other enrolled file's Tailwind debt is migrated inside the owning task, never baselined. Widening
// this set is an owner decision, never a silent executor/reviewer choice.
const SEEDABLE_FILES = new Set([
  'src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx',
  'src/modules/listings/components/ListingDetailView.tsx',
]);
const SEED_OWNER = '794';
const SEED_REASON =
  'Gallery LCP static-frame/interactive-shell mechanism (docs/backlog-reserved.md:18, Sprint 71 Task 794) — remove-only baseline, owner decision 2026-09-17 (Task 829 kickoff §5.1).';

// ── CLI flags ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const VERIFY_GATE = args.includes('--verify-gate');
const SEED_BASELINE = args.includes('--seed-baseline');
const UPDATE_BASELINE = args.includes('--update-baseline');

// ── R2: AST extraction ────────────────────────────────────────────────────────

const CLASS_ATTR_NAMES = new Set(['className', 'classNames']);

function parseSource(virtualPath, text) {
  return ts.createSourceFile(virtualPath, text, ts.ScriptTarget.Latest, /* setParentNodes */ true, ts.ScriptKind.TSX);
}

/** Module-level `const <identifier> = <initializer>` bindings only — `let`/`var` and destructuring
 *  targets are excluded per R2 ("module-level const initializers"). */
function collectModuleConsts(sourceFile) {
  const consts = new Map();
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    if (!(stmt.declarationList.flags & ts.NodeFlags.Const)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.initializer) consts.set(decl.name.text, decl.initializer);
    }
  }
  return consts;
}

/**
 * Pure AST walk (R2). Appends every collected raw class-bearing string to `out`. `consts` maps a
 * same-file module-level const name to its initializer node; `seen` cycle-guards identifier chains
 * within one collection call (fresh per top-level className/classNames attribute, matching the
 * design-time scan's own convention).
 */
function collectClassStrings(node, out, consts, seen) {
  if (!node) return;
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)) {
    collectClassStrings(node.expression, out, consts, seen);
    return;
  }
  if (ts.isStringLiteralLike(node)) {
    // Covers ts.StringLiteral and ts.NoSubstitutionTemplateLiteral.
    out.push(node.text);
    return;
  }
  if (ts.isTemplateExpression(node)) {
    out.push(node.head.text);
    for (const span of node.templateSpans) {
      collectClassStrings(span.expression, out, consts, seen);
      out.push(span.literal.text);
    }
    return;
  }
  if (ts.isConditionalExpression(node)) {
    collectClassStrings(node.whenTrue, out, consts, seen);
    collectClassStrings(node.whenFalse, out, consts, seen);
    return;
  }
  if (ts.isBinaryExpression(node)) {
    const k = node.operatorToken.kind;
    if (
      k === ts.SyntaxKind.AmpersandAmpersandToken ||
      k === ts.SyntaxKind.BarBarToken ||
      k === ts.SyntaxKind.QuestionQuestionToken
    ) {
      collectClassStrings(node.left, out, consts, seen);
      collectClassStrings(node.right, out, consts, seen);
    }
    return;
  }
  if (ts.isCallExpression(node)) {
    // "all call arguments (cn, clsx, ...)" — the callee name is never inspected; any call's
    // arguments are recursed into uniformly.
    for (const arg of node.arguments) collectClassStrings(arg, out, consts, seen);
    return;
  }
  if (ts.isArrayLiteralExpression(node)) {
    for (const el of node.elements) collectClassStrings(el, out, consts, seen);
    return;
  }
  if (ts.isObjectLiteralExpression(node)) {
    // String LEAVES only — property keys (`root` in `{ root: 'flex' }`) are never collected, even
    // when written as a quoted string key.
    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop)) collectClassStrings(prop.initializer, out, consts, seen);
      else if (ts.isShorthandPropertyAssignment(prop)) collectClassStrings(prop.name, out, consts, seen);
      else if (ts.isSpreadAssignment(prop)) collectClassStrings(prop.expression, out, consts, seen);
    }
    return;
  }
  if (ts.isIdentifier(node)) {
    const init = consts.get(node.text);
    if (init && !seen.has(node.text)) {
      seen.add(node.text);
      collectClassStrings(init, out, consts, seen);
    }
    return;
  }
  if (ts.isPropertyAccessExpression(node)) {
    // `OBJ.key` where OBJ resolves to a local const -> take the WHOLE const (same rule as the
    // design-time scan; a CSS-module import like `styles.x` never resolves because `styles` is an
    // import binding, not a local const, so this correctly yields nothing for it).
    if (ts.isIdentifier(node.expression)) collectClassStrings(node.expression, out, consts, seen);
    return;
  }
  if (ts.isElementAccessExpression(node)) {
    if (ts.isIdentifier(node.expression)) collectClassStrings(node.expression, out, consts, seen);
    return;
  }
  // Anything else — an arrow function, a hook/prop call's return value, a JSX element, a
  // non-const-derived member expression — is a deliberate blind spot (function returns, imported
  // strings from another module), not recursed into further. Printed every run, R8.
}

/** Pure: Map<token, occurrenceCount> for every whitespace-split token found inside every
 *  className/classNames JSX attribute in `sourceText`. No file I/O, no oracle call — the
 *  synthetic --verify-gate arms call this directly on in-memory fixtures (R9). */
function extractTokenCounts(sourceText, virtualPath = 'virtual.tsx') {
  const sourceFile = parseSource(virtualPath, sourceText);
  const consts = collectModuleConsts(sourceFile);
  const raw = [];
  function visit(node) {
    if (ts.isJsxAttribute(node) && CLASS_ATTR_NAMES.has(node.name.getText(sourceFile)) && node.initializer) {
      const init = ts.isJsxExpression(node.initializer) ? node.initializer.expression : node.initializer;
      if (init) collectClassStrings(init, raw, consts, new Set());
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  const counts = new Map();
  for (const s of raw) {
    for (const tok of s.split(/\s+/).filter(Boolean)) {
      counts.set(tok, (counts.get(tok) ?? 0) + 1);
    }
  }
  return counts;
}

// ── R3: compiler oracle ────────────────────────────────────────────────────────

async function defaultLoadDesignSystem(cssText, basePath) {
  const mod = await import('@tailwindcss/node');
  if (!mod || typeof mod.__unstable__loadDesignSystem !== 'function') {
    throw new Error('@tailwindcss/node __unstable__loadDesignSystem export is not available');
  }
  return mod.__unstable__loadDesignSystem(cssText, { base: basePath });
}

/** Never throws. Returns { ok: true, ds } or { ok: false, reason }. `loaderFn` is injectable so the
 *  self-test's arm 9 can prove a throwing loader is classified as a failure (R9). */
async function loadOracle(cssText, basePath, loaderFn = defaultLoadDesignSystem) {
  try {
    const ds = await loaderFn(cssText, basePath);
    if (!ds || typeof ds.candidatesToCss !== 'function') {
      return { ok: false, reason: 'design system loaded but candidatesToCss is not a function' };
    }
    return { ok: true, ds };
  } catch (err) {
    return { ok: false, reason: err && err.message ? err.message : String(err) };
  }
}

/** Pure: Map<token, isTailwind boolean> for every distinct token, one batched candidatesToCss call. */
function classifyTokens(ds, distinctTokens) {
  const map = new Map();
  if (distinctTokens.length === 0) return map;
  const cssOut = ds.candidatesToCss(distinctTokens);
  distinctTokens.forEach((t, i) => map.set(t, cssOut[i] !== null && cssOut[i] !== undefined));
  return map;
}

// ── R4: baseline load / compare ─────────────────────────────────────────────────

/** Missing file -> `{ entries: {}, missing: true }` (an expected bootstrap state, not an error — the
 *  gate then reports every finding as new, guiding the user to --seed-baseline). A PRESENT but
 *  unparseable/malformed file -> `{ error, message }`, fatal (exit 2) everywhere it is consulted. */
function loadBaselineFile(path) {
  if (!existsSync(path)) return { version: BASELINE_VERSION, entries: {}, missing: true };
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    return { error: 'parse', message: `FAIL  Cannot read/parse ${relative(ROOT, path)}: ${err.message}` };
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed) || typeof parsed.version !== 'number') {
    return { error: 'version', message: `FAIL  ${relative(ROOT, path)} has a missing or unrecognised "version" — expected ${BASELINE_VERSION}.` };
  }
  if (parsed.version !== BASELINE_VERSION) {
    return { error: 'version', message: `FAIL  ${relative(ROOT, path)} version ${parsed.version} does not match the expected version ${BASELINE_VERSION}.` };
  }
  if (parsed.entries === null || typeof parsed.entries !== 'object' || Array.isArray(parsed.entries)) {
    return { error: 'shape', message: `FAIL  ${relative(ROOT, path)} "entries" must be an object.` };
  }
  return { version: parsed.version, entries: parsed.entries, missing: false };
}

/**
 * Pure comparator. `currentEntries`: Map<"<file> :: <token>", count>. `baselineEntries`: plain
 * object `{ key: { count, owner, reason } }`.
 *   newFindings      — key absent from the baseline.
 *   increasedFindings — key present, but the measured count is now HIGHER than the baseline's.
 *   staleFindings    — key present in the baseline but the measured count is LOWER, or the finding
 *                      has vanished entirely (both are "count dropped or vanished", R4).
 * `newFindings` and `increasedFindings` are reported separately (different remedies) but both drive
 * the same "new debt" exit-code bucket.
 */
function compareToBaseline(currentEntries, baselineEntries) {
  const newFindings = [];
  const increasedFindings = [];
  const staleFindings = [];
  let matchedCount = 0;
  for (const [key, count] of currentEntries) {
    const base = baselineEntries[key];
    if (!base) {
      newFindings.push({ key, currentCount: count });
      continue;
    }
    if (count > base.count) {
      increasedFindings.push({ key, currentCount: count, baselineCount: base.count });
      continue;
    }
    if (count < base.count) {
      staleFindings.push({ key, currentCount: count, baselineCount: base.count });
      continue;
    }
    matchedCount++;
  }
  for (const key of Object.keys(baselineEntries)) {
    if (!currentEntries.has(key)) {
      staleFindings.push({ key, currentCount: 0, baselineCount: baselineEntries[key].count });
    }
  }
  return { newFindings, increasedFindings, staleFindings, matchedCount };
}

/** Pure: the exact exit-code decision the gate uses — the same function the self-test's arms 6/7
 *  exercise, not a re-derivation of its logic. */
function evaluateGateExitCode({ newCount, increasedCount, staleCount }) {
  return newCount > 0 || increasedCount > 0 || staleCount > 0 ? 1 : 0;
}

function writeBaselineFile(path, version, entries) {
  const sorted = {};
  for (const key of Object.keys(entries).sort()) sorted[key] = entries[key];
  writeFileSync(path, JSON.stringify({ version, entries: sorted }, null, 2) + '\n', 'utf8');
}

// ── R5: writers (pure decision + thin write wrapper, each independently testable) ──────────────────

/** Pure: refuses (no entries object) if ANY current finding's file is outside `seedableFiles`. */
function computeSeedWrite(currentEntries, seedableFiles) {
  const offending = [];
  for (const key of currentEntries.keys()) {
    const file = key.split(' :: ')[0];
    if (!seedableFiles.has(file)) offending.push(key);
  }
  if (offending.length > 0) return { refused: true, offending };
  const entries = {};
  for (const [key, count] of currentEntries) entries[key] = { count, owner: SEED_OWNER, reason: SEED_REASON };
  return { refused: false, entries };
}

/** `writeFn`/`path` are injectable so the self-test's arm 8 can prove a refusal never calls the
 *  writer, without touching any tracked file. */
function runSeedBaseline({ currentEntries, seedableFiles, writeFn = writeBaselineFile, path = BASELINE_PATH }) {
  const result = computeSeedWrite(currentEntries, seedableFiles);
  if (result.refused) return result;
  writeFn(path, BASELINE_VERSION, result.entries);
  return result;
}

/** Pure: may only lower a count or drop a key. Any new key or count increase refuses the WHOLE
 *  write — R5's "any key or count increase is refused with no write" (wholesale, not per-key). */
function computeUpdateWrite(currentEntries, priorBaselineEntries) {
  const violations = [];
  for (const [key, count] of currentEntries) {
    const base = priorBaselineEntries[key];
    if (!base) {
      violations.push({ key, kind: 'new', currentCount: count });
      continue;
    }
    if (count > base.count) {
      violations.push({ key, kind: 'increase', currentCount: count, baselineCount: base.count });
    }
  }
  if (violations.length > 0) return { refused: true, violations };
  const entries = {};
  for (const [key, count] of currentEntries) {
    const base = priorBaselineEntries[key];
    entries[key] = { count, owner: base.owner, reason: base.reason };
  }
  // Keys present in the prior baseline but absent from currentEntries are dropped (deleted) —
  // fully paid-off debt, allowed by "delete keys".
  return { refused: false, entries };
}

function runUpdateBaseline({ currentEntries, priorBaselineEntries, writeFn = writeBaselineFile, path = BASELINE_PATH }) {
  const result = computeUpdateWrite(currentEntries, priorBaselineEntries);
  if (result.refused) return result;
  writeFn(path, BASELINE_VERSION, result.entries);
  return result;
}

// ── Reporting helpers ────────────────────────────────────────────────────────────

function readTailwindVersion() {
  try {
    return JSON.parse(readFileSync(TAILWIND_PKG_PATH, 'utf8')).version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function printCannotSee() {
  console.log('    Cannot see:');
  console.log('      - class strings built in another module and imported (only a same-file module-level const resolves)');
  console.log('      - runtime-computed strings (function return values)');
  console.log('      - Tailwind applied through CSS (@apply in a .module.css file)');
  console.log('      - non-enrolled files (owned by check:surface-census:changed)');
  console.log('      - any attribute name other than className/classNames (e.g. a plain `class`)');
}

function printHeader({ manifestCount, tailwindVersion, sampleCssEntry, baselineState, baselineCount }) {
  console.log('check:enrolled-tailwind — compiler-backed Tailwind-utility detector for enrolled files (Task 829)');
  console.log(`    Scope: ${relative(ROOT, MANIFEST_PATH)} — ${manifestCount} entries`);
  console.log(`    Oracle: tailwindcss ${tailwindVersion} (@tailwindcss/node __unstable__loadDesignSystem(globals.css).candidatesToCss)`);
  console.log(`    Oracle liveness sample: candidatesToCss(['hidden']) -> ${sampleCssEntry}`);
  console.log(`    Baseline: ${relative(ROOT, BASELINE_PATH)} (${baselineState}) — ${baselineCount} entries`);
  printCannotSee();
  console.log('');
}

// ── Self-test (--verify-gate, R9 — 10 synthetic arms, no tracked writes) ───────────────────────────

async function runSelfTest() {
  const ARM_COUNT = 10;
  console.log(`check:enrolled-tailwind gate self-test (--verify-gate, Task 829 R9) — running ${ARM_COUNT} arms\n`);
  let passed = 0;
  let failed = 0;
  function record(ok, label) {
    if (ok) {
      console.log(`  PASS  ${label}`);
      passed++;
    } else {
      console.log(`  FAIL  ${label}`);
      failed++;
    }
  }

  const realCss = readFileSync(GLOBALS_CSS_PATH, 'utf8');
  const realOracle = await loadOracle(realCss, dirname(GLOBALS_CSS_PATH));
  if (!realOracle.ok) {
    console.error(`FAIL  check:enrolled-tailwind:verify — real oracle unavailable, cannot self-test: ${realOracle.reason}`);
    process.exit(2);
  }

  // Arm 1 — a literal Tailwind className -> finding.
  {
    const src = `function C() { return <div className="mt-2 flex" />; }`;
    const distinct = [...extractTokenCounts(src).keys()];
    const isTw = classifyTokens(realOracle.ds, distinct);
    record(
      distinct.includes('mt-2') && distinct.includes('flex') && isTw.get('mt-2') === true && isTw.get('flex') === true,
      'Arm 1 — literal Tailwind className ("mt-2 flex") -> finding'
    );
  }

  // Arm 2 — global non-Tailwind classes -> no finding.
  {
    const src = `function C() { return <div className="container-wide listing-card" />; }`;
    const distinct = [...extractTokenCounts(src).keys()];
    const isTw = classifyTokens(realOracle.ds, distinct);
    const findings = distinct.filter((t) => isTw.get(t));
    record(findings.length === 0, 'Arm 2 — global non-Tailwind classes ("container-wide listing-card") -> no finding');
  }

  // Arm 3 — className={styles.x} (CSS module) -> no token extracted at all.
  {
    const src = `import styles from './x.module.css'; function C() { return <div className={styles.x} />; }`;
    const counts = extractTokenCounts(src);
    record(counts.size === 0, 'Arm 3 — className={styles.x} -> no token extracted');
  }

  // Arm 4 — a module-level const string used via cn(A, 'p-2') -> both tokens found.
  {
    const src = `const A = 'mt-4'; function C() { return <div className={cn(A, 'p-2')} />; }`;
    const distinct = [...extractTokenCounts(src).keys()];
    const isTw = classifyTokens(realOracle.ds, distinct);
    record(
      distinct.includes('mt-4') && distinct.includes('p-2') && isTw.get('mt-4') === true && isTw.get('p-2') === true,
      'Arm 4 — module const via cn(A, "p-2") -> both tokens extracted and found'
    );
  }

  // Arm 5 — classNames={{ root: 'flex' }} -> finding on the VALUE, never the key.
  {
    const src = `function C() { return <Foo classNames={{ root: 'flex' }} />; }`;
    const distinct = [...extractTokenCounts(src).keys()];
    const isTw = classifyTokens(realOracle.ds, distinct);
    record(
      distinct.includes('flex') && isTw.get('flex') === true && !distinct.includes('root'),
      'Arm 5 — classNames={{root:"flex"}} -> finding on the value ("flex"), never the key ("root")'
    );
  }

  // Arm 6 — a key absent from the baseline -> reported new, drives exit 1.
  {
    const key = 'src/fake/task829/Fake.tsx :: mt-2';
    const current = new Map([[key, 1]]);
    const cmp = compareToBaseline(current, {});
    const exitCode = evaluateGateExitCode({ newCount: cmp.newFindings.length, increasedCount: cmp.increasedFindings.length, staleCount: cmp.staleFindings.length });
    record(
      cmp.newFindings.length === 1 && cmp.newFindings[0].key === key && exitCode === 1,
      'Arm 6 — key absent from baseline -> new finding, exit 1'
    );
  }

  // Arm 7 — a baseline key whose recorded count is ABOVE the current measured count -> stale, exit 1.
  {
    const key = 'src/fake/task829/Fake.tsx :: mt-2';
    const current = new Map([[key, 1]]);
    const baselineEntries = { [key]: { count: 3, owner: '794', reason: 'fake' } };
    const cmp = compareToBaseline(current, baselineEntries);
    const exitCode = evaluateGateExitCode({ newCount: cmp.newFindings.length, increasedCount: cmp.increasedFindings.length, staleCount: cmp.staleFindings.length });
    record(
      cmp.staleFindings.length === 1 && cmp.staleFindings[0].key === key && exitCode === 1,
      'Arm 7 — baseline count above current measured count -> stale, exit 1'
    );
  }

  // Arm 8 — --seed-baseline with a finding outside SEEDABLE_FILES -> refused, writer never called.
  {
    let writeCalled = false;
    const spyWrite = () => {
      writeCalled = true;
    };
    const current = new Map([
      ['src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx :: flex', 1],
      ['src/fake/task829/NotSeedable.tsx :: mt-2', 1],
    ]);
    const result = runSeedBaseline({ currentEntries: current, seedableFiles: SEEDABLE_FILES, writeFn: spyWrite, path: join(ROOT, 'scripts', '__task829_selftest_unused__.json') });
    record(
      result.refused === true && result.offending.includes('src/fake/task829/NotSeedable.tsx :: mt-2') && !writeCalled,
      'Arm 8 — --seed-baseline finding outside SEEDABLE_FILES -> refused, writer never called'
    );
  }

  // Arm 9 — the oracle loader thrown/injected -> classified as a failure (drives the real gate's exit 2).
  {
    const failing = await loadOracle('irrelevant css text', ROOT, async () => {
      throw new Error('injected verify-gate failure');
    });
    record(failing.ok === false, 'Arm 9 — oracle loader throws -> classified as failed (drives exit 2)');
  }

  // Arm 10 — --update-baseline given a current count ABOVE the prior baseline -> refused, writer
  // never called (the write function is not called — R9's explicit wording).
  {
    let writeCalled = false;
    const spyWrite = () => {
      writeCalled = true;
    };
    const key = 'src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx :: flex';
    const current = new Map([[key, 5]]);
    const prior = { [key]: { count: 3, owner: '794', reason: 'fake' } };
    const result = runUpdateBaseline({ currentEntries: current, priorBaselineEntries: prior, writeFn: spyWrite, path: join(ROOT, 'scripts', '__task829_selftest_unused__.json') });
    record(
      result.refused === true && !writeCalled,
      'Arm 10 — --update-baseline count increase above prior baseline -> refused, writer never called'
    );
  }

  console.log(`\nArms run: ${ARM_COUNT}`);
  console.log(`Self-test: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('FAIL  check:enrolled-tailwind:verify — the gate self-test found a broken arm.');
    process.exit(1);
  }
  console.log(`PASS  check:enrolled-tailwind:verify — all ${ARM_COUNT} arms (R9) behave correctly.`);
  process.exit(0);
}

// ── Main ─────────────────────────────────────────────────────────────────────────

async function main() {
  if (VERIFY_GATE) {
    await runSelfTest();
    return;
  }

  // ── Load manifest ──────────────────────────────────────────────────────────
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    if (!Array.isArray(manifest)) throw new Error('must be a JSON array');
  } catch (err) {
    console.error(`FAIL  Cannot read/parse ${relative(ROOT, MANIFEST_PATH)}: ${err.message}`);
    process.exit(2);
  }

  // ── R1: every listed path must exist — fail-closed, exit 2 ─────────────────
  const missing = manifest.filter((p) => !existsSync(join(ROOT, p)));
  if (missing.length > 0) {
    console.error(`FAIL  ${missing.length} manifest path(s) do not exist on disk (fail-closed, R1):`);
    for (const p of missing) console.error(`    ${p}`);
    process.exit(2);
  }

  // ── R3: oracle ───────────────────────────────────────────────────────────────
  let cssText;
  try {
    cssText = readFileSync(GLOBALS_CSS_PATH, 'utf8');
  } catch (err) {
    console.error(`FAIL  Cannot read ${relative(ROOT, GLOBALS_CSS_PATH)}: ${err.message}`);
    process.exit(2);
  }
  const oracle = await loadOracle(cssText, dirname(GLOBALS_CSS_PATH));
  if (!oracle.ok) {
    console.error(`FAIL  Tailwind compiler oracle unavailable: ${oracle.reason}`);
    console.error('  check:enrolled-tailwind never passes on a failed oracle (R3).');
    process.exit(2);
  }
  const tailwindVersion = readTailwindVersion();
  const sampleCssEntry = (oracle.ds.candidatesToCss(['hidden'])[0] ?? 'null').toString().replace(/\s+/g, ' ').trim();

  // ── R2: extract per-file token counts ───────────────────────────────────────
  const perFileCounts = new Map(); // file -> Map<token, count>
  for (const rel of manifest) {
    const abs = join(ROOT, rel);
    const text = readFileSync(abs, 'utf8');
    perFileCounts.set(rel, extractTokenCounts(text, abs));
  }

  const allTokens = new Set();
  for (const counts of perFileCounts.values()) for (const t of counts.keys()) allTokens.add(t);
  const isTailwind = classifyTokens(oracle.ds, [...allTokens]);

  const currentEntries = new Map(); // "<file> :: <token>" -> count
  const findingsByFile = new Map();
  for (const [file, counts] of perFileCounts) {
    for (const [tok, count] of counts) {
      if (isTailwind.get(tok)) {
        currentEntries.set(`${file} :: ${tok}`, count);
        if (!findingsByFile.has(file)) findingsByFile.set(file, []);
        findingsByFile.get(file).push({ token: tok, count });
      }
    }
  }

  // ── Baseline (loaded once; existence checked separately for seed/update refusals) ────────────────
  const baselineExists = existsSync(BASELINE_PATH);
  const baselineLoaded = loadBaselineFile(BASELINE_PATH);

  printHeader({
    manifestCount: manifest.length,
    tailwindVersion,
    sampleCssEntry,
    baselineState: baselineLoaded.error ? 'UNREADABLE' : baselineLoaded.missing ? 'missing' : 'present',
    baselineCount: baselineLoaded.error ? 'n/a' : Object.keys(baselineLoaded.entries).length,
  });

  console.log(`    Enrolled files with a Tailwind-compiling finding: ${findingsByFile.size} (of ${manifest.length} manifest entries)`);
  for (const [file, findings] of findingsByFile) {
    console.log(`      ${file}: ${findings.map((f) => `${f.token}(${f.count})`).join(' ')}`);
  }
  console.log('');

  // ── --seed-baseline ──────────────────────────────────────────────────────────
  if (SEED_BASELINE) {
    if (baselineExists) {
      console.error(`FAIL  ${relative(ROOT, BASELINE_PATH)} already exists — --seed-baseline is for the one-time initial write only.`);
      console.error('  Use --update-baseline to regenerate an existing baseline (remove-only).');
      process.exit(1);
    }
    const result = runSeedBaseline({ currentEntries, seedableFiles: SEEDABLE_FILES });
    if (result.refused) {
      console.error(`FAIL  --seed-baseline refused — ${result.offending.length} finding(s) exist outside SEEDABLE_FILES:`);
      for (const key of result.offending) console.error(`    ${key}`);
      console.error('  Migrate these findings to a canonical Mantine source first (agent-contract 16b/16c), or widen');
      console.error('  SEEDABLE_FILES with a new, dated owner decision — never silently.');
      process.exit(1);
    }
    console.log(`PASS  --seed-baseline — wrote ${Object.keys(result.entries).length} entr(ies) to ${relative(ROOT, BASELINE_PATH)}:`);
    for (const key of Object.keys(result.entries).sort()) console.log(`    ${key}  count=${result.entries[key].count}`);
    process.exit(0);
  }

  // ── --update-baseline ────────────────────────────────────────────────────────
  if (UPDATE_BASELINE) {
    if (!baselineExists) {
      console.error(`FAIL  Baseline file missing: ${relative(ROOT, BASELINE_PATH)}`);
      console.error('  --update-baseline only updates an EXISTING baseline. Run --seed-baseline for the one-time initial write.');
      process.exit(1);
    }
    if (baselineLoaded.error) {
      console.error(baselineLoaded.message);
      process.exit(2);
    }
    const result = runUpdateBaseline({ currentEntries, priorBaselineEntries: baselineLoaded.entries });
    if (result.refused) {
      console.error('FAIL  --update-baseline refused — it may only lower a count or delete a key:');
      for (const v of result.violations) {
        const baselinePart = v.baselineCount !== undefined ? ` baseline=${v.baselineCount}` : '';
        console.error(`    ${v.key}  [${v.kind}]  current=${v.currentCount}${baselinePart}`);
      }
      console.error('  A count/key increase is new debt, not something --update-baseline can absorb.');
      process.exit(1);
    }
    console.log(`PASS  --update-baseline — ${relative(ROOT, BASELINE_PATH)} updated, ${Object.keys(result.entries).length} entr(ies) written.`);
    process.exit(0);
  }

  // ── Gate mode ────────────────────────────────────────────────────────────────
  if (baselineLoaded.error) {
    console.error(baselineLoaded.message);
    console.error('Docs: docs/design-system.md §23.10.');
    process.exit(2);
  }

  const cmp = compareToBaseline(currentEntries, baselineLoaded.entries);

  if (cmp.newFindings.length > 0) {
    console.error(`FAIL  ${cmp.newFindings.length} new Tailwind-utility finding(s) not in the baseline:`);
    for (const f of cmp.newFindings) console.error(`    ${f.key}  count=${f.currentCount}`);
  }
  if (cmp.increasedFindings.length > 0) {
    console.error(`FAIL  ${cmp.increasedFindings.length} finding(s) whose count increased beyond the baseline:`);
    for (const f of cmp.increasedFindings) console.error(`    ${f.key}  current=${f.currentCount} baseline=${f.baselineCount}`);
  }
  if (cmp.newFindings.length > 0 || cmp.increasedFindings.length > 0) {
    console.error('  Fix: migrate the utility to a canonical Mantine source (agent-contract 16b/16c). The baseline is');
    console.error('  remove-only — new debt can never be seeded or updated in; it must be fixed.');
  }
  if (cmp.staleFindings.length > 0) {
    console.error(`FAIL  ${cmp.staleFindings.length} stale baseline entr(ies) — the count dropped or the finding vanished:`);
    for (const f of cmp.staleFindings) console.error(`    ${f.key}  current=${f.currentCount} baseline=${f.baselineCount}`);
    console.error('  Fix: run `npm run check:enrolled-tailwind:update-baseline` to record the paid-down debt.');
  }

  const exitCode = evaluateGateExitCode({
    newCount: cmp.newFindings.length,
    increasedCount: cmp.increasedFindings.length,
    staleCount: cmp.staleFindings.length,
  });

  if (exitCode === 0) {
    console.log("PASS  check:enrolled-tailwind — every enrolled file's Tailwind-utility findings match the versioned baseline exactly.");
  } else {
    console.error('');
    console.error('Docs: docs/design-system.md §23.10.');
  }
  process.exit(exitCode);
}

await main();
