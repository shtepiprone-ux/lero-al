#!/usr/bin/env node
/**
 * verify-p3doubleprime.mjs — Task 765 Revision 2, P3″ evidence helper.
 *
 * Purpose: prove `check:css-vars` fails for the real `--motion-duration-slow`
 * token when its shipped declaration disappears while ownership (globals.css)
 * and its real consumer (AppImage.module.css) stay intact — the detector
 * condition the gate's own `--verify-gate` self-test exercises via its
 * `--css-dir`/`--globals-path`/`--src-dir` input seam (R11).
 *
 * The REAL repository tree is never written to. Only a mkdtemp copy of
 * `.next/static/css` is mutated; `--globals-path`/`--src-dir` point at the
 * real files for read-only scanning by the gate subprocess.
 */

import {
  mkdtempSync, cpSync, rmSync, readdirSync, readFileSync, writeFileSync,
  utimesSync, existsSync,
} from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

import {
  extractCssDeclaredNames,
  findVarReferences,
  stripComments,
  extractOwnedNames,
} from '../../../../../scripts/check-css-var-resolvability.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../../../..');
const TARGET_NAME = '--motion-duration-slow';
const REAL_CSS_DIR = resolve(ROOT, '.next/static/css');
const REAL_GLOBALS_PATH = resolve(ROOT, 'src/app/globals.css');
const REAL_SRC_DIR = resolve(ROOT, 'src');
const REAL_APPIMAGE_CSS = resolve(ROOT, 'src/components/ui/AppImage.module.css');
const GATE_SCRIPT = resolve(ROOT, 'scripts/check-css-var-resolvability.mjs');

class Blocked extends Error {}

function listCssFiles(cssDir) {
  if (!existsSync(cssDir)) return [];
  return readdirSync(cssDir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => join(cssDir, f));
}

function countStaticVarRefs(rawContent, name) {
  const stripped = stripComments(rawContent, true);
  return findVarReferences(stripped).filter((r) => r.name === name).length;
}

let tempBase = null;

function main() {
  console.log('=== P3″ census (pre-mutation) ===');

  // ── Pre-mutation census 1: real globals.css owns the target name ──────────
  const realGlobalsRaw = readFileSync(REAL_GLOBALS_PATH, 'utf8');
  const ownedSet = extractOwnedNames(realGlobalsRaw);
  const owns = ownedSet.has(TARGET_NAME);
  console.log(`census.ownsTarget(real globals.css) = ${owns}`);
  if (!owns) throw new Blocked(`real globals.css does not own ${TARGET_NAME} — cannot proceed`);

  // ── Set up temp copy ────────────────────────────────────────────────────
  tempBase = mkdtempSync(join(tmpdir(), 'task765-p3doubleprime-'));
  const tempCssDir = join(tempBase, 'css');
  cpSync(REAL_CSS_DIR, tempCssDir, { recursive: true });
  console.log(`tempCssDir = ${tempCssDir}`);

  // ── Pre-mutation census 2: exactly one declaration site in the copy ──────
  const cssFiles = listCssFiles(tempCssDir);
  const declFiles = [];
  for (const f of cssFiles) {
    const raw = readFileSync(f, 'utf8');
    if (extractCssDeclaredNames(raw).has(TARGET_NAME)) declFiles.push(f);
  }
  console.log(`census.declarationSites(copied bundle, pre-mutation) = ${declFiles.length} — ${declFiles.map((f) => relative(ROOT, f)).join(', ') || '(none)'}`);
  if (declFiles.length !== 1) {
    throw new Blocked(`expected exactly 1 declaration site for ${TARGET_NAME} in the copied bundle, found ${declFiles.length}`);
  }
  const declFile = declFiles[0];
  const declFileRawBefore = readFileSync(declFile, 'utf8');
  const declOccurrencesBefore = (declFileRawBefore.match(
    new RegExp(`${TARGET_NAME.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*:`, 'g'),
  ) || []).length;
  if (declOccurrencesBefore !== 1) {
    throw new Blocked(`expected exactly 1 textual declaration occurrence of ${TARGET_NAME} in ${relative(ROOT, declFile)}, found ${declOccurrencesBefore}`);
  }

  // ── Pre-mutation census 3: copied bundle retains a static var() reference ─
  let bundleRefCountBefore = 0;
  for (const f of cssFiles) {
    bundleRefCountBefore += countStaticVarRefs(readFileSync(f, 'utf8'), TARGET_NAME);
  }
  console.log(`census.bundleVarReferences(copied bundle, pre-mutation) = ${bundleRefCountBefore}`);
  if (bundleRefCountBefore < 1) {
    throw new Blocked(`copied bundle has 0 static var(${TARGET_NAME}) references before mutation — nothing to orphan`);
  }

  // ── Pre-mutation census 4: real AppImage.module.css retains its consumer ─
  const appImageRaw = readFileSync(REAL_APPIMAGE_CSS, 'utf8');
  const appImageRefCount = countStaticVarRefs(appImageRaw, TARGET_NAME);
  console.log(`census.appImageConsumerRefs(real AppImage.module.css) = ${appImageRefCount}`);
  if (appImageRefCount < 1) {
    throw new Blocked(`real AppImage.module.css has 0 static var(${TARGET_NAME}) references — no live consumer to orphan`);
  }

  console.log('=== census PASSED — proceeding to mutation ===');

  // ── Mutation: remove ONLY the one declaration from the temp copy ─────────
  const declRe = new RegExp(`${TARGET_NAME.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*:[^;]*;`);
  const m = declRe.exec(declFileRawBefore);
  if (!m) throw new Blocked(`declaration regex did not match in ${relative(ROOT, declFile)} despite census — aborting`);
  const mutatedContent = declFileRawBefore.slice(0, m.index) + declFileRawBefore.slice(m.index + m[0].length);
  writeFileSync(declFile, mutatedContent, 'utf8');
  console.log(`mutation: removed declaration text "${m[0]}" from ${relative(ROOT, declFile)}`);

  // ── Post-mutation re-census: zero declarations, reference remains ────────
  let declFilesAfter = 0;
  let bundleRefCountAfter = 0;
  for (const f of cssFiles) {
    const raw = readFileSync(f, 'utf8');
    if (extractCssDeclaredNames(raw).has(TARGET_NAME)) declFilesAfter++;
    bundleRefCountAfter += countStaticVarRefs(raw, TARGET_NAME);
  }
  console.log(`census.declarationSites(copied bundle, post-mutation) = ${declFilesAfter}`);
  console.log(`census.bundleVarReferences(copied bundle, post-mutation) = ${bundleRefCountAfter}`);
  if (declFilesAfter !== 0) {
    throw new Blocked(`expected 0 declaration sites for ${TARGET_NAME} after mutation, found ${declFilesAfter}`);
  }
  if (bundleRefCountAfter !== bundleRefCountBefore) {
    throw new Blocked(`var() reference count changed by the mutation (before=${bundleRefCountBefore}, after=${bundleRefCountAfter}) — mutation touched a reference, not just the declaration`);
  }

  // ── Freshen temp CSS mtimes (gate's own freshness-trap avoidance) ────────
  const future = new Date(Date.now() + 60_000);
  for (const f of listCssFiles(tempCssDir)) utimesSync(f, future, future);
  console.log(`freshened ${listCssFiles(tempCssDir).length} temp CSS file mtimes to ${future.toISOString()}`);

  // ── Run the gate against the temp copy + real globals/src ────────────────
  console.log('=== gate invocation ===');
  const args = [
    GATE_SCRIPT,
    '--css-dir', tempCssDir,
    '--globals-path', REAL_GLOBALS_PATH,
    '--src-dir', REAL_SRC_DIR,
  ];
  console.log(`COMMAND=node ${args.join(' ')}`);
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
  console.log('--- gate stdout ---');
  console.log(result.stdout);
  console.log('--- gate stderr ---');
  console.log(result.stderr);
  console.log(`--- gate exit code: ${result.status} ---`);

  // ── Assertions ─────────────────────────────────────────────────────────
  console.log('=== assertions ===');
  const combined = `${result.stdout}\n${result.stderr}`;
  const assertions = [];

  assertions.push(['exit code === 1', result.status === 1]);

  const headerMatch = combined.match(/owned custom properties.*:\s*(\d+)/);
  const ownedCount = headerMatch ? Number(headerMatch[1]) : null;
  assertions.push([`owned-property header === 264 (found ${ownedCount})`, ownedCount === 264]);

  const armBViolation = new RegExp(
    `Arm B\\s+\\S*AppImage\\.module\\.css:\\d+\\s+var\\(${TARGET_NAME}\\)`,
  ).test(combined);
  assertions.push(['Arm B violation names AppImage.module.css + var(--motion-duration-slow)', armBViolation]);

  const armAViolation = new RegExp(`Arm A\\s+\\S+\\s+var\\(${TARGET_NAME}\\)`).test(combined);
  assertions.push(['at least one Arm A violation for var(--motion-duration-slow)', armAViolation]);

  let allPassed = true;
  for (const [label, ok] of assertions) {
    console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
    if (!ok) allPassed = false;
  }

  if (!allPassed) {
    throw new Blocked('one or more required assertions failed — see PASS/FAIL lines above');
  }

  console.log('=== P3″ PLANT CONFIRMED: all required assertions passed ===');
}

try {
  main();
  process.exitCode = 0;
} catch (err) {
  if (err instanceof Blocked) {
    console.error(`BLOCKED: ${err.message}`);
  } else {
    console.error(`BLOCKED: unhandled exception — ${err.stack || err}`);
  }
  process.exitCode = 1;
} finally {
  if (tempBase && existsSync(tempBase)) {
    rmSync(tempBase, { recursive: true, force: true });
    console.log(`TEMP_DIR_REMOVED=true (${tempBase})`);
  } else {
    console.log('TEMP_DIR_REMOVED=true (no temp dir was created)');
  }
}
