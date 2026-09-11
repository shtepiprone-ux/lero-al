#!/usr/bin/env node
/**
 * map-changed-surfaces.mjs — deterministic PR-diff -> affected-surface mapper (Task 819).
 *
 * GR-1's pre-enrolment case (Task 809) needs a census run for every surface a PR touches, not just
 * for enrolled roots (`check:rendered-scope`, Task 818) or a hand-picked `--surface` (`check-surface-
 * census.mjs`, Task 817). This script is the missing link: it maps a base..head diff to the set of
 * surfaces whose census would cover the change, deterministically.
 *
 * Resolution rule (kickoff §5, ASSUMPTION): a changed file resolves UPWARD to the surface(s) that
 * render it, not merely to itself — otherwise nothing could ever fail to resolve, and the exact Task
 * 809 defect (a changed leaf component, not the surface itself) would slip through unseen. Concretely,
 * for a changed production file X:
 *   - if NOTHING in the whole-src render graph renders X, X is itself a surface root;
 *   - if X is a `scripts/mantine-migration-scope.json` entry, or lives under `src/app/**` (a route
 *     file), X is itself a surface root (never climbed past, even if something also renders it);
 *   - otherwise, climb to every file that renders X (breadth-first, cycle-safe), and repeat the same
 *     three rules at each one, collecting every root reached;
 *   - if the climb is trapped in a cycle where NO node is ever a root (every node has >=1 renderer,
 *     none is a manifest entry or a route file), X is UNRESOLVED — the mapper genuinely cannot say
 *     what to census, and R5 fails the run closed rather than silently skip it.
 *
 * The render graph itself is a whole-`src/` reverse walk (renderer -> rendered edges, JSX-tag-root
 * rendered bindings only — hooks/utils/consts/types never count), built fresh per run so it reflects
 * the CURRENT tree, not `check-rendered-scope.mjs`'s enrolled-subgraph-only walk. Import binding
 * extraction, JSX-tag-root extraction and the single-hop barrel unwrap are DUPLICATED (not imported)
 * from `check-rendered-scope.mjs`/`check-surface-census.mjs`, per those files' own "out of scope,
 * never edited by a sibling task" convention — only `scripts/lib/import-resolver.mjs` (already shared)
 * is imported.
 *
 * Explicitly out of reach, stated on every run: dynamic `import()` and `React.lazy()` (not statically
 * resolved — same limitation the render-side walks already state); a surface reached only through a
 * route convention this mapper does not model (e.g. a dynamically-composed layout); any file changed
 * outside `src/`.
 *
 * Usage:
 *   node scripts/map-changed-surfaces.mjs --base <ref> [--head <ref>] [--json]
 *     [--max-changed-files <n>] [--max-surfaces <n>]
 *   npm run check:surface-census:changed        # driven by scripts/check-surface-census-changed.mjs
 *
 * `--head` omitted diffs `--base` against the current working tree (used for local probing only —
 * CI always passes both explicit SHAs, since a working-tree diff is not reproducible between runs).
 *
 * Docs: docs/storybook-governance.md §15.7, docs/golden-rules.md GR-1/GR-3.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import { resolveImportSpecifier as resolveImportSpecifierShared } from './lib/import-resolver.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'scripts', 'mantine-migration-scope.json');
const SRC_DIR = join(ROOT, 'src');

export const DEFAULT_MAX_CHANGED_FILES = 300;
export const DEFAULT_MAX_SURFACES = 60;

function resolveImportSpecifier(fromFile, spec) {
  return resolveImportSpecifierShared(ROOT, fromFile, spec);
}

function parseSourceFile(absPath) {
  const text = readFileSync(absPath, 'utf8');
  return ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, /* setParentNodes */ true, ts.ScriptKind.TSX);
}

/** Every local (non-type-only) and type-only import binding in the file — duplicated verbatim from
 *  check-rendered-scope.mjs (that file is out of scope for this task, never edited by it). */
function extractImportBindings(sourceFile) {
  const bindings = [];
  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const spec = stmt.moduleSpecifier.text;
    const clause = stmt.importClause;
    if (!clause) continue;
    const declTypeOnly = !!clause.isTypeOnly;
    if (clause.name) {
      bindings.push({ localName: clause.name.text, importedExportName: 'default', spec, typeOnly: declTypeOnly });
    }
    if (clause.namedBindings) {
      if (ts.isNamespaceImport(clause.namedBindings)) {
        bindings.push({ localName: clause.namedBindings.name.text, importedExportName: '*', spec, typeOnly: declTypeOnly });
      } else if (ts.isNamedImports(clause.namedBindings)) {
        for (const el of clause.namedBindings.elements) {
          const importedExportName = el.propertyName ? el.propertyName.text : el.name.text;
          bindings.push({
            localName: el.name.text,
            importedExportName,
            spec,
            typeOnly: declTypeOnly || !!el.isTypeOnly,
          });
        }
      }
    }
  }
  return bindings;
}

/** Every identifier used as a JSX opening/self-closing tag name's root — duplicated verbatim. */
function extractJsxTagRootIdentifiers(sourceFile) {
  const rendered = new Set();
  function rootIdentifier(tagNameNode) {
    let node = tagNameNode;
    while (ts.isPropertyAccessExpression(node)) node = node.expression;
    if (ts.isIdentifier(node)) return node.text;
    return null;
  }
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = rootIdentifier(node.tagName);
      if (name) rendered.add(name);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return rendered;
}

const BARREL_BASENAMES = new Set(['index.ts', 'index.tsx']);

/** Single-hop barrel unwrap — duplicated verbatim. */
function unwrapBarrel(resolvedPath, importedExportName) {
  if (!BARREL_BASENAMES.has(basename(resolvedPath))) {
    return { path: resolvedPath, barrelHop: false, barrelUnresolved: false };
  }
  const absBarrel = join(ROOT, resolvedPath);
  let sourceFile;
  try {
    sourceFile = parseSourceFile(absBarrel);
  } catch {
    return { path: resolvedPath, barrelHop: false, barrelUnresolved: true };
  }
  for (const stmt of sourceFile.statements) {
    if (
      !ts.isExportDeclaration(stmt) ||
      stmt.isTypeOnly ||
      !stmt.moduleSpecifier ||
      !ts.isStringLiteral(stmt.moduleSpecifier) ||
      !stmt.exportClause ||
      !ts.isNamedExports(stmt.exportClause)
    ) continue;
    for (const el of stmt.exportClause.elements) {
      if (el.isTypeOnly) continue;
      const exportedName = el.name.text;
      if (exportedName !== importedExportName) continue;
      const target = resolveImportSpecifier(absBarrel, stmt.moduleSpecifier.text);
      if (target) return { path: target, barrelHop: true, barrelUnresolved: false };
    }
  }
  return { path: resolvedPath, barrelHop: false, barrelUnresolved: true };
}

// ── Git plumbing ─────────────────────────────────────────────────────────────

export function gitMergeBase(base, head) {
  try {
    const out = execFileSync('git', ['--no-optional-locks', 'merge-base', base, head], { cwd: ROOT, encoding: 'utf8' });
    return { mergeBase: out.trim() };
  } catch (err) {
    return { error: `cannot determine a merge base for ${base}...${head}: ${String(err.message).split('\n')[0]}` };
  }
}

/** `head === null` diffs `base` against the current working tree. Returns [{status, path}], status
 *  one of A/C/M/R/D (rename lines carry only the new path — `--diff-filter` is not used here so a
 *  deletion is classified, with its own excluded reason, rather than silently absent from the list). */
export function gitDiffNameStatus(base, head) {
  const args = ['--no-optional-locks', 'diff', '--name-status', '--diff-filter=ACMRD', base];
  if (head) args.push(head);
  const out = execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('\t');
      const status = parts[0][0];
      const path = parts[parts.length - 1].replace(/\\/g, '/');
      return { status, path };
    });
}

// ── Candidate classification ────────────────────────────────────────────────

const CANDIDATE_SKIP_SUFFIXES = ['.stories.tsx', '.stories.ts', '.test.tsx', '.test.ts'];
// The ONE canonical set of directory names the render graph never walks into — `SKIP_DIRS` (below,
// in the render-graph section) is the SAME Set object, not a second literal (Task 816 R4: two
// literals synchronised only by a comment had already been named as a risk by Task 819's own notes).
// A changed file under any of these is never a production candidate, because it can never appear as a
// renderer OR a rendered node in the graph the resolution climbs.
const CANDIDATE_SKIP_DIR_SEGMENTS = new Set(['node_modules', '.next', 'storybook-static', '__tests__', 'stories']);

export function classifyChangedFile(entry) {
  if (entry.status === 'D') return { excluded: true, reason: 'deleted' };
  if (!entry.path.startsWith('src/')) return { excluded: true, reason: 'outside-src' };
  if (!/\.(ts|tsx)$/.test(entry.path)) return { excluded: true, reason: 'not-ts-tsx' };
  // A story/test file is never itself a production surface, and the render graph never treats one as
  // a renderer either (SKIP_SUFFIXES below) — without this, a changed .stories.tsx has zero renderers
  // in the graph and would wrongly resolve to itself as a "surface root" via the empty-importers rule.
  if (CANDIDATE_SKIP_SUFFIXES.some((s) => entry.path.endsWith(s))) {
    return { excluded: true, reason: 'story-or-test-file' };
  }
  // A file under a directory the render graph never walks into (e.g. src/stories/) has no renderers by
  // construction — not because nothing renders it, but because the graph is blind to that whole
  // subtree — so it would wrongly resolve to itself as a bogus "surface root". Exclude it here too,
  // for the same reason the story/test-file check above exists.
  const segments = entry.path.split('/');
  if (segments.some((seg) => CANDIDATE_SKIP_DIR_SEGMENTS.has(seg))) {
    return { excluded: true, reason: 'non-production-directory' };
  }
  return { excluded: false };
}

// ── Whole-src render graph ──────────────────────────────────────────────────

// One literal, not two (Task 816 R4): `CANDIDATE_SKIP_DIR_SEGMENTS` above is the canonical set of
// directory names the render graph never walks into; `SKIP_DIRS` is the SAME Set object, not a copy,
// so the two can never drift out of sync again.
const SKIP_DIRS = CANDIDATE_SKIP_DIR_SEGMENTS;
const SKIP_SUFFIXES = ['.stories.tsx', '.stories.ts', '.test.tsx', '.test.ts'];

function collectProductionFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) results.push(...collectProductionFiles(full));
    else if (/\.(ts|tsx)$/.test(entry) && !SKIP_SUFFIXES.some((s) => entry.endsWith(s))) results.push(full);
  }
  return results;
}

/**
 * Builds the whole-src reverse render graph: renderedBy.get(X) = every relPath that renders X as a
 * JSX tag. A production-file, non-type-only, actually-rendered walk — same filter shape as
 * check-rendered-scope.mjs, applied to every file under src/ rather than only enrolled roots.
 */
export function buildRenderGraph() {
  const files = collectProductionFiles(SRC_DIR);
  const renderedBy = new Map();
  function addEdge(from, to) {
    if (!renderedBy.has(to)) renderedBy.set(to, []);
    renderedBy.get(to).push(from);
  }
  for (const absPath of files) {
    const relPath = relative(ROOT, absPath).replace(/\\/g, '/');
    let sourceFile;
    try {
      sourceFile = parseSourceFile(absPath);
    } catch {
      continue; // unparseable — tsc/check:stories catch this; not this mapper's concern
    }
    const renderedTagRoots = extractJsxTagRootIdentifiers(sourceFile);
    const bindings = extractImportBindings(sourceFile);
    for (const b of bindings) {
      if (b.typeOnly || !renderedTagRoots.has(b.localName)) continue;
      const resolved = resolveImportSpecifier(absPath, b.spec);
      if (!resolved) continue;
      const unwrap = unwrapBarrel(resolved, b.importedExportName);
      addEdge(relPath, unwrap.path);
    }
  }
  const relFiles = files.map((f) => relative(ROOT, f).replace(/\\/g, '/'));
  return { renderedBy, fileCount: files.length, relFiles };
}

export function isSurfaceRoot(relPath, manifestSet) {
  return manifestSet.has(relPath) || relPath.startsWith('src/app/');
}

/**
 * The full candidate space (Task 819 Revision 1, R13): every production file under `src/` that is
 * itself a surface root — a manifest entry, a route file under `src/app/**`, or a file nothing in the
 * whole-src render graph renders. Used to seed the baseline against the space `--seed-baseline`
 * should cover, not one diff's mapped surfaces.
 */
export function computeCandidateSurfaces(manifestSet) {
  const { renderedBy, relFiles } = buildRenderGraph();
  const roots = new Set();
  for (const f of relFiles) {
    const renderers = renderedBy.get(f);
    if (isSurfaceRoot(f, manifestSet) || !renderers || renderers.length === 0) {
      roots.add(f);
    }
  }
  return [...roots].sort();
}

/**
 * Pure: resolves one changed file upward to its surface root(s) via breadth-first climb over
 * `renderedBy` (a Map<string,string[]>). See the module doc comment for the three-rule resolution
 * contract. `renderedBy`/`manifestSet` are parameters (not module state) so the self-test exercises
 * this exact function with a synthetic graph — no real git or filesystem I/O.
 */
export function resolveSurfacesFor(startPath, renderedBy, manifestSet) {
  const roots = new Set();
  const visited = new Set([startPath]);
  const queue = [startPath];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (isSurfaceRoot(cur, manifestSet)) {
      roots.add(cur);
      continue; // never climb past a root
    }
    const importers = renderedBy.get(cur) || [];
    if (importers.length === 0) {
      roots.add(cur); // nothing renders it -> it is itself a root
      continue;
    }
    for (const imp of importers) {
      if (!visited.has(imp)) {
        visited.add(imp);
        queue.push(imp);
      }
    }
  }
  if (roots.size === 0) return { unresolved: true }; // a fully-explored cycle with no root anywhere
  return { unresolved: false, roots: [...roots].sort() };
}

// ── The whole mapping, one structured result ────────────────────────────────

export function loadManifestSet() {
  try {
    const value = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

/**
 * The whole mapping as one function: git merge-base -> git diff -> classify -> resolve. Git calls are
 * the only I/O; everything else routes through the pure functions above. Returns one structured
 * result — `failClosed: true` names the exact R5 condition that fired; `failClosed: false` carries the
 * full included/excluded scope. Never throws for an ordinary failure condition (git absent, no merge
 * base, limits exceeded, unresolved candidate) — those are all `failClosed` results, not exceptions.
 */
export function runMapping({ base, head = null, maxChangedFiles = DEFAULT_MAX_CHANGED_FILES, maxSurfaces = DEFAULT_MAX_SURFACES }) {
  if (!base) {
    return { failClosed: true, reason: 'missing-base', detail: '--base <ref> is required' };
  }

  const mb = gitMergeBase(base, head ?? 'HEAD');
  if (mb.error) {
    return { failClosed: true, reason: 'merge-base-unavailable', detail: mb.error };
  }

  let entries;
  try {
    entries = gitDiffNameStatus(mb.mergeBase, head);
  } catch (err) {
    return { failClosed: true, reason: 'diff-unavailable', detail: String(err.message).split('\n')[0] };
  }

  if (entries.length > maxChangedFiles) {
    return {
      failClosed: true,
      reason: 'changed-file-limit-exceeded',
      detail: `${entries.length} changed file(s) exceeds the limit of ${maxChangedFiles}`,
      changedCount: entries.length,
      limit: maxChangedFiles,
    };
  }

  const excluded = [];
  const candidates = [];
  for (const entry of entries) {
    const c = classifyChangedFile(entry);
    if (c.excluded) excluded.push({ path: entry.path, reason: c.reason });
    else candidates.push(entry.path);
  }
  candidates.sort();
  excluded.sort((a, b) => a.path.localeCompare(b.path));

  const included = new Set();
  const unresolved = [];
  let graphFileCount = 0;

  if (candidates.length > 0) {
    const manifestSet = loadManifestSet();
    const { renderedBy, fileCount } = buildRenderGraph();
    graphFileCount = fileCount;
    for (const c of candidates) {
      const res = resolveSurfacesFor(c, renderedBy, manifestSet);
      if (res.unresolved) unresolved.push(c);
      else res.roots.forEach((r) => included.add(r));
    }
  }
  unresolved.sort();

  if (unresolved.length > 0) {
    return {
      failClosed: true,
      reason: 'unresolved-candidate',
      detail: unresolved,
      changedCount: entries.length,
      excluded,
      included: [...included].sort(),
      graphFileCount,
    };
  }

  const includedSorted = [...included].sort();
  if (includedSorted.length > maxSurfaces) {
    return {
      failClosed: true,
      reason: 'surface-limit-exceeded',
      detail: `${includedSorted.length} mapped surface(s) exceeds the limit of ${maxSurfaces}`,
      changedCount: entries.length,
      surfaceCount: includedSorted.length,
      limit: maxSurfaces,
    };
  }

  return {
    failClosed: false,
    base,
    head: head ?? '(working tree)',
    mergeBase: mb.mergeBase,
    changedCount: entries.length,
    excluded,
    included: includedSorted,
    limits: { maxChangedFiles, maxSurfaces },
    graphFileCount,
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    base: null,
    head: null,
    maxChangedFiles: DEFAULT_MAX_CHANGED_FILES,
    maxSurfaces: DEFAULT_MAX_SURFACES,
    json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base') args.base = argv[++i];
    else if (argv[i] === '--head') args.head = argv[++i];
    else if (argv[i] === '--max-changed-files') args.maxChangedFiles = Number(argv[++i]);
    else if (argv[i] === '--max-surfaces') args.maxSurfaces = Number(argv[++i]);
    else if (argv[i] === '--json') args.json = true;
  }
  return args;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const result = runMapping(args);

  if (args.json) {
    console.log(JSON.stringify(result));
  } else {
    console.log('map-changed-surfaces — PR-diff -> affected-surface mapper (Task 819)');
    if (result.failClosed) {
      console.error(`FAIL  ${result.reason}: ${typeof result.detail === 'string' ? result.detail : JSON.stringify(result.detail)}`);
      if (result.excluded) {
        console.error(`    Excluded (${result.excluded.length}):`);
        for (const e of result.excluded) console.error(`      ${e.path}  [${e.reason}]`);
      }
      if (result.included) {
        console.error(`    Included surfaces so far (${result.included.length}):`);
        for (const s of result.included) console.error(`      ${s}`);
      }
    } else {
      console.log(`    Base: ${result.base}  Head: ${result.head}  Merge base: ${result.mergeBase}`);
      console.log(`    Changed paths seen: ${result.changedCount}`);
      console.log(`    Render graph: ${result.graphFileCount} production file(s) under src/ (built only when there is a candidate to resolve)`);
      console.log(`    Excluded (${result.excluded.length}):`);
      for (const e of result.excluded) console.log(`      ${e.path}  [${e.reason}]`);
      console.log(`    Included surfaces (${result.included.length}):`);
      for (const s of result.included) console.log(`      ${s}`);
      console.log(`    Limits: maxChangedFiles=${result.limits.maxChangedFiles} maxSurfaces=${result.limits.maxSurfaces}`);
      console.log('    Cannot see: dynamic import(), React.lazy(), a surface reached only through a route convention');
      console.log('    this mapper does not model, or a file changed outside src/.');
    }
  }
  process.exit(result.failClosed ? 1 : 0);
}
