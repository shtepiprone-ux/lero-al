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
 */
import { writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');
const BEFORE_STATIC = 'C:/Claude_Code_Projects/lero-al-i0-d3ffd6/storybook-static';
const AFTER_STATIC = join(ROOT, 'storybook-static');
const BEFORE_PORT = 6501;
const AFTER_PORT = 6502;
const PLANT = process.argv.includes('--plant');

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
// className strings verified byte-identical to the real component's output via
// twmerge-class-resolution-all18.mjs (E6b/E7b priorityOver=true/predictiveOver=true; E12 rest+hover).
const PART_B_WITNESSES = [
  {
    key: 'perfDevOverlay-priorityRow-over',
    before: { className: 'text-destructive font-bold', prop: 'color' },
    after: { className: 'text-destructive font-bold', prop: 'color' }, // RR1 fix: module class conditionally OMITTED — identical class list both phases
  },
  {
    key: 'perfDevOverlay-predictiveRow-over',
    before: { className: 'text-destructive font-bold', prop: 'color' },
    after: { className: 'text-destructive font-bold', prop: 'color' },
  },
  {
    key: 'listingGallery-photoCountButton-rest',
    before: { className: 'text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 gap-1.5 bg-overlay/60 text-overlay-foreground text-sm px-3 py-1.5 rounded-full z-10 h-auto hover:bg-overlay/70', prop: 'color', requireHashed: null },
    after: { classNameTemplate: 'text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 {HASH} gap-1.5 text-sm px-3 py-1.5 rounded-full z-10 h-auto', prop: 'color', requireHashed: 'photoCountButton' },
    state: 'rest',
  },
  {
    key: 'listingGallery-photoCountButton-hover',
    before: { className: 'text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 gap-1.5 bg-overlay/60 text-overlay-foreground text-sm px-3 py-1.5 rounded-full z-10 h-auto hover:bg-overlay/70', prop: 'color', requireHashed: null },
    after: { classNameTemplate: 'text-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 {HASH} gap-1.5 text-sm px-3 py-1.5 rounded-full z-10 h-auto', prop: 'color', requireHashed: 'photoCountButton' },
    state: 'hover',
  },
];

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
    const html = `<!doctype html><html><head><style>${cssText}</style></head><body style="min-height:100vh">harness</body></html>`;
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

  const cs = await page.evaluate((prop) => {
    const el = [...document.querySelectorAll('button')].find(b => b.textContent === 'probe');
    if (!el) return { found: false };
    return { found: true, value: getComputedStyle(el)[prop] };
  }, side.prop);

  await page.evaluate(() => {
    const el = [...document.querySelectorAll('button')].find(b => b.textContent === 'probe');
    if (el) el.remove();
  });

  return { status: cs.found ? 'OK' : 'MISSING', value: cs.value, className: result.className };
}

async function main() {
  const beforeServer = await startStaticServer(BEFORE_STATIC, BEFORE_PORT);
  const afterServer = await startStaticServer(AFTER_STATIC, AFTER_PORT);
  const beforeCss = await buildHarnessCss('C:/Claude_Code_Projects/lero-al-i0-d3ffd6/.next/static/css');
  const afterCss = await buildHarnessCss(join(ROOT, '.next/static/css'));
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
            results.partB.push({ cellKey, status: 'MISSING', before, after });
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
  const outPath = join(__dirname, PLANT ? 'real-comparator-PLANTED.json' : 'real-comparator-result.json');
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
