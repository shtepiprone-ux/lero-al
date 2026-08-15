#!/usr/bin/env node
/**
 * Task 748 REWORK — RR3. Replaces the parent submission's synthetic-probe comparator
 * (`.screenshots/task748-overlay/capture-and-compare.mjs`), which only asked "does my new rule
 * produce the colour I meant?" and could not see F-A/F-B because it never looked at the tree as it
 * was before the change.
 *
 * TWO REAL PHASES:
 *   BEFORE = a clean I0 export of d3ffd6d6c51d9e968a47aabaaff46dcd69055a0f
 *            (`git archive d3ffd6d6c... | tar -x`, read-only — no worktree/branch mutation,
 *            node_modules reused via a directory junction since package-lock.json is byte-identical),
 *            `npm run build-storybook` run there natively.
 *   AFTER  = this worktree's own `storybook-static`, already required for the parent's AC9.
 *
 * PART A — the 3 real story-backed sites (photoCountBadge/extraCountOverlay in
 * MantineListingGalleryPattern, counter in LightboxView). Each site's REAL element is resolved
 * structurally in EACH phase's own DOM — BEFORE by its literal pre-migration Tailwind class(es),
 * AFTER by its post-migration CSS-Modules hashed class — and its OWN live `getComputedStyle()` is
 * captured on each side, then the two real captures are diffed directly. No synthetic probe
 * anywhere in Part A.
 *
 * PART B — the two REWORK witnesses named in RR3.4, neither of which has a canonical story
 * (`PerfDevOverlay` is dev-only/non-visual per the migration tracker; `ListingGallery` has none at
 * all — confirmed by the parent's own §3.6 correction). Per the kickoff's explicit allowance
 * ("a story, a harness page, or a forced-props probe — say which"): this script uses a **harness
 * page**, not a permanent Storybook story (§8 forbids that).
 *
 * First attempt used a Storybook page as the stylesheet host and failed for a real, structural
 * reason: Storybook's Vite build code-splits CSS per story, so a page that never imports
 * `ListingGallery.tsx` (nothing does — confirmed) never bundles `ListingGallery.module.css` either;
 * `hashed class not found` on the AFTER side was that bug, not a plant. Fixed by serving a minimal
 * static HTML harness whose stylesheet is `.next/static/css/*.css` **concatenated from each
 * phase's own real `npm run build`** — a full Next.js production build always includes every
 * Tailwind-scanned utility and every imported CSS Module project-wide, so this sidesteps
 * Storybook's per-chunk scoping entirely and is, if anything, a more direct "real compiled
 * stylesheet" than a Storybook bundle (it is literally what ships).
 *
 * The harness injects a synthetic element carrying the EXACT className string the real component
 * produces at that site/state in that phase — verified byte-identical against
 * `twmerge-class-resolution-all18.mjs`'s output, not invented — and reads its live computed style.
 * The DOM node is synthetic; the stylesheet, the class list, and the CSS engine resolving them are
 * 100% the real phase's own artifacts.
 *
 * Fail-closed: exits 1 on any moved property, missing/errored cell, or short phase.
 * `--plant` corrupts the AFTER-side (subject) measurement of one specific cell before comparison —
 * not the expectation — to prove the comparator reddens on a real subject defect.
 *
 * REWORK2 fixes (findings G3/G4/G5, all in this apparatus, none in src/):
 *   - RW3/G3: the two PerfDevOverlay Part B cells measured `rgb(0, 0, 0)` on both sides because
 *     `.text-destructive{color:var(--destructive)}` chains through `--brand-900` to
 *     `--mantine-color-brand-9`, which MantineProvider injects at runtime and which a static
 *     harness page never mounts — so the property was unresolved on both sides and the comparator
 *     scored that shared fallback as agreement. Fixed two ways: (a) the harness stylesheet now
 *     defines `--mantine-color-brand-9` itself, from `src/design-system/brand.ts`'s brand[9]
 *     (`#8E322B`) — the app is light-only (`MantineRootProvider.tsx` — `defaultColorScheme="light"`,
 *     no dark theme), so this is a static constant, not a placeholder; (b) independently of that,
 *     every Part B cell now also measures an unstyled control element in the same harness and fails
 *     closed if the probe's value doesn't differ from it, so an unresolved custom property can never
 *     again be scored as a match, on this or any future property. `--omit-mantine-vars` disables (a)
 *     to prove (b) reddens on its own (AC3's "deliberately absent" run).
 *   - RW4/G4: the Part B `ListingGallery` BEFORE strings are no longer a hand-typed fixture; they
 *     are computed by calling the real `cn()` (`twMerge(clsx(...))`, same as
 *     `twmerge-class-resolution-all18.mjs`'s E12 case) against the exact same source expressions,
 *     so tailwind-merge's own conflict resolution (which deletes `text-foreground`/`hover:bg-muted`
 *     here) runs for real instead of being asserted.
 *   - RW5/G5: see the path-resolution block below — no absolute machine-local path remains.
 */
import { writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');

// REWORK2/RW5 (finding G5). Round 1 hardcoded an absolute machine-local path
// (`C:/Claude_Code_Projects/lero-al-i0-d3ffd6/...`), so this script only ran on the one machine
// that happened to hold that export at that exact location — not reproducible from a fresh clone.
// Fixed: resolve the I0 export relative to the repo root (a sibling directory next to this
// worktree, overridable via LERO_I0_EXPORT_DIR for a differently-placed export), and fail with a
// clear, actionable message naming the revision to export if it is absent, instead of a bare ENOENT
// deep inside a static-file server. No absolute path remains in the script.
const I0_REVISION = 'd3ffd6d6c51d9e968a47aabaaff46dcd69055a0f';
const I0_EXPORT_DIR = process.env.LERO_I0_EXPORT_DIR
  ? resolve(process.env.LERO_I0_EXPORT_DIR)
  : resolve(ROOT, '..', 'lero-al-i0-d3ffd6');
const BEFORE_STATIC = join(I0_EXPORT_DIR, 'storybook-static');
const BEFORE_NEXT_CSS_DIR = join(I0_EXPORT_DIR, '.next', 'static', 'css');
const AFTER_STATIC = join(ROOT, 'storybook-static');
const AFTER_NEXT_CSS_DIR = join(ROOT, '.next', 'static', 'css');
const BEFORE_PORT = 6501;
const AFTER_PORT = 6502;
const PLANT = process.argv.includes('--plant');
const OMIT_MANTINE_VARS = process.argv.includes('--omit-mantine-vars');

function requireI0Export() {
  if (existsSync(BEFORE_STATIC) && existsSync(BEFORE_NEXT_CSS_DIR)) return;
  console.error(`I0 export not found at ${I0_EXPORT_DIR}`);
  console.error(`This comparator needs a clean, already-built export of revision ${I0_REVISION}`);
  console.error('(both storybook-static/ and .next/static/css/ populated), because BEFORE is the');
  console.error('pre-migration tree and this worktree cannot hold two builds of two revisions at');
  console.error('once. Create it with:');
  console.error(`  git archive ${I0_REVISION} | tar -x -C <target-dir>`);
  console.error('  cd <target-dir> && npm ci && npm run build-storybook && npm run build');
  console.error('...then either place it at a sibling directory named lero-al-i0-d3ffd6 next to');
  console.error('this repo root, or point LERO_I0_EXPORT_DIR at wherever you built it.');
  process.exit(1);
}

const LOCALES = ['sq', 'en', 'uk', 'it'];
const VIEWPORTS = [320, 375, 390, 480, 560, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560];

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

function startStaticServer(staticDir, port) {
  return new Promise((res, rej) => {
    const server = createServer(async (req, resp) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);
      try {
        const data = await readFile(filePath);
        resp.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        resp.end(data);
      } catch {
        try {
          const data = await readFile(join(staticDir, 'index.html'));
          resp.writeHead(200, { 'Content-Type': 'text/html' });
          resp.end(data);
        } catch { resp.writeHead(404); resp.end('Not found'); }
      }
    });
    server.listen(port, '127.0.0.1', () => res(server));
    server.on('error', rej);
  });
}

// ── PART A: real story-backed sites ─────────────────────────────────────────
const PART_A_SITES = [
  { key: 'photoCountBadge', storyId: 'patterns-mantine-listinggallerypattern--default', props: ['backgroundColor', 'color'] },
  { key: 'extraCountOverlay', storyId: 'patterns-mantine-listinggallerypattern--default', props: ['backgroundColor'] },
  { key: 'counter', storyId: 'mantine-primitives-lightboxview--default', props: ['color'] },
];

async function resolvePartAElementBefore(page, siteKey) {
  return page.evaluate((siteKey) => {
    if (siteKey === 'photoCountBadge') {
      const candidates = [...document.querySelectorAll('.bg-overlay\\/60')];
      return candidates.find(el => el.classList.contains('text-overlay-foreground')) ? 'found' : 'not-found';
    }
    if (siteKey === 'extraCountOverlay') {
      const candidates = [...document.querySelectorAll('.bg-overlay\\/60')];
      return candidates.find(el => !el.classList.contains('text-overlay-foreground')) ? 'found' : 'not-found';
    }
    if (siteKey === 'counter') {
      return document.querySelector('.text-overlay-foreground\\/80') ? 'found' : 'not-found';
    }
    return 'not-found';
  }, siteKey);
}

async function capturePartACell(beforePage, afterPage, site, locale, viewport) {
  await beforePage.setViewportSize({ width: viewport, height: 1200 });
  await afterPage.setViewportSize({ width: viewport, height: 1200 });
  await beforePage.goto(`http://127.0.0.1:${BEFORE_PORT}/iframe.html?id=${site.storyId}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' });
  await afterPage.goto(`http://127.0.0.1:${AFTER_PORT}/iframe.html?id=${site.storyId}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' });
  await beforePage.waitForSelector('body');
  await afterPage.waitForSelector('body');

  if (site.storyId.includes('lightboxview')) {
    await beforePage.locator('.mantine-Button-root').first().click();
    await afterPage.locator('.mantine-Button-root').first().click();
    await beforePage.waitForTimeout(350);
    await afterPage.waitForTimeout(350);
  } else {
    await beforePage.waitForTimeout(350);
    await afterPage.waitForTimeout(350);
  }

  const beforeVal = await beforePage.evaluate((siteKey) => {
    function cs(el, props) {
      if (!el) return { found: false };
      const c = getComputedStyle(el);
      const out = { found: true };
      for (const p of props) out[p] = c[p];
      return out;
    }
    let el = null;
    if (siteKey === 'photoCountBadge') el = [...document.querySelectorAll('.bg-overlay\\/60')].find(e => e.classList.contains('text-overlay-foreground'));
    else if (siteKey === 'extraCountOverlay') el = [...document.querySelectorAll('.bg-overlay\\/60')].find(e => !e.classList.contains('text-overlay-foreground'));
    else if (siteKey === 'counter') el = document.querySelector('.text-overlay-foreground\\/80');
    return { el: !!el, cs: cs(el, ['backgroundColor', 'color']) };
  }, site.key);

  const afterVal = await afterPage.evaluate(async (siteKey) => {
    const hrefs = [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href);
    const texts = await Promise.all(hrefs.map(h => fetch(h).then(r => r.text()).catch(() => '')));
    const cssText = texts.join('\n');
    function resolveHashed(name) {
      const re = new RegExp('([A-Za-z0-9_-]*_' + name + '_[a-z0-9]+_?\\d*)');
      const m = re.exec(cssText);
      return m ? m[1] : null;
    }
    function cs(el, props) {
      if (!el) return { found: false };
      const c = getComputedStyle(el);
      const out = { found: true };
      for (const p of props) out[p] = c[p];
      return out;
    }
    const name = siteKey;
    const hashed = resolveHashed(name);
    const el = hashed ? document.querySelector('.' + CSS.escape(hashed)) : null;
    return { el: !!el, hashed, cs: cs(el, ['backgroundColor', 'color']) };
  }, site.key);

  return { beforeVal, afterVal };
}

// ── PART B: witnesses (no story — harness page technique) ──────────────────
// REWORK2/RW4 (finding G4): these className strings are no longer a typed fixture ASSERTED as
// byte-identical to twmerge-class-resolution-all18.mjs's output — they ARE that output, computed
// right here with the exact same `cn()` = `twMerge(clsx(...))` against the exact same source
// expressions (E6b/E7b priorityOver=true/predictiveOver=true; E12 rest+hover). Round 1 hand-typed
// the ListingGallery BEFORE fixture verbatim from the source JSX; real tailwind-merge deletes
// `text-foreground` and `hover:bg-muted` from it (both lose to `.text-overlay-foreground`/
// `hover:bg-overlay/70` in the same conflict groups) — see
// docs/reviews/artifacts/2026-08-13-task748-round2/g4-fixture-vs-real-classlist.mjs. Computing it
// here instead of hand-typing it removes that gap.
const cn = (...a) => twMerge(clsx(a));
const MODULE_PLACEHOLDER = '__PHOTO_COUNT_MODULE_HASH__';
const GHOST = 'text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50';
const PHOTO_COUNT_BEFORE = cn(GHOST, 'gap-1.5 bg-overlay/60 text-overlay-foreground text-sm px-3 py-1.5 rounded-full z-10 h-auto hover:bg-overlay/70');
const PHOTO_COUNT_AFTER_TEMPLATE = cn(GHOST, `${MODULE_PLACEHOLDER} gap-1.5 text-sm px-3 py-1.5 rounded-full z-10 h-auto`).replace(MODULE_PLACEHOLDER, '{HASH}');
const PERF_OVER_BEFORE = cn('text-overlay-foreground/70', true && 'text-destructive font-bold');
const PERF_OVER_AFTER = cn(false, true && 'text-destructive font-bold'); // RR1: module class conditionally omitted when over budget

const PART_B_WITNESSES = [
  {
    key: 'perfDevOverlay-priorityRow-over',
    before: { className: PERF_OVER_BEFORE, prop: 'color' },
    after: { className: PERF_OVER_AFTER, prop: 'color' },
  },
  {
    key: 'perfDevOverlay-predictiveRow-over',
    before: { className: PERF_OVER_BEFORE, prop: 'color' },
    after: { className: PERF_OVER_AFTER, prop: 'color' },
  },
  {
    key: 'listingGallery-photoCountButton-rest',
    before: { className: PHOTO_COUNT_BEFORE, prop: 'color', requireHashed: null },
    after: { classNameTemplate: PHOTO_COUNT_AFTER_TEMPLATE, prop: 'color', requireHashed: 'photoCountButton' },
    state: 'rest',
  },
  {
    key: 'listingGallery-photoCountButton-hover',
    before: { className: PHOTO_COUNT_BEFORE, prop: 'color', requireHashed: null },
    after: { classNameTemplate: PHOTO_COUNT_AFTER_TEMPLATE, prop: 'color', requireHashed: 'photoCountButton' },
    state: 'hover',
  },
];

// REWORK2/RW3 (finding G3). Mantine generates `--mantine-color-brand-9` at runtime via
// `MantineProvider` and injects it client-side (src/design-system/mantine/MantineRootProvider.tsx:
// `<MantineProvider theme={theme} defaultColorScheme="light">`); a static harness page never mounts
// React, so `.text-destructive{color:var(--destructive)}` -> `--brand-900` ->
// `--mantine-color-brand-9` (globals.css:365,411) was unresolved on BOTH sides here, and the
// comparator scored that shared UA/inherited fallback (`rgb(0, 0, 0)`) as agreement — G3. The app is
// light-only (no dark theme, see MantineRootProvider.tsx), so the value is a static constant:
// src/design-system/brand.ts's `brand[9]` (`#8E322B`). Injected into both harness stylesheets below
// unless `--omit-mantine-vars` is passed (used to prove the independent fail-closed check further
// down still reddens without this injection — AC3's "deliberately absent" run).
const MANTINE_BRAND_9 = '#8E322B'; // src/design-system/brand.ts brand[9] — light-only theme, static
const MANTINE_RUNTIME_VARS_CSS = `:root{--mantine-color-brand-9:${MANTINE_BRAND_9};}`;

// Harness pages: a real Next.js production build ALWAYS bundles every Tailwind-scanned utility
// and every imported CSS Module project-wide (unlike Storybook's per-story Vite chunks, which only
// bundle a component's module CSS if some story actually imports that component — true of neither
// `PerfDevOverlay` nor `ListingGallery`). Each phase's own `.next/static/css/*.css` is concatenated
// once at startup and served as a single stylesheet for a minimal static harness page.
const HARNESS_PORT_BEFORE = 6511;
const HARNESS_PORT_AFTER = 6512;

async function buildHarnessCss(nextCssDir) {
  const { readdir } = await import('node:fs/promises');
  const files = (await readdir(nextCssDir)).filter(f => f.endsWith('.css'));
  const parts = await Promise.all(files.map(f => readFile(join(nextCssDir, f), 'utf8')));
  return parts.join('\n');
}

function startHarnessServer(cssText, port) {
  return new Promise((res, rej) => {
    // An empty <body> has zero height (no content, no explicit sizing), which fails Playwright's
    // "visible" actionability check (needs a non-empty bounding box) even though nothing is
    // display:none/visibility:hidden — the initial run's `waitForSelector('body')` timeouts were
    // this, not a plant or a stylesheet bug. Explicit min-height fixes it.
    const runtimeVars = OMIT_MANTINE_VARS ? '' : MANTINE_RUNTIME_VARS_CSS;
    const html = `<!doctype html><html><head><style>${runtimeVars}${cssText}</style></head><body style="min-height:100vh">harness</body></html>`;
    const server = createServer((req, resp) => {
      resp.writeHead(200, { 'Content-Type': 'text/html' });
      resp.end(html);
    });
    server.listen(port, '127.0.0.1', () => res(server));
    server.on('error', rej);
  });
}

async function capturePartBCell(page, spec, viewport, isBefore) {
  await page.setViewportSize({ width: viewport, height: 800 });
  await page.goto(`http://127.0.0.1:${isBefore ? HARNESS_PORT_BEFORE : HARNESS_PORT_AFTER}/`, { waitUntil: 'load' });

  const side = isBefore ? spec.before : spec.after;
  const result = await page.evaluate(({ side }) => {
    let className = side.className;
    if (side.classNameTemplate) {
      const cssText = [...document.styleSheets].map(s => {
        try { return [...s.cssRules].map(r => r.cssText).join('\n'); } catch { return ''; }
      }).join('\n');
      // Next.js's own webpack/Turbopack CSS Modules convention is `Component_local__hash`
      // (DOUBLE underscore before the hash) — different from Storybook/Vite's `_local_hash_n`
      // (single underscore) that the parent submission's resolver used. This harness reads
      // `.next/static/css` directly (not a Storybook bundle), so it must match the Next.js form.
      const re = new RegExp('([A-Za-z0-9]+_' + side.requireHashed + '__[A-Za-z0-9_]+)');
      const m = re.exec(cssText);
      if (!m) return { found: false, reason: 'hashed class not found' };
      className = side.classNameTemplate.replace('{HASH}', m[1]);
    }
    const el = document.createElement('button');
    el.type = 'button';
    el.className = className;
    el.textContent = 'probe';
    // On-screen (not off-screen) so a real Playwright pointer hover is actually deliverable —
    // an element at `top:-9999px` can never satisfy Playwright's "scrolled into view" actionability
    // check even with `force:true`, which is what produced the initial run's spurious ERRORs.
    el.style.position = 'fixed'; el.style.top = '4px'; el.style.left = '4px'; el.style.zIndex = '99999';
    document.body.appendChild(el);
    return { found: true, className };
  }, { side });

  if (!result.found) return { status: 'MISSING', result };

  if (spec.state === 'hover') {
    await page.locator('button:text("probe")').last().hover();
    await page.waitForTimeout(50);
  }

  // REWORK2/RW3 (finding G3): refuse to score an unresolved custom property as a match. Measure an
  // unstyled control button in this same harness alongside the probe; if the probe's value doesn't
  // differ from the control's, the property under test never actually resolved through the probe's
  // className — it fell back to whatever an element with NO relevant class also gets (UA default or
  // inherited initial value) — and the cell can neither confirm nor deny the real rule. This is
  // environment-agnostic (no hardcoded `rgb(0, 0, 0)`) and applies to every Part B cell, not only the
  // one this finding was filed against.
  const cs = await page.evaluate((prop) => {
    const el = [...document.querySelectorAll('button')].find(b => b.textContent === 'probe');
    if (!el) return { found: false };
    const control = document.createElement('button');
    control.type = 'button';
    control.style.position = 'fixed'; control.style.top = '-9999px'; control.style.left = '-9999px';
    document.body.appendChild(control);
    const value = getComputedStyle(el)[prop];
    const controlValue = getComputedStyle(control)[prop];
    control.remove();
    return { found: true, value, controlValue };
  }, side.prop);

  await page.evaluate(() => {
    const el = [...document.querySelectorAll('button')].find(b => b.textContent === 'probe');
    if (el) el.remove();
  });

  if (!cs.found) return { status: 'MISSING', className: result.className };
  if (cs.value === cs.controlValue) {
    return { status: 'UNRESOLVED', value: cs.value, controlValue: cs.controlValue, className: result.className };
  }
  return { status: 'OK', value: cs.value, className: result.className };
}

async function main() {
  requireI0Export();
  const beforeServer = await startStaticServer(BEFORE_STATIC, BEFORE_PORT);
  const afterServer = await startStaticServer(AFTER_STATIC, AFTER_PORT);
  const beforeCss = await buildHarnessCss(BEFORE_NEXT_CSS_DIR);
  const afterCss = await buildHarnessCss(AFTER_NEXT_CSS_DIR);
  const harnessServerBefore = await startHarnessServer(beforeCss, HARNESS_PORT_BEFORE);
  const harnessServerAfter = await startHarnessServer(afterCss, HARNESS_PORT_AFTER);
  const browser = await chromium.launch();
  const beforePage = await browser.newPage();
  const afterPage = await browser.newPage();
  const probePage = await browser.newPage();

  const results = { partA: [], partB: [] };
  let failCount = 0;

  try {
    // Part A
    for (const site of PART_A_SITES) {
      for (const locale of LOCALES) {
        for (const viewport of VIEWPORTS) {
          const cellKey = `${site.key}|${locale}|${viewport}`;
          try {
            const { beforeVal, afterVal } = await capturePartACell(beforePage, afterPage, site, locale, viewport);
            if (!beforeVal.el || !afterVal.el) {
              results.partA.push({ cellKey, status: 'MISSING_ELEMENT', beforeVal, afterVal });
              failCount++;
              continue;
            }
            const diffs = {};
            let moved = false;
            for (const prop of site.props) {
              let afterProp = afterVal.cs[prop];
              if (PLANT && cellKey === `${PART_A_SITES[0].key}|en|320`) afterProp = 'rgb(9, 9, 9)';
              const same = beforeVal.cs[prop] === afterProp;
              diffs[prop] = { before: beforeVal.cs[prop], after: afterProp, same };
              if (!same) moved = true;
            }
            if (moved) failCount++;
            results.partA.push({ cellKey, status: moved ? 'MOVED' : 'OK', diffs });
          } catch (e) {
            failCount++;
            results.partA.push({ cellKey, status: 'ERROR', error: String(e) });
          }
        }
      }
    }

    // Part B — 3 representative viewports for the mobile-scoped ListingGallery witness,
    // full 14-viewport matrix would be meaningless (Button is `md:hidden`, only relevant <768px)
    // but PerfDevOverlay is viewport-independent (fixed dev overlay) — captured once.
    const partBViewports = { 'perfDevOverlay-priorityRow-over': [1024], 'perfDevOverlay-predictiveRow-over': [1024], 'listingGallery-photoCountButton-rest': [320, 375, 480], 'listingGallery-photoCountButton-hover': [320, 375, 480] };
    for (const spec of PART_B_WITNESSES) {
      for (const viewport of partBViewports[spec.key]) {
        const cellKey = `${spec.key}|${viewport}`;
        try {
          const before = await capturePartBCell(beforePage, spec, viewport, true);
          let after = await capturePartBCell(afterPage, spec, viewport, false);
          if (PLANT && spec.key === 'listingGallery-photoCountButton-hover' && viewport === 320) {
            after = { ...after, value: 'rgb(9, 9, 9)' };
          }
          if (before.status !== 'OK' || after.status !== 'OK') {
            const status = (before.status === 'UNRESOLVED' || after.status === 'UNRESOLVED') ? 'UNRESOLVED' : 'MISSING';
            results.partB.push({ cellKey, status, before, after });
            failCount++;
            continue;
          }
          const same = before.value === after.value;
          if (!same) failCount++;
          results.partB.push({ cellKey, status: same ? 'OK' : 'MOVED', before: before.value, after: after.value, className: after.className });
        } catch (e) {
          failCount++;
          results.partB.push({ cellKey, status: 'ERROR', error: String(e) });
        }
      }
    }
  } finally {
    await beforePage.close();
    await afterPage.close();
    await probePage.close();
    await browser.close();
    beforeServer.close();
    afterServer.close();
    harnessServerBefore.close();
    harnessServerAfter.close();
  }

  const totalCells = results.partA.length + results.partB.length;
  const summary = { plant: PLANT, totalCells, failCount, partA: results.partA, partB: results.partB };
  // Round-3 review, finding H1 (fix applied by the reviewer, 2026-08-13): `--omit-mantine-vars`
  // previously fell through to the clean artifact's filename and overwrote it, which is what
  // produced the omit transcript that says `Wrote ...real-comparator-result.json`. Each mode now
  // writes its own file. This changes only the output filename — no measurement, no cell, no
  // comparison — so the three result JSONs, all written before this edit, remain valid for the
  // runs they record.
  const outName = PLANT
    ? 'real-comparator-PLANTED.json'
    : OMIT_MANTINE_VARS
      ? 'real-comparator-OMIT-MANTINE-VARS.json'
      : 'real-comparator-result.json';
  const outPath = join(__dirname, outName);
  await writeFile(outPath, JSON.stringify(summary, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(`Part A cells: ${results.partA.length}, Part B cells: ${results.partB.length}, total failures: ${failCount}`);
  if (failCount > 0) {
    console.error('COMPARATOR: FAIL');
    process.exit(1);
  }
  console.log('COMPARATOR: PASS, diffCount: 0');
}

main().catch(e => { console.error(e); process.exit(1); });
