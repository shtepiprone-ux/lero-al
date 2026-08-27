#!/usr/bin/env node
/**
 * task770-copyid-computed.mjs — Task 770 AC3 retained computed-style evidence.
 *
 * WHY THIS SCRIPT EXISTS: AC3 requires a computed-style read of `MantineCopyIdButton`'s `.copyId`
 * in BOTH light and dark, pre and post migration, with both transcripts retained. The original
 * Task 770 session produced no such artifact — it argued the four colour alias-hop removals were
 * identical "by construction" instead. That argument is sound (kickoff §3.3, and `.dark` is applied
 * to `document.documentElement` by `.storybook/preview.tsx`, so `:root` and `.dark` are the SAME
 * element and a `:root`-computed alias picks up the dark override), but an argument is not the
 * artifact AC3 asks for. This script produces the artifact.
 *
 * THE THREE MEASURED VALUES, and why each needs a different interaction state:
 *   color      — resting state of `[data-copy-id]`. Reads `--muted-foreground` through
 *                `color-mix(in oklab, … 70%, transparent)`.
 *   boxShadow  — `:focus-visible` ONLY (`box-shadow: 0 0 0 1px var(--ring)`), so the button must be
 *                reached by KEYBOARD. A programmatic `.focus()` does not reliably set
 *                `:focus-visible` in Chromium, so this script Tabs to the control and asserts
 *                `matches(':focus-visible')` before reading. If it cannot, it fails closed.
 *   iconColor  — the COPIED icon (`.copiedIcon { color: var(--status-success) }`) renders only for
 *                ~1500ms after activation (`MantineCopyIdButton.tsx` `copied` state), so the script
 *                presses Enter on the focused button and reads within that window. `.notCopiedIcon`
 *                carries `opacity: .5` and `.copiedIcon` does not, which is the fail-closed
 *                discriminator that the copied icon — not the resting one — was measured.
 *
 * SOURCE IDENTITY. `sourceGitSha` / `sourceGitDirty` come from read-only git run in the repository
 * that OWNS the `storybook-static` directory being measured — so a pre-edit capture served from a
 * baseline worktree is attributed to that worktree, not to the checkout the script lives in.
 * `sourceTreeSha` is NOT `git write-tree` (that would mutate the object store, which is owner-only
 * here). It is a sha256 over the sorted (path, sha256(content)) list of `globals.css` plus the
 * twelve manifest files — a content identity that is exact for the files this evidence is about and
 * that stays meaningful in a dirty worktree, where `HEAD^{tree}` would silently describe the wrong
 * content.
 *
 * FAILS CLOSED on: an unreadable/missing `index.json`; the story id absent from it; a root that
 * fails strict readiness (expected Storybook root present, non-zero bounding rectangle, at least one
 * visible descendant); the theme global not actually applied to `documentElement`; a missing
 * `[data-copy-id]`; a control that cannot be reached by keyboard as `:focus-visible`; a missing or
 * ambiguous icon; a copied icon that never appeared; or an output path that already exists
 * (no-clobber — evidence is never silently overwritten).
 *
 * Usage:
 *   node scripts/task770-copyid-computed.mjs <label> [--dir <storybook-static-dir>] [--out-dir <dir>]
 *   node scripts/task770-copyid-computed.mjs --compare [--pre <file>] [--post <file>] [--out-dir <dir>]
 *
 * <label> is typically 'pre' or 'post'; output is written per-label to
 * docs/sessions/evidence/task770/ac3-final/task770-copyid-computed-<label>.json (a clean directory:
 * the 2026-08-27 run that fell closed on the ambiguous selector is retained beside it, unmodified).
 * `--compare` FAILS CLOSED when pre and post carry the same `sourceTreeSha`: two captures of the
 * same content cannot demonstrate pre/post equivalence, so that is an INVALID result, not a warning.
 * `--compare` asserts string equality for all six measured values (three per mode) and writes
 * docs/sessions/evidence/task770/ac3-final/task770-copyid-comparison.json, exiting non-zero on any
 * mismatch and on an identical-source comparison.
 *
 * Added by Task 770 remediation, 2026-08-27. Docs: docs/design-system.md §23.8.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const STORY_ID = 'mantine-primitives-copyidbutton--default';
// The canonical Default story deliberately renders TWO controls (CopyIdButton.stories.tsx):
// `story-listing-001` stays RESTING, and its `play` function clicks `story-listing-002` so the
// copied state renders beside it. AC3 must measure the first/resting fixture, so the selector is
// pinned to it by `title` — `MantineCopyIdButton` sets `title={id}`, which is production markup.
// A CSS-module `.copyId` class name is hashed at build time and is NOT a stable selector.
const SELECTOR = 'button[data-copy-id][title="story-listing-001"]';
const MODES = ['light', 'dark'];
const MEASURED_KEYS = ['color', 'boxShadow', 'iconColor'];
// Clean-run evidence lives in its own directory so the 2026-08-27 failed run (which fell closed on
// the ambiguous two-control selector) is retained as failed-run evidence rather than overwritten.
const EVIDENCE_SUBDIR = 'docs/sessions/evidence/task770/ac3-final';

// globals.css + the twelve manifest inputs — the content identity this evidence is about.
const IDENTITY_FILES = [
  'src/app/globals.css',
  'src/app/[locale]/layout.tsx',
  'src/app/[locale]/page.tsx',
  'src/components/layout/FooterView.module.css',
  'src/components/layout/HeaderView.module.css',
  'src/components/layout/MobileBottomNavView.module.css',
  'src/components/shared/HeroSearchView.module.css',
  'src/design-system/mantine/patterns/MantineCopyIdButton.module.css',
  'src/design-system/mantine/patterns/MantineHomeSection.tsx',
  'src/design-system/mantine/patterns/MantineListingCardPattern.module.css',
  'src/modules/listings/components/FeaturedListingsView.module.css',
  'src/modules/listings/components/LatestListingsView.module.css',
  'src/modules/listings/components/ListingCard.module.css',
];

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

function die(message, code = 1) {
  console.error(`❌ task770-copyid-computed: ${message}`);
  process.exit(code);
}

function startStaticServer(staticDir) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      try {
        const data = await readFile(join(staticDir, urlPath));
        res.writeHead(200, { 'Content-Type': MIME[extname(urlPath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolvePromise(server));
  });
}

function sourceIdentity(repoRoot) {
  const identity = { repoRoot, sourceGitSha: null, sourceGitDirty: null, sourceTreeSha: null, identityFiles: [] };
  try {
    identity.sourceGitSha = execFileSync('git', ['-C', repoRoot, '--no-optional-locks', 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const porcelain = execFileSync('git', ['-C', repoRoot, '--no-optional-locks', 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' });
    identity.sourceGitDirty = porcelain.trim().length > 0;
  } catch (e) {
    identity.gitError = e instanceof Error ? e.message : String(e);
  }
  const perFile = [];
  for (const rel of IDENTITY_FILES) {
    const abs = join(repoRoot, rel);
    if (!existsSync(abs)) return die(`source identity: required file missing in ${repoRoot}: ${rel}`);
    const sha = createHash('sha256').update(readFileSync(abs)).digest('hex');
    perFile.push({ file: rel, sha256: sha });
  }
  identity.identityFiles = perFile;
  identity.sourceTreeSha = createHash('sha256')
    .update(perFile.map((f) => `${f.file}|${f.sha256}`).sort().join('\n'))
    .digest('hex');
  return identity;
}

// Strict root readiness — identical contract to task770-storybook-capture.mjs.
const ROOT_READINESS = () => {
  const root = document.getElementById('storybook-root') ?? document.querySelector('#root');
  if (!root) return { ok: false, reason: 'expected Storybook root (#storybook-root / #root) is absent' };
  const rect = root.getBoundingClientRect();
  const rootWidth = Math.round(rect.width);
  const rootHeight = Math.round(rect.height);
  if (!(rect.width > 0 && rect.height > 0)) {
    return { ok: false, reason: `root has a zero bounding rectangle (${rootWidth}x${rootHeight})`, rootWidth, rootHeight };
  }
  const descendants = Array.from(root.querySelectorAll('*'));
  const visibleDescendants = descendants.filter((el) => {
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) !== 0;
  }).length;
  if (visibleDescendants === 0) {
    return { ok: false, reason: 'root has no visible descendant (empty or error shell)', rootWidth, rootHeight, descendants: descendants.length, visibleDescendants };
  }
  return { ok: true, rootId: root.id || '(unnamed)', rootWidth, rootHeight, descendants: descendants.length, visibleDescendants };
};

async function measureMode(browser, baseUrl, mode) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const cell = { mode, storyId: STORY_ID, selector: SELECTOR };
  try {
    const url = `${baseUrl}/iframe.html?id=${STORY_ID}&viewMode=story&globals=theme:${mode}`;
    cell.url = url;
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    cell.httpStatus = response ? response.status() : null;
    if (!response || !response.ok()) return { ...cell, ok: false, failReason: `non-OK response status ${cell.httpStatus}` };

    const readiness = await page.evaluate(ROOT_READINESS);
    cell.rootReadiness = readiness;
    if (!readiness.ok) return { ...cell, ok: false, failReason: `root readiness failed: ${readiness.reason}` };

    // The theme global must have actually reached documentElement, or the "dark" run is a light run.
    const themeApplied = await page.evaluate(() => ({
      htmlClass: document.documentElement.className,
      isDark: document.documentElement.classList.contains('dark'),
    }));
    cell.documentElementClass = themeApplied.htmlClass;
    cell.darkClassApplied = themeApplied.isDark;
    if (themeApplied.isDark !== (mode === 'dark')) {
      return { ...cell, ok: false, failReason: `theme global did not apply: mode=${mode} but documentElement.classList.contains('dark')=${themeApplied.isDark} (class="${themeApplied.htmlClass}")` };
    }

    const present = await page.evaluate((sel) => document.querySelectorAll(sel).length, SELECTOR);
    cell.matchCount = present;
    if (present !== 1) return { ...cell, ok: false, failReason: `expected exactly 1 ${SELECTOR}, found ${present}` };

    cell.color = await page.evaluate((sel) => getComputedStyle(document.querySelector(sel)).color, SELECTOR);

    // Keyboard focus — :focus-visible is what carries the ring box-shadow.
    let focusVisible = false;
    for (let i = 0; i < 15 && !focusVisible; i++) {
      await page.keyboard.press('Tab');
      focusVisible = await page.evaluate((sel) => {
        const el = document.activeElement;
        return !!el && el.matches(sel) && el.matches(':focus-visible');
      }, SELECTOR);
    }
    cell.focusVisibleReached = focusVisible;
    if (!focusVisible) return { ...cell, ok: false, failReason: `could not reach ${SELECTOR} as :focus-visible by keyboard within 15 Tab presses` };
    cell.boxShadow = await page.evaluate((sel) => getComputedStyle(document.querySelector(sel)).boxShadow, SELECTOR);

    // Enter activates the focused button -> copied state -> .copiedIcon renders for ~1500ms only
    // (MantineCopyIdButton.tsx resets after a 1500ms timer). Bounded retry: if the read lands after
    // that window the icon reads back at opacity .5, which is the resting icon — re-activate and
    // read again rather than recording the wrong state. Still fails closed after two attempts.
    let icon = { ok: false, reason: 'copied state never captured' };
    for (let attempt = 1; attempt <= 2 && !icon.ok; attempt++) {
      await page.keyboard.press('Enter');
      await page.waitForFunction((sel) => {
        const btn = document.querySelector(sel);
        const svgs = btn ? btn.querySelectorAll('svg') : [];
        return svgs.length === 1 && Number(getComputedStyle(svgs[0]).opacity) === 1;
      }, SELECTOR, { timeout: 800 }).catch(() => {});

      icon = await page.evaluate((sel) => {
        const btn = document.querySelector(sel);
        const svgs = btn ? Array.from(btn.querySelectorAll('svg')) : [];
        if (svgs.length !== 1) return { ok: false, reason: `expected exactly 1 icon inside ${sel}, found ${svgs.length}` };
        const cs = getComputedStyle(svgs[0]);
        // .notCopiedIcon carries opacity .5; .copiedIcon does not. This discriminates the states.
        if (Number(cs.opacity) !== 1) {
          return { ok: false, reason: `icon opacity ${cs.opacity} — this is the resting (not-copied) icon, the copied state was not captured`, opacity: cs.opacity };
        }
        return { ok: true, color: cs.color, opacity: cs.opacity };
      }, SELECTOR);
      cell.copiedStateAttempts = attempt;
    }
    cell.iconOpacity = icon.opacity ?? null;
    if (!icon.ok) return { ...cell, ok: false, failReason: icon.reason };
    cell.iconColor = icon.color;

    return { ...cell, ok: true };
  } catch (err) {
    return { ...cell, ok: false, failReason: `navigation/evaluation error: ${err instanceof Error ? err.message : String(err)}` };
  } finally {
    await context.close();
  }
}

async function runCapture(args) {
  const label = args[0];
  const dirIdx = args.indexOf('--dir');
  const outIdx = args.indexOf('--out-dir');
  const storybookStaticDir = dirIdx !== -1 && args[dirIdx + 1]
    ? resolve(process.cwd(), args[dirIdx + 1])
    : join(ROOT, 'storybook-static');
  const outDir = outIdx !== -1 && args[outIdx + 1]
    ? resolve(process.cwd(), args[outIdx + 1])
    : join(ROOT, EVIDENCE_SUBDIR);

  const outPath = join(outDir, `task770-copyid-computed-${label}.json`);
  if (existsSync(outPath)) die(`refusing to overwrite existing evidence: ${outPath}`);
  await mkdir(outDir, { recursive: true });

  let indexJson;
  try {
    indexJson = JSON.parse(await readFile(join(storybookStaticDir, 'index.json'), 'utf8'));
  } catch (e) {
    return die(`could not read/parse index.json at ${join(storybookStaticDir, 'index.json')}: ${e.message}`);
  }
  if (!Object.keys(indexJson.entries ?? {}).includes(STORY_ID)) {
    return die(`story id ${STORY_ID} is absent from ${storybookStaticDir}/index.json`);
  }

  const identity = sourceIdentity(dirname(storybookStaticDir));
  const server = await startStaticServer(storybookStaticDir);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });

  const modes = [];
  try {
    for (const mode of MODES) modes.push(await measureMode(browser, baseUrl, mode));
  } finally {
    await browser.close();
    server.close();
  }

  const result = {
    label,
    storyId: STORY_ID,
    selector: SELECTOR,
    timestamp: new Date().toISOString(),
    storybookStaticDir,
    sourceGitSha: identity.sourceGitSha,
    sourceGitDirty: identity.sourceGitDirty,
    sourceTreeSha: identity.sourceTreeSha,
    sourceIdentity: identity,
    modes,
  };
  await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  for (const m of modes) {
    console.log(m.ok
      ? `  ${m.mode.padEnd(5)} color=${m.color}  boxShadow=${m.boxShadow}  iconColor=${m.iconColor}`
      : `  ${m.mode.padEnd(5)} FAILED — ${m.failReason}`);
  }
  const failed = modes.filter((m) => !m.ok);
  if (failed.length > 0) die(`${failed.length}/${modes.length} mode(s) failed closed (see failReason above).`);
  console.log('✅ task770-copyid-computed: both modes measured cleanly.');
}

async function runCompare(args) {
  const outIdx = args.indexOf('--out-dir');
  const preIdx = args.indexOf('--pre');
  const postIdx = args.indexOf('--post');
  const outDir = outIdx !== -1 && args[outIdx + 1]
    ? resolve(process.cwd(), args[outIdx + 1])
    : join(ROOT, EVIDENCE_SUBDIR);
  const prePath = preIdx !== -1 && args[preIdx + 1] ? resolve(process.cwd(), args[preIdx + 1]) : join(outDir, 'task770-copyid-computed-pre.json');
  const postPath = postIdx !== -1 && args[postIdx + 1] ? resolve(process.cwd(), args[postIdx + 1]) : join(outDir, 'task770-copyid-computed-post.json');
  const outPath = join(outDir, 'task770-copyid-comparison.json');
  if (existsSync(outPath)) die(`refusing to overwrite existing evidence: ${outPath}`);

  for (const p of [prePath, postPath]) if (!existsSync(p)) die(`missing input: ${p}`);
  const pre = JSON.parse(await readFile(prePath, 'utf8'));
  const post = JSON.parse(await readFile(postPath, 'utf8'));

  const comparisons = [];
  for (const mode of MODES) {
    const a = pre.modes?.find((m) => m.mode === mode);
    const b = post.modes?.find((m) => m.mode === mode);
    if (!a || !b) die(`mode "${mode}" missing from ${!a ? prePath : postPath}`);
    if (!a.ok || !b.ok) die(`mode "${mode}" was not measured cleanly in ${!a.ok ? prePath : postPath}`);
    for (const key of MEASURED_KEYS) {
      comparisons.push({ mode, value: key, pre: a[key], post: b[key], equal: a[key] === b[key] });
    }
  }
  const mismatches = comparisons.filter((c) => !c.equal);
  // Two captures of the SAME content cannot demonstrate pre/post equivalence — an "EQUAL" verdict
  // from identical trees is vacuous. This fails closed rather than warning.
  const identicalSource = Boolean(pre.sourceTreeSha) && pre.sourceTreeSha === post.sourceTreeSha;
  const verdict = identicalSource ? 'INVALID_IDENTICAL_SOURCE' : (mismatches.length === 0 ? 'EQUAL' : 'MISMATCH');
  const report = {
    task: 'Task 770 — AC3 computed-style equivalence',
    timestamp: new Date().toISOString(),
    assertion: 'string equality of all six measured values (color, boxShadow, iconColor × light, dark)',
    pre: { path: prePath, sourceGitSha: pre.sourceGitSha, sourceGitDirty: pre.sourceGitDirty, sourceTreeSha: pre.sourceTreeSha, timestamp: pre.timestamp },
    post: { path: postPath, sourceGitSha: post.sourceGitSha, sourceGitDirty: post.sourceGitDirty, sourceTreeSha: post.sourceTreeSha, timestamp: post.timestamp },
    comparedValues: comparisons.length,
    equalValues: comparisons.length - mismatches.length,
    mismatches,
    identicalSource,
    verdict,
  };
  if (identicalSource) {
    report.invalidReason = 'pre and post sourceTreeSha are identical — both captures measured the SAME content, so this comparison cannot demonstrate pre/post equivalence.';
  }
  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  for (const c of comparisons) {
    console.log(`  ${c.equal ? '✅' : '❌'} ${c.mode.padEnd(5)} ${c.value.padEnd(10)} pre="${c.pre}"  post="${c.post}"`);
  }
  if (identicalSource) die(`INVALID — ${report.invalidReason} (sourceTreeSha ${pre.sourceTreeSha})`);
  if (mismatches.length > 0) die(`${mismatches.length}/${comparisons.length} measured value(s) differ pre vs post.`);
  console.log(`✅ task770-copyid-computed --compare: all ${comparisons.length} measured values are string-equal (pre tree ${pre.sourceTreeSha.slice(0, 12)}…, post tree ${post.sourceTreeSha.slice(0, 12)}…).`);
}

const args = process.argv.slice(2);
if (args.includes('--compare')) {
  await runCompare(args);
} else if (!args[0] || args[0].startsWith('--')) {
  console.error('Usage: node scripts/task770-copyid-computed.mjs <label> [--dir <storybook-static-dir>] [--out-dir <dir>]');
  console.error('       node scripts/task770-copyid-computed.mjs --compare [--pre <file>] [--post <file>] [--out-dir <dir>]');
  process.exit(2);
} else {
  await runCapture(args);
}
