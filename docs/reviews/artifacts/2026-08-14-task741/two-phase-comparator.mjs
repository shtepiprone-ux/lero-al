#!/usr/bin/env node
/**
 * Task 741 — two-phase before/after comparator for the `CLOSED_OVERLAY_STYLE` migration
 * (`ListingCard.tsx`'s `sold`/`rented` overlay -> `ListingCard.module.css` `@layer utilities`).
 *
 * REVISION 1 (2026-08-15): rebuilt per the review's F1/F5/F6/F7/F8 findings — see
 * `tasks/Sprints/Sprint_46_task741-revision-1-evidence-apparatus.md` §2-3.
 *
 * TWO REAL PHASES, ONE STORY (closes F7): both phases capture
 * `mantine-primitives-listingcard--default` — the real production `ListingCard.tsx`, never a
 * pattern-story probe:
 *   BEFORE = `docs/reviews/artifacts/2026-08-14-task741/before-storybook-static/`, built in a
 *            throwaway `git worktree add <path> HEAD` at the pre-migration base revision
 *            (`fc04a01c5`) with ONLY the permanent `ListingCard.stories.tsx` sold/rented extension
 *            copied in on top — `ListingCard.tsx` and `ListingCard.module.css` stay at HEAD there,
 *            so the story renders the real pre-migration Tailwind-utility overlay. The live worktree
 *            is never written to (git worktree, not a redirect/stash over a working file); see the
 *            revision session log for the `git hash-object` before/after proof. This witness is
 *            committed here (14 MB / 371 files) so the comparator is reproducible without rebuilding
 *            a worktree on every run. Placed under `docs/` deliberately: `src/app/globals.css:11`
 *            (`@source not "../../docs"`) excludes this whole subtree from Tailwind's content scan,
 *            so the witness's baked-in pre-migration class strings can never resurrect retired
 *            utilities in the app's own compiled CSS — unlike a same-named directory at the repo
 *            root, which is exactly what happened during the original implementation round.
 *   AFTER  = `storybook-static/`, built from this worktree after the migration lands. Same story,
 *            same id, real post-migration `ListingCard.module.css` classes.
 *
 * Both phases select the overlay label element structurally — `[class*="overlayLabel"]` (the CSS
 * Modules class the pattern always assigns, `MantineListingCardPattern.module.css:348`) — never by
 * translated text, so the same selector works across all 4 locales. The story renders exactly 2 such
 * elements in DOM order: [sold, rented] (`ListingCard.stories.tsx`'s `Default.render`).
 *
 * Measured per cell: overlay label `backgroundColor`, `borderColor`, and the element's full resolved
 * `className` string (tailwind-merge hazard) — captured on the REAL rendered element, not derived
 * from source text.
 *
 * Matrix: 4 canonical Mantine widths (320/375/390/1024, `scripts/check-stories-rendered.mjs`
 * MANTINE_VIEWPORTS) x 4 locales (sq/en/uk/it) x {sold, rented} x {backgroundColor, borderColor} x 2
 * phases = 64 property comparisons, PLUS 4 x 4 x {sold, rented} x {className} x 2 phases = 32
 * className observations (recorded, never compared — `className` differs by construction between a
 * Tailwind utility and a CSS Modules hash) = 96 recorded rows total (F4 — do not call this "96
 * cells" or "128 comparison points"; it is 32 rendered cells x 2 phases with 3 recorded rows each on
 * the sold/rented pair, of which 2 rows per pair are compared and 1 is informational).
 *
 * BEFORE-phase identity (closes 695's F2): asserts the BEFORE capture's className actually contains
 * the raw Tailwind utility substring (`bg-status-info`/`bg-status-rented`) and the AFTER capture does
 * not — so a comparator that silently ran against two identical builds cannot pass.
 *
 * Real plants only (closes F1): this script has NO `--plant` in-memory mutation mode. To prove
 * detection power, perturb the SOURCE (`ListingCard.module.css`), rebuild the AFTER phase for real,
 * and re-run — see the revision session log §2.3/§2.4 for the two plant recipes and their expected
 * MOVED counts.
 *
 * `--supports-off` mode (closes F5): Chromium cannot be made to lack `color-mix`, so this mode
 * intercepts every served CSS response in BOTH phases and strips every
 * `@supports (color: color-mix(in lab, red, red)) { ... }` block (balanced-brace removal), then
 * asserts at least one block was actually removed in each phase — fails closed if the strip did
 * nothing, so this mode can never silently degrade into a duplicate of the normal run.
 *
 * Fail-closed server (closes F8): each static server serves a real 404 for any unresolved path that
 * looks like an asset (has a file extension); the SPA `index.html` fallback applies only to
 * extension-less navigation paths. `requestfailed` and non-2xx `response` events from either origin
 * are collected as hard errors and force a non-zero exit regardless of the colour comparison result.
 *
 * Fail-closed build precondition: `requireBuild` asserts the directory exists AND that the CSS
 * bundle `iframe.html` actually references is present and non-empty, naming the exact path and the
 * rebuild recipe on failure.
 *
 * Usage:
 *   node two-phase-comparator.mjs                 Real run, BEFORE vs AFTER, color-mix tier.
 *   node two-phase-comparator.mjs --supports-off   Same, with the color-mix `@supports` tier
 *                                                   stripped from every served stylesheet in both
 *                                                   phases (base-tier proof).
 */
import { writeFile, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { existsSync, statSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');

// Committed witness under docs/ (Tailwind-scan-safe, see header). Override only for local
// experimentation; the committed path is what the revision's evidence and session log reference.
const BEFORE_STATIC = process.env.LERO_BEFORE_STATIC_DIR
  ? resolve(process.env.LERO_BEFORE_STATIC_DIR)
  : join(__dirname, 'before-storybook-static');
const AFTER_STATIC = join(ROOT, 'storybook-static');
const BEFORE_PORT = 6531;
const AFTER_PORT = 6532;
const SUPPORTS_OFF = process.argv.includes('--supports-off');
const LOCALES = ['sq', 'en', 'uk', 'it'];
// Verbatim from `scripts/check-stories-rendered.mjs` MANTINE_VIEWPORTS (:393-398).
const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 812 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1024', width: 1024, height: 768 },
];

// Both phases: same story, same id (closes F7).
const STORY_ID = 'mantine-primitives-listingcard--default';

/**
 * Fail closed on a missing or empty build: the directory must exist AND the exact CSS bundle
 * `iframe.html` links must exist and be non-empty. A directory that exists but never finished a
 * real Storybook build (e.g. an interrupted `npm run build-storybook`) must not silently pass.
 */
async function requireBuild(dir, label, hint) {
  if (!existsSync(dir)) {
    console.error(`${label} build not found at ${dir}.`);
    console.error(hint);
    process.exit(1);
  }
  const iframePath = join(dir, 'iframe.html');
  if (!existsSync(iframePath)) {
    console.error(`${label} build at ${dir} has no iframe.html — not a real Storybook build output.`);
    console.error(hint);
    process.exit(1);
  }
  const iframeHtml = await readFile(iframePath, 'utf8');
  const cssHrefs = [...iframeHtml.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/g)].map((m) => m[1]);
  if (cssHrefs.length === 0) {
    console.error(`${label} build at ${dir}'s iframe.html references no stylesheet — cannot verify a CSS bundle exists.`);
    console.error(hint);
    process.exit(1);
  }
  for (const href of cssHrefs) {
    const cssPath = join(dir, href.replace(/^\.\//, ''));
    if (!existsSync(cssPath)) {
      console.error(`${label} build at ${dir} is missing its referenced CSS bundle: ${cssPath} (from iframe.html href="${href}").`);
      console.error(hint);
      process.exit(1);
    }
    const size = statSync(cssPath).size;
    if (size === 0) {
      console.error(`${label} build's CSS bundle is present but empty: ${cssPath}.`);
      console.error(hint);
      process.exit(1);
    }
  }
}

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

/**
 * Fail-closed static server (closes F8): a real 404 for any unresolved path that looks like an
 * asset (has a file extension in its last path segment — `.css`, `.js`, `.png`, ...). The SPA
 * `index.html` fallback is reserved for extension-less navigation paths (Storybook manager's
 * client-side routes), which is the only case that legitimately needs it. A missing CSS/JS/font
 * asset therefore now 404s instead of silently serving the app shell with HTTP 200.
 */
function startStaticServer(staticDir, port, label, hardErrors) {
  return new Promise((res, rej) => {
    const server = createServer(async (req, resp) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);
      const lastSegment = urlPath.split('/').pop() ?? '';
      const looksLikeAsset = lastSegment.includes('.');
      try {
        const data = await readFile(filePath);
        resp.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        resp.end(data);
        return;
      } catch { /* fall through */ }
      if (!looksLikeAsset) {
        try {
          const data = await readFile(join(staticDir, 'index.html'));
          resp.writeHead(200, { 'Content-Type': 'text/html' });
          resp.end(data);
          return;
        } catch { /* fall through to 404 */ }
      }
      hardErrors.push({ phase: label, kind: '404', url: req.url });
      resp.writeHead(404);
      resp.end('Not found');
    });
    server.listen(port, '127.0.0.1', () => res(server));
    server.on('error', rej);
  });
}

/** Attaches requestfailed/non-2xx-response collectors scoped to this phase's own origin. */
function attachHardErrorCollectors(page, port, label, hardErrors) {
  const origin = `http://127.0.0.1:${port}`;
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(origin)) {
      hardErrors.push({ phase: label, kind: 'requestfailed', url: request.url(), detail: request.failure()?.errorText ?? 'unknown' });
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    if (url.startsWith(origin)) {
      const status = response.status();
      if (status < 200 || status >= 300) {
        hardErrors.push({ phase: label, kind: 'bad-status', url, status });
      }
    }
  });
}

// Matches Tailwind v4's compiled (minified, no internal whitespace) OR authored (spaced) form.
const SUPPORTS_COLOR_MIX_RE = /@supports\s*\(color:\s*color-mix\(in lab,\s*red,\s*red\)\)\s*\{/g;

/** Balanced-brace removal of every `@supports (color: color-mix(in lab, red, red)) { ... }` block. */
function stripSupportsColorMix(css) {
  let result = '';
  let cursor = 0;
  let removed = 0;
  SUPPORTS_COLOR_MIX_RE.lastIndex = 0;
  let m;
  while ((m = SUPPORTS_COLOR_MIX_RE.exec(css))) {
    if (m.index < cursor) continue;
    result += css.slice(cursor, m.index);
    let depth = 1;
    let k = m.index + m[0].length;
    while (k < css.length && depth > 0) {
      if (css[k] === '{') depth++;
      else if (css[k] === '}') depth--;
      k++;
    }
    removed++;
    cursor = k;
    SUPPORTS_COLOR_MIX_RE.lastIndex = k;
  }
  result += css.slice(cursor);
  return { css: result, removed };
}

/**
 * Under --supports-off, intercepts every CSS response on this page and strips the color-mix
 * `@supports` tier from it. `stripCounter` is a mutable { count } accumulated across all CSS
 * responses for this phase so the caller can assert the strip actually happened.
 */
async function maybeInterceptSupportsOff(page, stripCounter) {
  if (!SUPPORTS_OFF) return;
  await page.route('**/*.css', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const { css, removed } = stripSupportsColorMix(body);
    stripCounter.count += removed;
    await route.fulfill({ response, body: css });
  });
}

async function captureCell(page, storyId, locale, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`http://127.0.0.1:${page.__port}/iframe.html?id=${storyId}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' });
  try {
    await page.waitForFunction(() => document.querySelectorAll('[class*="overlayLabel"]').length >= 2, { timeout: 8000 });
  } catch {
    const n = await page.evaluate(() => document.querySelectorAll('[class*="overlayLabel"]').length);
    return { status: 'ERROR', error: `expected 2 overlayLabel elements, found ${n}` };
  }
  const result = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[class*="overlayLabel"]')];
    if (els.length < 2) return { error: `expected >=2 overlayLabel elements, found ${els.length}` };
    return els.slice(0, 2).map((el) => {
      const cs = getComputedStyle(el);
      return { backgroundColor: cs.backgroundColor, borderColor: cs.borderColor, className: el.className };
    });
  });
  if (result.error) return { status: 'ERROR', error: result.error };
  const [soldEl, rentedEl] = result;
  return { status: 'OK', sold: soldEl, rented: rentedEl };
}

async function main() {
  await requireBuild(BEFORE_STATIC, 'BEFORE', 'Rebuild it: git worktree add ../lero-al-741-before HEAD, copy in ListingCard.stories.tsx, npm run build-storybook there, copy storybook-static/ to docs/reviews/artifacts/2026-08-14-task741/before-storybook-static/, then git worktree remove.');
  await requireBuild(AFTER_STATIC, 'AFTER', 'Run "npm run build-storybook" in this worktree after the migration + ListingCard.stories.tsx extension.');

  const hardErrors = [];
  const beforeServer = await startStaticServer(BEFORE_STATIC, BEFORE_PORT, 'before', hardErrors);
  const afterServer = await startStaticServer(AFTER_STATIC, AFTER_PORT, 'after', hardErrors);
  const browser = await chromium.launch();
  const beforePage = await browser.newPage();
  const afterPage = await browser.newPage();
  beforePage.__port = BEFORE_PORT;
  afterPage.__port = AFTER_PORT;
  attachHardErrorCollectors(beforePage, BEFORE_PORT, 'before', hardErrors);
  attachHardErrorCollectors(afterPage, AFTER_PORT, 'after', hardErrors);

  const stripCounters = { before: { count: 0 }, after: { count: 0 } };
  await maybeInterceptSupportsOff(beforePage, stripCounters.before);
  await maybeInterceptSupportsOff(afterPage, stripCounters.after);

  const cells = [];
  let failCount = 0;
  let identityFailCount = 0;

  try {
    for (const viewport of VIEWPORTS) {
      for (const locale of LOCALES) {
        const cellPrefix = `${viewport.name}|${locale}`;
        const before = await captureCell(beforePage, STORY_ID, locale, viewport);
        const after = await captureCell(afterPage, STORY_ID, locale, viewport);

        if (before.status !== 'OK' || after.status !== 'OK') {
          cells.push({ cellKey: cellPrefix, status: 'ERROR', before, after });
          failCount++;
          continue;
        }

        // BEFORE-phase identity: BEFORE must still carry the raw Tailwind utility substrings
        // (real pre-migration ListingCard.tsx); AFTER must not (post-migration module class).
        const beforeHasRawSold = before.sold.className.includes('bg-status-info');
        const beforeHasRawRented = before.rented.className.includes('bg-status-rented');
        const afterHasRawSold = after.sold.className.includes('bg-status-info');
        const afterHasRawRented = after.rented.className.includes('bg-status-rented');
        const identityOk = beforeHasRawSold && beforeHasRawRented && !afterHasRawSold && !afterHasRawRented;
        if (!identityOk) {
          identityFailCount++;
          cells.push({
            cellKey: `${cellPrefix}|IDENTITY`,
            status: 'IDENTITY_FAIL',
            beforeHasRawSold, beforeHasRawRented, afterHasRawSold, afterHasRawRented,
          });
        }

        for (const status of ['sold', 'rented']) {
          for (const prop of ['backgroundColor', 'borderColor']) {
            const b = before[status][prop];
            const a = after[status][prop];
            const same = b === a;
            if (!same) failCount++;
            cells.push({ cellKey: `${cellPrefix}|${status}|${prop}`, status: same ? 'OK' : 'MOVED', before: b, after: a });
          }
          cells.push({
            cellKey: `${cellPrefix}|${status}|className`,
            status: 'INFO',
            before: before[status].className,
            after: after[status].className,
          });
        }
      }
    }
  } finally {
    await beforePage.close();
    await afterPage.close();
    await browser.close();
    beforeServer.close();
    afterServer.close();
  }

  let stripAssertionFailed = false;
  if (SUPPORTS_OFF) {
    if (stripCounters.before.count === 0 || stripCounters.after.count === 0) {
      stripAssertionFailed = true;
      console.error(`--supports-off strip assertion FAILED: before removed ${stripCounters.before.count} block(s), after removed ${stripCounters.after.count} block(s). Both must be > 0, or this mode silently degrades into a duplicate of the normal run.`);
    }
  }

  const summary = {
    supportsOff: SUPPORTS_OFF,
    ...(SUPPORTS_OFF ? { stripCounts: { before: stripCounters.before.count, after: stripCounters.after.count } } : {}),
    locales: LOCALES,
    viewports: VIEWPORTS.map((v) => v.name),
    totalCells: cells.length,
    failCount,
    identityFailCount,
    hardErrors,
    cells,
  };
  const outPath = join(__dirname, SUPPORTS_OFF ? 'comparator-result-supports-off.json' : 'comparator-result.json');
  await writeFile(outPath, JSON.stringify(summary, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(`Total cells: ${cells.length}, property failures: ${failCount}, identity failures: ${identityFailCount}, hard errors: ${hardErrors.length}`);
  if (hardErrors.length > 0) {
    console.error('COMPARATOR: FAIL (hard errors — asset/network fault, not a colour comparison):');
    for (const e of hardErrors) console.error(`  [${e.phase}] ${e.kind} ${e.url} ${e.detail ?? e.status ?? ''}`);
    process.exit(1);
  }
  if (stripAssertionFailed) {
    process.exit(1);
  }
  if (failCount > 0 || identityFailCount > 0) {
    console.error('COMPARATOR: FAIL');
    process.exit(1);
  }
  console.log('COMPARATOR: PASS, diffCount: 0');
}

main().catch((e) => { console.error(e); process.exit(1); });
