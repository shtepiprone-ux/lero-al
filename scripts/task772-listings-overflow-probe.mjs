#!/usr/bin/env node
/**
 * task772-listings-overflow-probe.mjs — Task 772 route-level mobile overflow evidence.
 *
 * Modelled on `scripts/task766-route-shell-probe.mjs` (per-label retained JSON evidence under
 * `docs/sessions/evidence/task<N>/`, `BASE_URL` env, `<nextjs-portal>` dev-server preflight
 * refusal) and `scripts/audit-listing-visibility.mjs` (service-role Supabase read for seed-data
 * facts the probe needs, e.g. real listing prices for the zero/one-result negative-flow cells).
 *
 * WHY THIS SCRIPT EXISTS: per `docs/maintenance-playbook.md` §14.3, no route-composition CI gate
 * exists or will be built. This task carries its own route evidence for `/listings`'s mobile
 * overflow defect — no existing command renders that real route at phone widths.
 *
 * It is EVIDENCE TOOLING, not a gate: no `package.json` script entry, nothing in CI depends on it.
 *
 * Usage:
 *   node scripts/task772-listings-overflow-probe.mjs <label>
 * <label> is 'before' or 'after'. Output is written per-label (never overwritten) to
 * docs/sessions/evidence/task772/overflow.<label>.json and auth-state.<label>.txt.
 *
 * Contract (kickoff §10, §13):
 *   - Reads BASE_URL from the environment, defaulting to http://127.0.0.1:3000.
 *   - Fails closed if a `<nextjs-portal>` element is present (a `next dev` server was used by
 *     mistake — this probe requires `next start` production evidence, exactly like task766).
 *   - Anonymous cells: 320/375/390 x sq/en/uk/it (mandatory), 768 x en and 1024 x en (Q2
 *     regression), 1440 x sq/en/uk/it (Q2 desktop-width all-locale requirement).
 *   - Longest-label cell: one cell per locale at 320 with `sort=price_desc` selected.
 *   - Negative-flow cells: total=0 and total=1 at 375 x en, reached by a `price_min` filter
 *     computed from the real seed data via a service-role Supabase read (never by emptying the
 *     data set — kickoff §5).
 *   - Interaction cell (AC3): 375 x en — opens the filters trigger, asserts the Mantine drawer
 *     content (`role="dialog"` / `.mantine-Drawer-content`) becomes visible, then opens the sort
 *     control and asserts `?sort=` updates on selection.
 *   - Authenticated cells: gated on `TASK772_AUTH_STORAGE_STATE` (kickoff §5/§5.0/R5a). If unset,
 *     missing, or the loaded session does not validate (the `SaveSearchButton` node, which is a
 *     `dynamic(..., { ssr: false })` import, does not attach within the wait window), the probe
 *     writes `AUTH_STATE_UNAVAILABLE` with the failing condition and skips the authenticated cells
 *     — it never substitutes the anonymous result for them. When the session validates, the probe
 *     re-runs the SAME 22 core cells (`buildCoreCells()`) in an authenticated context built from
 *     `storageState: TASK772_AUTH_STORAGE_STATE`, waits for `SaveSearchButton` to attach before
 *     measuring each cell, and records that button's own rect (page-wide selector
 *     `button:has(svg.lucide-bookmark)` — locale-independent, since lucide-react stamps a
 *     `lucide-<icon-name>` class on every icon regardless of the translated label) so a residual
 *     authenticated-only overflow can be attributed to it without re-running anything.
 *   - For every cell: `documentElement.scrollWidth`/`clientWidth`, the bounding boxes of the sort
 *     bar root (`.listings-sort-bar`), both of its groups, each interactive control, and (in the
 *     authenticated run) `SaveSearchButton`, plus the identity of the widest element overflowing
 *     the viewport (if any).
 *   - Fail-closed scope: the process exit code reflects EVERY branch — anonymous core cells,
 *     authenticated core cells, the interaction cell, and the negative-flow cells — not only
 *     `result.cells`. A documented `skipped` entry (e.g. no authenticated session available, no
 *     seed row can build the total=1 cell) is a recorded outcome, not a failure, and never flips
 *     the exit code on its own.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task772');
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const MOBILE_ISMOBILE_SETTLE_WAIT_MS = 500; // fixed post-load delay before interacting with MantineDrawer

const label = process.argv[2];
if (!label || !['before', 'after'].includes(label)) {
  console.error("Usage: node scripts/task772-listings-overflow-probe.mjs <before|after>");
  process.exit(2);
}

const LOCALES = ['sq', 'en', 'uk', 'it'];
const MOBILE_WIDTHS = [320, 375, 390];
const MOBILE_HEIGHT = 812;
const DESKTOP_HEIGHT = 900;
// lucide-react (createLucideIcon.mjs) stamps `lucide-<kebab-icon-name>` on every icon's <svg>
// regardless of the translated label, so this selector finds SaveSearchButton across all 4
// locales without a dedicated test id (SaveSearchButton.tsx is out of scope — kickoff §8).
const SAVE_SEARCH_BUTTON_SELECTOR = 'button:has(svg.lucide-bookmark)';

// ── Cell matrix ───────────────────────────────────────────────────────────
function buildCoreCells() {
  const cells = [];
  for (const width of MOBILE_WIDTHS) {
    for (const locale of LOCALES) {
      cells.push({ kind: 'mobile-default', width, height: MOBILE_HEIGHT, locale, query: '' });
    }
  }
  cells.push({ kind: 'desktop-regression', width: 768, height: DESKTOP_HEIGHT, locale: 'en', query: '' });
  cells.push({ kind: 'desktop-regression', width: 1024, height: DESKTOP_HEIGHT, locale: 'en', query: '' });
  for (const locale of LOCALES) {
    cells.push({ kind: 'desktop-regression', width: 1440, height: DESKTOP_HEIGHT, locale, query: '' });
  }
  for (const locale of LOCALES) {
    cells.push({ kind: 'longest-label', width: 320, height: MOBILE_HEIGHT, locale, query: '?sort=price_desc' });
  }
  return cells;
}

// ── In-page measurement ──────────────────────────────────────────────────
async function measureSortBar(page, saveSearchButtonSelector) {
  return page.evaluate((saveSearchSelector) => {
    function rectOf(sel) {
      const el = document.querySelector(sel);
      if (!el) return { selector: sel, found: false };
      const rect = el.getBoundingClientRect();
      return {
        selector: sel,
        found: true,
        rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left, right: rect.right },
      };
    }
    const root = document.documentElement;
    const sortBarRoot = document.querySelector('.listings-sort-bar');
    const groups = sortBarRoot ? sortBarRoot.querySelectorAll(':scope > div') : [];
    const countEl = sortBarRoot ? sortBarRoot.querySelector('span.font-semibold') : null;
    return {
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      overflow: root.scrollWidth > root.clientWidth + 2,
      overflowBy: root.scrollWidth - root.clientWidth,
      renderedCountText: countEl ? countEl.textContent : null,
      sortBarRoot: rectOf('.listings-sort-bar'),
      leftGroup: groups[0] ? rectOf('.listings-sort-bar > div:nth-of-type(1)') : null,
      rightGroup: groups[1] ? rectOf('.listings-sort-bar > div:nth-of-type(2)') : null,
      // Task 781 retarget: ListingsSortBar migrated off shadcn `Button`/legacy `Combobox` onto
      // Mantine — the mobile filters trigger and grid/list toggle now carry explicit
      // `data-testid` hooks (ListingsSortBar.tsx), and the sort trigger is a Mantine
      // `MantineCombobox` (a readOnly `<input>`, not a `<button>`), wrapped in its own
      // `data-testid="listings-sort-trigger"` Box.
      filtersButton: rectOf('.listings-sort-bar [data-testid="listings-mobile-filters-trigger"]'),
      sortComboboxTrigger: rectOf('.listings-sort-bar [data-testid="listings-sort-trigger"] input'),
      gridListToggle: rectOf('.listings-sort-bar [data-testid="listings-view-toggle"]'),
      saveSearchButton: saveSearchSelector ? rectOf(saveSearchSelector) : null,
      widestOverflow: (function () {
        const vw = document.documentElement.clientWidth;
        let widest = null;
        const all = document.querySelectorAll('body *');
        for (const el of all) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          if (r.right > vw + 2) {
            if (!widest || r.right > widest.right) {
              widest = {
                tag: el.tagName.toLowerCase(),
                className: typeof el.className === 'string' ? el.className : '',
                testId: el.getAttribute('data-testid') || null,
                right: r.right,
                width: r.width,
                overflowBy: r.right - vw,
              };
            }
          }
        }
        return widest;
      })(),
    };
  }, saveSearchButtonSelector ?? null);
}

async function gotoAndMeasure(browser, cell, authOptions = null) {
  const contextOptions = { viewport: { width: cell.width, height: cell.height } };
  if (authOptions?.storageStatePath) contextOptions.storageState = authOptions.storageStatePath;
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const result = { ...cell, authState: authOptions ? 'authenticated' : 'anonymous' };
  try {
    const url = `${BASE_URL}/${cell.locale}/listings${cell.query}`;
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    result.httpStatus = response ? response.status() : null;
    result.ok = response ? response.ok() : false;
    result.devServerDetected = await page.evaluate(() => !!document.querySelector('nextjs-portal'));
    result.sortBarFound = await page.evaluate(() => !!document.querySelector('.listings-sort-bar'));

    if (!result.ok || result.devServerDetected || !result.sortBarFound) {
      result.failReason = !result.ok
        ? `non-OK response status ${result.httpStatus}`
        : result.devServerDetected
          ? 'nextjs-portal present — next dev server detected, refusing to treat as production evidence'
          : '.listings-sort-bar not found on page';
    } else {
      if (authOptions?.waitForSaveSearchButton) {
        try {
          await page.locator(SAVE_SEARCH_BUTTON_SELECTOR).first().waitFor({ state: 'attached', timeout: 8000 });
          result.saveSearchButtonAttached = true;
        } catch {
          result.saveSearchButtonAttached = false;
        }
      }
      const measurement = await measureSortBar(page, authOptions?.waitForSaveSearchButton ? SAVE_SEARCH_BUTTON_SELECTOR : null);
      Object.assign(result, measurement);
    }
  } catch (err) {
    result.failReason = `navigation/evaluation error: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    await context.close();
  }
  return result;
}

// ── AC3 interaction cell ────────────────────────────────────────────────
async function interactionCell(browser) {
  const context = await browser.newContext({ viewport: { width: 375, height: MOBILE_HEIGHT } });
  const page = await context.newPage();
  const result = { kind: 'interaction', width: 375, locale: 'en' };
  try {
    const response = await page.goto(`${BASE_URL}/en/listings`, { waitUntil: 'networkidle', timeout: 30000 });
    result.ok = response ? response.ok() : false;
    await page.waitForTimeout(MOBILE_ISMOBILE_SETTLE_WAIT_MS);
    result.waitConditionUsed = `fixed ${MOBILE_ISMOBILE_SETTLE_WAIT_MS}ms post-load delay before interacting, to let MantineDrawer's isMobile useEffect settle`;

    // Open filters trigger, assert the Mantine drawer bottom-sheet form becomes visible.
    // Task 781 retarget: stable data-testid on the migrated Mantine trigger (ListingsSortBar.tsx).
    const filtersButton = page.locator('.listings-sort-bar [data-testid="listings-mobile-filters-trigger"]');
    await filtersButton.click();
    const drawerContent = page.locator('[role="dialog"].mantine-Drawer-content');
    try {
      await drawerContent.waitFor({ state: 'visible', timeout: 5000 });
      result.filtersDrawerOpened = true;
    } catch {
      result.filtersDrawerOpened = false;
    }
    // Close it (Escape) before continuing to the sort control.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Open sort control, select a different option, assert ?sort= updates.
    // Task 781 retarget, corrected Task 781R (this interaction cell runs at 375px — MOBILE — where
    // MantineCombobox opens its ResponsiveBottomSheet path, NOT the desktop Combobox.Dropdown):
    // the mobile sheet renders each option as an `UnstyledButton` (a plain <button>, no
    // `role="option"`), not a `Combobox.Option` (`<div role="option">`) — verified live via a
    // Playwright DOM dump against the real running route (MantineCombobox.tsx's `isMobile`
    // branch). A first pass of this retarget used the desktop-only `[role="option"][value=...]`
    // selector and it correctly matched zero nodes at this viewport — a real bug, not a probe
    // false-negative. `value={opt.value}` was added to the mobile UnstyledButton
    // (MantineCombobox.tsx) so both paths now carry the same `value` attribute; `button[value=…]`
    // (no role requirement) is the form that actually renders here.
    const sortTrigger = page.locator('.listings-sort-bar [data-testid="listings-sort-trigger"] input');
    await sortTrigger.click();
    const priceAscOption = page.locator('button[value="price_asc"]');
    await priceAscOption.waitFor({ state: 'visible', timeout: 5000 });
    await priceAscOption.click();
    await page.waitForURL(/[?&]sort=price_asc/, { timeout: 5000 });
    result.sortUrlUpdated = true;
    result.finalUrl = page.url();
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.finalUrl = page.url();
  } finally {
    await context.close();
  }
  return result;
}

// ── Negative-flow cells (total=0, total=1) ─────────────────────────────
// Reads real seed data via a service-role Supabase read so the zero/one-result cells are reached
// by applying a filter, never by emptying the data set (kickoff §5). `price_min` alone cannot
// isolate exactly one row when the seed listings tie on price (measured: both = 40000), so the
// one-result cell additionally discriminates on `property_type`, the first field found to differ
// between the two seed rows.
async function computeNegativeFlowFilters() {
  config({ path: '.env.local' });
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local' };
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data, error } = await supabase
    .from('listings')
    .select('price, property_type')
    .order('price', { ascending: false });
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: 'no listings in table' };
  const maxPrice = data[0].price;
  const zeroResultsQuery = `?price_min=${maxPrice + 1}`;

  const propertyTypeCounts = new Map();
  for (const row of data) {
    propertyTypeCounts.set(row.property_type, (propertyTypeCounts.get(row.property_type) ?? 0) + 1);
  }
  const uniqueType = [...propertyTypeCounts.entries()].find(([, count]) => count === 1);
  const oneResultQuery = uniqueType
    ? `?property_type=${encodeURIComponent(uniqueType[0])}`
    : null;

  return {
    totalListings: data.length,
    maxPrice,
    zeroResultsQuery,
    oneResultQuery,
    oneResultQueryError: uniqueType ? null : 'no seed row has a uniquely-occurring property_type — total=1 cell cannot be constructed from current seed data',
  };
}

async function negativeFlowCells(browser) {
  const filters = await computeNegativeFlowFilters();
  if (filters.error) {
    return [{ kind: 'negative-flow', skipped: true, reason: filters.error }];
  }
  const cells = [
    { kind: 'negative-flow-total-0', width: 375, height: MOBILE_HEIGHT, locale: 'en', query: filters.zeroResultsQuery },
  ];
  if (filters.oneResultQuery) {
    cells.push({ kind: 'negative-flow-total-1', width: 375, height: MOBILE_HEIGHT, locale: 'en', query: filters.oneResultQuery });
  }
  const results = [];
  for (const cell of cells) {
    const r = await gotoAndMeasure(browser, cell);
    r.seedDataFilters = filters;
    results.push(r);
  }
  if (!filters.oneResultQuery) {
    results.push({ kind: 'negative-flow-total-1', skipped: true, reason: filters.oneResultQueryError });
  }
  return results;
}

// ── Authenticated cells (gated on TASK772_AUTH_STORAGE_STATE) ─────────
async function validateAuthState(browser) {
  const storageStatePath = process.env.TASK772_AUTH_STORAGE_STATE;
  if (!storageStatePath) {
    return { status: 'AUTH_STATE_UNAVAILABLE', failingCondition: 'TASK772_AUTH_STORAGE_STATE is unset' };
  }
  const fs = await import('node:fs');
  if (!fs.existsSync(storageStatePath)) {
    return { status: 'AUTH_STATE_UNAVAILABLE', failingCondition: `TASK772_AUTH_STORAGE_STATE path does not exist: ${storageStatePath}` };
  }
  let context;
  try {
    context = await browser.newContext({ viewport: { width: 375, height: MOBILE_HEIGHT }, storageState: storageStatePath });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/en/listings`, { waitUntil: 'networkidle', timeout: 30000 });
    // SaveSearchButton is dynamic(..., { ssr: false }) — wait for it to attach before concluding invalid.
    const saveSearchButton = page.locator(SAVE_SEARCH_BUTTON_SELECTOR);
    try {
      await saveSearchButton.first().waitFor({ state: 'attached', timeout: 8000 });
      return { status: 'AUTH_STATE_VALID', storageStatePath };
    } catch {
      return { status: 'AUTH_STATE_UNAVAILABLE', failingCondition: 'session loaded but SaveSearchButton did not attach — session does not authenticate' };
    }
  } catch (err) {
    return { status: 'AUTH_STATE_UNAVAILABLE', failingCondition: `storage state load error: ${err instanceof Error ? err.message : String(err)}` };
  } finally {
    if (context) await context.close();
  }
}

// Re-runs the SAME 22 core cells (buildCoreCells()) in an authenticated context, waiting for
// SaveSearchButton to attach before each measurement and recording its rect so a residual
// authenticated-only overflow can be attributed to it directly from the JSON (kickoff §3.4/R5).
async function authenticatedCoreCells(browser, storageStatePath) {
  const results = [];
  for (const cell of buildCoreCells()) {
    results.push(await gotoAndMeasure(browser, cell, { storageStatePath, waitForSaveSearchButton: true }));
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  await mkdir(EVIDENCE_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const result = {
    label,
    baseUrl: BASE_URL,
    capturedAt: new Date().toISOString(),
    cells: [],
    interaction: null,
    negativeFlow: [],
    authCells: [],
  };

  for (const cell of buildCoreCells()) {
    result.cells.push(await gotoAndMeasure(browser, cell));
  }

  result.interaction = await interactionCell(browser);
  result.negativeFlow = await negativeFlowCells(browser);

  const authState = await validateAuthState(browser);
  result.authState = authState;

  if (authState.status === 'AUTH_STATE_VALID') {
    result.authCells = await authenticatedCoreCells(browser, authState.storageStatePath);
  }

  await browser.close();

  const outPath = join(EVIDENCE_DIR, `overflow.${label}.json`);
  await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);

  const authPath = join(EVIDENCE_DIR, `auth-state.${label}.txt`);
  await writeFile(
    authPath,
    `${authState.status}${authState.failingCondition ? `\nfailingCondition: ${authState.failingCondition}` : ''}\n`,
    'utf8'
  );
  console.log(`Wrote ${authPath}`);

  // ── Fail-closed scope covers every branch, not just result.cells ─────
  const anonFailedCells = result.cells.filter(c => c.failReason);
  const authFailedCells = result.authCells.filter(c => c.failReason);
  const negativeFlowFailedCells = result.negativeFlow.filter(c => !c.skipped && c.failReason);
  const interactionFailed = !result.interaction.ok
    || !!result.interaction.error
    || result.interaction.filtersDrawerOpened !== true
    || result.interaction.sortUrlUpdated !== true;

  const overflowingCells = result.cells.filter(c => c.overflow);
  const overflowingAuthCells = result.authCells.filter(c => c.overflow);
  console.log(`\nAnonymous cells measured: ${result.cells.length}`);
  console.log(`Anonymous cells overflowing: ${overflowingCells.length}`);
  console.log(`Anonymous cells failed (hard): ${anonFailedCells.length}`);
  console.log(`Auth state: ${authState.status}`);
  console.log(`Authenticated cells measured: ${result.authCells.length}`);
  if (result.authCells.length > 0) {
    console.log(`Authenticated cells overflowing: ${overflowingAuthCells.length}`);
    console.log(`Authenticated cells failed (hard): ${authFailedCells.length}`);
  }
  console.log(`Interaction cell: ${interactionFailed ? 'FAILED' : 'ok'}`);
  console.log(`Negative-flow cells failed (hard): ${negativeFlowFailedCells.length}`);
  if (overflowingCells.length > 0) {
    console.log('\nOverflowing anonymous cells:');
    for (const c of overflowingCells) {
      console.log(`  ${c.kind} ${c.width}x${c.locale}${c.query || ''}: scrollWidth=${c.scrollWidth} clientWidth=${c.clientWidth} widest=${JSON.stringify(c.widestOverflow)}`);
    }
  }
  if (overflowingAuthCells.length > 0) {
    console.log('\nOverflowing authenticated cells:');
    for (const c of overflowingAuthCells) {
      console.log(`  ${c.kind} ${c.width}x${c.locale}${c.query || ''}: scrollWidth=${c.scrollWidth} clientWidth=${c.clientWidth} widest=${JSON.stringify(c.widestOverflow)} saveSearchButton=${JSON.stringify(c.saveSearchButton)}`);
    }
  }

  const hardFail = anonFailedCells.length > 0
    || authFailedCells.length > 0
    || negativeFlowFailedCells.length > 0
    || interactionFailed;

  if (hardFail) {
    console.error('\n❌ task772-listings-overflow-probe: one or more cells/branches failed closed.');
    if (anonFailedCells.length > 0) console.error(`  anonymous core cells: ${anonFailedCells.length}`);
    if (authFailedCells.length > 0) console.error(`  authenticated core cells: ${authFailedCells.length}`);
    if (negativeFlowFailedCells.length > 0) console.error(`  negative-flow cells: ${negativeFlowFailedCells.length}`);
    if (interactionFailed) console.error(`  interaction cell: ${JSON.stringify(result.interaction)}`);
    process.exit(1);
  }
  console.log('\n✅ task772-listings-overflow-probe: all branches captured cleanly (overflow is data, not a hard failure — see JSON).');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
