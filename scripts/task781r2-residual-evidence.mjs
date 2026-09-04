#!/usr/bin/env node
/**
 * task781r2-residual-evidence.mjs — Task 781R2 §7 dedicated rendered-proof capture for F3 and F6.
 *
 * Reuses the exact shape proven end-to-end by `scripts/task784-d69-19-browser-evidence.mjs`
 * (kickoff §2.4, "reuse that shape; do not extend check-stories-rendered.mjs"): a static-file
 * server over `storybook-static` on an OS-assigned port, real headless Chromium via Playwright,
 * one named record + one screenshot per check, written to
 * `docs/sessions/evidence/task781/residual-evidence/`.
 *
 * F3 (R16/AC16) — proves the real production `SaveSearchButton` and `ListingsActionRow` render
 * (not a `saveSearchSlot={null}`/stub), and that `SaveSearchButton`'s own `Default`/`OpenModal`/
 * `Pending` states each reach their real DOM state. Every F3 check asserts on the real component's
 * own accessible name/placeholder (`messages/en.json` → `saved_search.*`), never on a stub's
 * absence alone.
 *
 * F6 (R17/AC17) — records the two Task 781/782 enumerated deltas as CURRENT-STATE measurements,
 * each with its rendered value and the theme.ts rule that produces it (read at runtime via the
 * same `readThemeValue` regex-scoping technique task784's script uses — never a literal copied
 * into this script). These are measurements, not gates: they carry no hardcoded "expected" value
 * and do not participate in `hardFail`.
 *
 * Usage: node scripts/task781r2-residual-evidence.mjs [--dir <storybook-static-dir>]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task781/residual-evidence');
const THEME_PATH = join(ROOT, 'src/design-system/mantine/theme.ts');
const MESSAGES_EN_PATH = join(ROOT, 'messages/en.json');

const args = process.argv.slice(2);
const dirFlagIdx = args.indexOf('--dir');
const storybookStaticDir = dirFlagIdx !== -1 && args[dirFlagIdx + 1]
  ? resolve(process.cwd(), args[dirFlagIdx + 1])
  : join(ROOT, 'storybook-static');

// ── Real production strings — read from the actual locale file, never re-typed here ───────────
const savedSearchMessages = JSON.parse(readFileSync(MESSAGES_EN_PATH, 'utf8')).saved_search;

// ── Read F6's source rules from the ACTUAL theme.ts source (never hardcoded here) ─────────────
const themeSrc = readFileSync(THEME_PATH, 'utf8');

function sliceBetween(startMarker, endMarker, label) {
  const startIdx = themeSrc.indexOf(startMarker);
  if (startIdx === -1) throw new Error(`task781r2-residual-evidence: could not find "${startMarker}" (${label})`);
  const endIdx = themeSrc.indexOf(endMarker, startIdx);
  if (endIdx === -1) throw new Error(`task781r2-residual-evidence: could not find "${endMarker}" after "${startMarker}" (${label})`);
  return themeSrc.slice(startIdx, endIdx);
}

function readValue(src, pattern, label) {
  const m = src.match(pattern);
  if (!m) throw new Error(`task781r2-residual-evidence: could not find ${label}`);
  return m[1];
}

// Scoped to the `Button: { … }` component block only (line ~500-578) — `minHeight: '2.75rem'`
// also appears, unrelated, inside TextInput/PasswordInput/Checkbox/etc. blocks below it.
const buttonBlock = sliceBetween('Button: {', 'TextInput: {', 'components.Button block');
const buttonRootMinHeightRem = readValue(buttonBlock, /minHeight:\s*'([\d.]+rem)'/, 'components.Button.styles.root.minHeight');

// Scoped to the `spacing: { … }` block only (line ~348-365) — `xl:` also appears, unrelated, in
// `breakpoints`/`fontSizes`/`headings.sizes` blocks elsewhere in the file.
const spacingBlock = sliceBetween('spacing: {', 'radius: {', 'theme.spacing block');
const spacingXlRem = readValue(spacingBlock, /xl:\s*'([\d.]+rem)'/, 'spacing.xl');

const remToPx = (remStr) => Math.round(parseFloat(remStr) * 16);
const EXPECTED = {
  buttonRootMinHeightPx: remToPx(buttonRootMinHeightRem),
  spacingXlPx: remToPx(spacingXlRem),
};

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

function startStaticServer(staticDir) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);
      try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(staticDir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolvePromise(server));
  });
}

async function gotoStory(page, baseUrl, storyId) {
  const url = `${baseUrl}/iframe.html?id=${storyId}&viewMode=story`;
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  const readiness = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') ?? document.querySelector('#root');
    if (!root) return { ok: false, reason: 'expected Storybook root is absent' };
    const rect = root.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0)) return { ok: false, reason: `root has zero rect (${rect.width}x${rect.height})` };
    return { ok: true };
  });
  return { ok: !!response?.ok() && readiness.ok, httpStatus: response ? response.status() : null, readiness };
}

// Polls a DOM predicate instead of a fixed sleep — matches the story-play-function-driven checks
// (OpenModal/Pending), whose `play` functions run asynchronously after story mount. `arg` is
// passed through to `page.evaluate(predicateFn, arg)` so the predicate can close over a real
// value (e.g. a locale-file placeholder string) without depending on Node-side closures, which
// Playwright's `page.evaluate` serialization does not carry into the browser context.
async function waitForPredicate(page, predicateFn, arg, { timeout = 4000, interval = 100 } = {}) {
  const deadline = Date.now() + timeout;
  let last;
  while (Date.now() < deadline) {
    last = await page.evaluate(predicateFn, arg);
    if (last) return last;
    await page.waitForTimeout(interval);
  }
  return last ?? false;
}

async function main() {
  await mkdir(EVIDENCE_DIR, { recursive: true });

  if (!existsSync(join(storybookStaticDir, 'index.json'))) {
    console.error(`❌ missing ${join(storybookStaticDir, 'index.json')} — run "npm run build-storybook" first.`);
    process.exit(1);
  }

  const server = await startStaticServer(storybookStaticDir);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });

  const results = { capturedAt: new Date().toISOString(), storybookStaticDir, expected: EXPECTED, checks: [], measurements: [] };
  let hardFail = false;

  const record = (name, data) => {
    results.checks.push({ name, ...data });
    if (data.pass === false) hardFail = true;
    console.log(`${data.pass === false ? '❌' : '✅'} ${name}: ${JSON.stringify(data)}`);
  };
  const measure = (name, data) => {
    results.measurements.push({ name, ...data });
    console.log(`📏 ${name}: ${JSON.stringify(data)}`);
  };

  try {
    // ── F3 — SaveSearchButton's own three states, real production component ──────────────────
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-savesearchbutton--default');
      if (!nav.ok) {
        record('f3-savesearchbutton-default', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const trigger = page.getByRole('button', { name: savedSearchMessages.save_action });
        const found = await trigger.count() > 0 && await trigger.first().isVisible();
        await page.screenshot({ path: join(EVIDENCE_DIR, 'f3-savesearchbutton-default.png'), fullPage: false });
        record('f3-savesearchbutton-default', { pass: found, triggerFound: found, note: 'real production SaveSearchButton trigger, asserted by its own accessible name' });
      }
      await context.close();
    }
    {
      // TextInput's `placeholder` is `buildAutoName()` (dynamic, filters-dependent — see
      // SaveSearchButton.tsx:108), NOT the static `name_placeholder` translation, so the open
      // state is asserted on the TextInput's own `label` text (an XPath text-contains lookup,
      // since Mantine's generated `<label for="…">` id is non-deterministic) instead.
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-savesearchbutton--open-modal');
      if (!nav.ok) {
        record('f3-savesearchbutton-openmodal', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const found = await waitForPredicate(page, (labelText) => {
          const el = document.evaluate(`//label[contains(text(),'${labelText}')]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          return !!el;
        }, savedSearchMessages.name_placeholder, { timeout: 4000 });
        await page.screenshot({ path: join(EVIDENCE_DIR, 'f3-savesearchbutton-openmodal.png'), fullPage: false });
        record('f3-savesearchbutton-openmodal', { pass: !!found, modalNameFieldLabelVisible: !!found, note: 'real MantineModal reached its open state via the story\'s own play function; asserted on the name TextInput\'s own label text' });
      }
      await context.close();
    }
    {
      // The real, unmocked `saveSavedSearch` server action rejects near-instantly in this static
      // harness (`.storybook/stubs/next-headers.ts` throws synchronously inside `resolveAuthUser`,
      // with no actual network call ever issued — confirmed via a request-log probe this session),
      // so `isPending` can already be back to `false` by the time an external poll following the
      // story's own play function gets a chance to check. A `MutationObserver`, installed via
      // `addInitScript` BEFORE the page's own JS runs (i.e. before the story mounts/plays), records
      // every occurrence of the Loader mounting or the Save button becoming disabled with its own
      // timestamp — this proves the transient state was genuinely reached, not merely inferred.
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await page.addInitScript((saveLabel) => {
        window.__task781r2PendingEvidence = { loaderSeen: false, disabledSeen: false, events: [] };
        const check = () => {
          const state = window.__task781r2PendingEvidence;
          const loader = document.querySelector('.mantine-Loader-root');
          if (loader && !state.loaderSeen) {
            state.loaderSeen = true;
            state.events.push({ tMs: performance.now(), type: 'loader-mounted' });
          }
          const saveButton = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === saveLabel);
          if (saveButton && saveButton.disabled && !state.disabledSeen) {
            state.disabledSeen = true;
            state.events.push({ tMs: performance.now(), type: 'save-button-disabled' });
          }
        };
        const attach = () => {
          if (document.body) {
            new MutationObserver(check).observe(document.body, { attributes: true, subtree: true, childList: true });
            check();
          } else {
            requestAnimationFrame(attach);
          }
        };
        attach();
      }, savedSearchMessages.save);
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-savesearchbutton--pending');
      if (!nav.ok) {
        record('f3-savesearchbutton-pending', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        await page.waitForTimeout(3000);
        const evidence = await page.evaluate(() => window.__task781r2PendingEvidence);
        const found = !!evidence?.loaderSeen && !!evidence?.disabledSeen;
        await page.screenshot({ path: join(EVIDENCE_DIR, 'f3-savesearchbutton-pending.png'), fullPage: false });
        record('f3-savesearchbutton-pending', { pass: found, loaderAndDisabledSaveObservedViaMutationObserver: found, events: evidence?.events ?? [], note: 'isPending flips synchronously when the transition starts (component doc comment); a MutationObserver installed before story mount recorded the Loader mount + disabled-Save-button timestamps, proving the transient state was reached even though it had already settled back by capture time' });
      }
      await context.close();
    }

    // ── F3 — ListingsActionRow renders the REAL SaveSearchButton (not a stub) ────────────────
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-listingsactionrow--default');
      if (!nav.ok) {
        record('f3-listingsactionrow-real-savesearch', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const trigger = page.getByRole('button', { name: savedSearchMessages.save_action });
        const found = await trigger.count() > 0 && await trigger.first().isVisible();
        await page.screenshot({ path: join(EVIDENCE_DIR, 'f3-listingsactionrow-real-savesearch.png'), fullPage: false });
        record('f3-listingsactionrow-real-savesearch', { pass: found, triggerFound: found, note: 'ListingsActionRow story composes the real SaveSearchButton via saveSearchSlot, not a stub — asserted by the real trigger\'s own accessible name inside the row' });
      }
      await context.close();
    }

    // ── F3 — ListingsShellView renders the REAL SaveSearchButton (not saveSearchSlot={null}) ──
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-listingsshellview--default');
      if (!nav.ok) {
        record('f3-listingsshellview-real-savesearch', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const trigger = page.getByRole('button', { name: savedSearchMessages.save_action });
        const found = await trigger.count() > 0 && await trigger.first().isVisible();
        await page.screenshot({ path: join(EVIDENCE_DIR, 'f3-listingsshellview-real-savesearch.png'), fullPage: false });
        record('f3-listingsshellview-real-savesearch', { pass: found, triggerFound: found, note: 'ListingsShellView.stories.tsx now passes saveSearchSlot={<SaveSearchButton />} (Task 782 F3), not null — asserted by the real trigger\'s own accessible name inside the full shell' });
      }
      await context.close();
    }

    // ── F6 — chip height, current-state measurement, source cited from theme.ts at runtime ───
    for (const width of [1280, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-activefilterchips--default');
      const name = `f6-chip-height-${width}`;
      if (!nav.ok) {
        measure(name, { failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const rect = await page.evaluate(() => {
          const chip = document.querySelector('.active-filter-chips .mantine-Button-root');
          if (!chip) return null;
          const r = chip.getBoundingClientRect();
          return { width: r.width, height: r.height };
        });
        if (width === 1280) await page.screenshot({ path: join(EVIDENCE_DIR, 'f6-chip-height-desktop.png'), fullPage: false });
        else await page.screenshot({ path: join(EVIDENCE_DIR, 'f6-chip-height-mobile.png'), fullPage: false });
        measure(name, {
          viewport: width,
          measuredHeightPx: rect ? Math.round(rect.height) : null,
          sourceRule: 'theme.ts components.Button.styles.root.minHeight',
          sourceValuePx: EXPECTED.buttonRootMinHeightPx,
          matchesSourceRule: !!rect && Math.round(rect.height) >= EXPECTED.buttonRootMinHeightPx,
        });
      }
      await context.close();
    }

    // ── F6 — empty-state vertical padding, current-state measurement, source cited ───────────
    for (const width of [1280, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-listingsshellview--empty');
      const name = `f6-empty-state-padding-${width}`;
      if (!nav.ok) {
        measure(name, { failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        const padding = await page.evaluate(() => {
          const center = document.querySelector('.mantine-Center-root');
          if (!center) return null;
          const cs = getComputedStyle(center);
          return { paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom };
        });
        if (width === 1280) await page.screenshot({ path: join(EVIDENCE_DIR, 'f6-empty-state-padding-desktop.png'), fullPage: true });
        else await page.screenshot({ path: join(EVIDENCE_DIR, 'f6-empty-state-padding-mobile.png'), fullPage: true });
        measure(name, {
          viewport: width,
          measuredPaddingTopPx: padding ? Math.round(parseFloat(padding.paddingTop)) : null,
          measuredPaddingBottomPx: padding ? Math.round(parseFloat(padding.paddingBottom)) : null,
          sourceRule: 'theme.ts spacing.xl (Center py="xl" in ListingsShellView.tsx)',
          sourceValuePx: EXPECTED.spacingXlPx,
          matchesSourceRule: !!padding
            && Math.round(parseFloat(padding.paddingTop)) === EXPECTED.spacingXlPx
            && Math.round(parseFloat(padding.paddingBottom)) === EXPECTED.spacingXlPx,
        });
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  const outPath = join(EVIDENCE_DIR, 'results.json');
  await writeFile(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nWrote ${outPath}`);

  if (hardFail) {
    console.error('\n❌ task781r2-residual-evidence: one or more F3 checks failed (see above).');
    process.exit(1);
  }
  console.log('\n✅ task781r2-residual-evidence: all F3 checks passed; F6 measurements recorded.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
