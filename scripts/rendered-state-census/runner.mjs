/**
 * runner.mjs — opens every registered interaction state and measures the app root and each portal root
 * separately (Task 923, R3–R5). The page-level measuring code lives in `in-page.mjs`; this module drives the
 * browser (open, wait, focus, dismiss) and shapes the evidence rows.
 *
 * A "context" describes where the pages come from, so the SAME code serves the built Storybook and the
 * self-test fixtures:  { baseUrl, mode: 'storybook' | 'fixture', urlFor(target), height }.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { withinRoot } from '../lib/within-repository.mjs';
import { installCensus } from './in-page.mjs';
import { appliesAtWidth, rangeEdges } from './registry.mjs';

export const RULE_KEYS = [
  'text-clamp', 'text-ellipsis', 'text-hidden', 'word-split', 'text-overlap', 'svg-text-clipped', 'viewport-overflow', 'component-overflow',
  'action-hidden', 'action-covered', 'target-small',
  'focus-open', 'focus-trigger', 'focus-trap',
  'dismiss-escape', 'dismiss-close-control', 'dismiss-outside',
  'open-failed', 'portal-count', 'error-screen', 'unregistered-portal', 'widths-mismatch',
];

// Task 923 Revision 7 (owner 2026-10-17: a chart overlapped at ~1040px, a width the matrix never measured): the contract matrix (320, 390, 639, 640, 1440)
// plus the two theme breakpoints between 640 and 1440 that the project switches layouts at (md 768, lg 1024) on both sides of lg (1023, 1024)
export const DEFAULT_WIDTHS = [320, 390, 639, 640, 768, 1023, 1024, 1440];
export const DEFAULT_LOCALES = ['sq', 'en', 'uk', 'it'];
export const CLOSED_WIDTH = 390;
export const CLOSED_LOCALE = 'en';
export const HEIGHT = 844;

export const DEFAULT_CLOSE_SELECTOR = '.mantine-Modal-close, .mantine-Drawer-close, .mantine-CloseButton-root, [data-census-close]';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** the longest a self-test request may be answered late */
const MAX_CENSUS_DELAY_MS = 30000;
/** R32 (d): the read errors that mean "no such file" (a 404); every other error is a 503 that names its code. */
const NOT_FOUND_CODES = new Set(['ENOENT', 'ENOTDIR', 'EISDIR']);
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

/**
 * Serves a directory read-only; an unknown path is a 404 (no SPA fallback: a missing file must fail loudly). For the self-test
 * (R31) a request URL that carries `__census_delay=<n>` is answered `n` ms late; the file named by the path is still the one
 * served, so a fixture can fetch a page of its own origin that arrives late.
 */
export function startStaticServer(dir, port) {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const [rawPath, query = ''] = (req.url ?? '/').split('?');
        const params = new URLSearchParams(query);
        // R32 (d), self-test only: a URL that carries `__census_status=<n>` (500..599) is answered `n`, no file read
        const forced = Number(params.get('__census_status'));
        if (Number.isInteger(forced) && forced >= 500 && forced <= 599) {
          res.writeHead(forced, { 'x-census-error': 'CENSUS_STATUS' });
          res.end('Census forced status');
          return;
        }
        let urlPath = decodeURIComponent(rawPath);
        if (urlPath === '/') urlPath = '/index.html';
        // the decoded path is resolved to a real path and must stay inside the served directory (Task 951 AC8, CodeQL js/path-injection); outside is a 404
        let file;
        try {
          file = withinRoot(dir, urlPath.replace(/^\/+/, ''));
        } catch {
          throw Object.assign(new Error('outside root'), { code: 'ENOENT' });
        }
        const data = await readFile(file);
        const delay = Number(params.get('__census_delay'));
        // the wait is bounded by an explicit upper limit before it is used (Task 951, CodeQL js/resource-exhaustion)
        if (Number.isFinite(delay) && delay > 0) await sleep(delay <= MAX_CENSUS_DELAY_MS ? delay : MAX_CENSUS_DELAY_MS);
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
        res.end(data);
      } catch (e) {
        // R32 (d): 404 only when the path is outside the root or the file does not exist; any other error (a busy file, a
        // permission error) is a 503 that names its code, so a read failure is never mistaken for a missing file
        const code = e?.code ?? 'UNKNOWN';
        if (NOT_FOUND_CODES.has(code)) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          // the error's text is never written into the response (Task 951, CodeQL js/xss-through-exception): only a plain upper-case code name, in a header
          const plainCode = /^[A-Z][A-Z0-9_]{0,31}$/.test(String(code)) ? String(code) : 'UNKNOWN';
          res.writeHead(503, { 'x-census-error': plainCode });
          res.end('Census server error');
        }
      }
    });
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

export function storybookContext(baseUrl) {
  return {
    baseUrl, mode: 'storybook', height: HEIGHT,
    urlFor: ({ story, locale }) => `${baseUrl}/iframe.html?id=${story}&viewMode=story&globals=locale:${locale}`,
  };
}

export function fixtureContext(baseUrl) {
  return { baseUrl, mode: 'fixture', height: HEIGHT, urlFor: ({ story }) => `${baseUrl}/${story}.html` };
}

export function blankRules() {
  return Object.fromEntries(RULE_KEYS.map((k) => [k, []]));
}

/**
 * Every row carries every rule key, `notApplicable` (why a rule was not measured on this row), `skippedActions` (R30: how many
 * controls the action rules skipped under R24), `dismissMs` (R28: dismissal mechanism -> measured close time, `null` when the
 * overlay never closed; `{}` where none ran) and `settle` (R31: the settle before the measurement).
 */
function makeRow(target, root, rules = blankRules()) {
  const { story, state, locale, width } = target;
  return { story, state, root, locale, width, rules, notApplicable: {}, skippedActions: 0, exemptedControls: 0, exemptedOverflow: 0, exemptedText: 0, dismissMs: {}, settle: { ms: 0, bounded: false }, pass: false };
}

/**
 * R13: a check that does not apply is evidence, not silence. `notApplicable` maps a rule key to the reason it was not
 * measured in this row; several reasons for one rule are joined.
 */
function markNotApplicable(row, rule, reason) {
  row.notApplicable[rule] = row.notApplicable[rule] ? `${row.notApplicable[rule]}; ${reason}` : reason;
}

/**
 * R24 / R30: the action rules skip a control that is clipped away, hidden from assistive technology and out of the tab order (a
 * carousel's off-screen slide). The skip is evidence, not silence: the row records how many controls were not measured in its own
 * `skippedActions`. `notApplicable` keeps only the reasons why a rule was not measured on the row, so a rule that still has
 * violations on the row is never also "not applicable".
 */
function markSkippedActions(row, skipped, exempted, exemptedOverflow, exemptedText) {
  row.skippedActions += skipped ?? 0;
  row.exemptedText += exemptedText ?? 0; // Task 923 R136 (owner D84): text a row's `exemptText` excuses from `text-ellipsis`, counted, never silent
  row.exemptedOverflow += exemptedOverflow ?? 0; // Task 923 R33 (owner D10): boxes a row's `exemptOverflow` excuses from `component-overflow`, counted, never silent
  row.exemptedControls += exempted ?? 0; // Task 923 R33 (owner D9): controls a row's `exemptTargets` excuses from `target-small`, counted, never silent
}

function finish(row) {
  row.pass = RULE_KEYS.every((k) => row.rules[k].length === 0);
  return row;
}

/**
 * R31 (c): the requests a page has in flight, counted on the Node side from its `request`, `requestfinished` and `requestfailed`
 * events. A main-frame navigation drops the set (the old document's requests are over), so a stale entry can never hold a
 * later page back. A tracker is attached on first use, so a page that was not made by `newMeasuringPage` works too.
 */
const trackers = new WeakMap();
/** R32 (a): the resource types whose failure is a load failure. `fetch` / `xhr` are deliberately absent (107 `/api/*` fetches answer 404 on every load, C171). */
const LOADED_RESOURCE_TYPES = new Set(['document', 'script', 'stylesheet']);
function trackerFor(page) {
  let t = trackers.get(page);
  if (!t) {
    t = { inflight: new Set(), failures: [], epoch: 0, last: { ms: 0, bounded: false } };
    // R33 (i), Story 059: every request is stamped with the document (main-frame navigation) it was issued in. The navigation that
    // leaves a document aborts the requests the document still had in flight (a lazy chunk), and Chromium reports those aborts AFTER
    // the new navigation's request: they are the old document's, never the new page's (r8-62 / r8-63 probes).
    const issued = new WeakMap();
    const isStale = (r) => issued.get(r) !== t.epoch;
    page.on('request', (r) => {
      // a new main-frame navigation starts a new document: the old document's failures are no longer this page's
      if (r.isNavigationRequest() && r.frame() === page.mainFrame()) { t.epoch++; t.failures.length = 0; }
      issued.set(r, t.epoch);
      t.inflight.add(r);
    });
    page.on('requestfinished', (r) => t.inflight.delete(r));
    // One failure per request: Chromium reports a stylesheet answered 503 as a `response` (status 503) AND as a `requestfailed`
    // (net::ERR_ABORTED, r8-31 probe). The HTTP status names the cause, so it wins over the abort.
    page.on('requestfailed', (r) => {
      t.inflight.delete(r);
      if (LOADED_RESOURCE_TYPES.has(r.resourceType()) && !isStale(r) && !t.failures.some((f) => f.request === r)) {
        t.failures.push({ request: r, type: r.resourceType(), url: r.url(), errorText: r.failure()?.errorText ?? 'failed' });
      }
    });
    // R32 (a): an HTTP answer of 400 or more is a `requestfinished` for Playwright, so it is read from `response`
    page.on('response', (res) => {
      const r = res.request();
      if (res.status() >= 400 && LOADED_RESOURCE_TYPES.has(r.resourceType()) && !isStale(r)) {
        const entry = { request: r, type: r.resourceType(), url: r.url(), status: res.status(), code: res.headers()['x-census-error'] };
        const i = t.failures.findIndex((f) => f.request === r);
        if (i >= 0) t.failures[i] = entry;
        else t.failures.push(entry);
      }
    });
    page.on('framenavigated', (f) => { if (f === page.mainFrame()) t.inflight.clear(); });
    trackers.set(page, t);
  }
  return t;
}

/**
 * R32 (b): the reason of the first same-origin document, script or stylesheet that failed since the last main-frame navigation,
 * or null. `resource failed: <type> <pathname+query> (status <n>[, <code>])` for an HTTP answer of 400 or more,
 * `resource failed: <type> <pathname+query> (<errorText>)` for a request that failed, followed by `, +<k> more` when there are more.
 * A request to another origin is not the page's own and is never recorded here.
 */
export function resourceFailure(page) {
  const tracker = trackerFor(page);
  let origin;
  try { origin = new URL(page.url()).origin; } catch { return null; }
  const own = [];
  for (const f of tracker.failures) {
    try { if (new URL(f.url).origin === origin) own.push(f); } catch { /* a URL that does not parse is not the page's own */ }
  }
  if (own.length === 0) return null;
  const f = own[0];
  const u = new URL(f.url);
  const what = f.status !== undefined ? `status ${f.status}${f.code ? `, ${f.code}` : ''}` : f.errorText;
  return `resource failed: ${f.type} ${u.pathname}${u.search} (${what})${own.length > 1 ? `, +${own.length - 1} more` : ''}`;
}

/** The requests to the page's own origin that are in flight; a request to another origin (map tiles) is not counted. */
function sameOriginInflight(page, tracker) {
  let origin;
  try { origin = new URL(page.url()).origin; } catch { return 0; }
  let n = 0;
  for (const r of tracker.inflight) {
    try { if (new URL(r.url()).origin === origin) n++; } catch { /* a URL that does not parse is not the page's own */ }
  }
  return n;
}

/** A page ready for measuring: the census library installed before any page script runs, the request counter attached. */
export async function newMeasuringPage(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: HEIGHT }, deviceScaleFactor: 1 });
  await page.addInitScript(installCensus);
  trackerFor(page);
  return page;
}

/** R31: how the last `waitStable` of this page ended - `{ ms, bounded }`; `bounded` = the bound was hit, the page was measured as it is. */
export function lastSettle(page) {
  return { ...trackerFor(page).last };
}

export async function loadStory(page, ctx, target) {
  return loadTarget(page, ctx, target);
}

async function loadTarget(page, ctx, target) {
  trackerFor(page); // R32: the failures of this navigation are recorded from its first request, whatever made the page
  await page.setViewportSize({ width: target.width, height: ctx.height });
  try {
    await page.goto(ctx.urlFor(target), { waitUntil: 'load', timeout: 30000 });
    if (ctx.mode === 'storybook') {
      const phase = await page.waitForFunction(
        (id) => {
          const r = window.__STORYBOOK_PREVIEW__?.currentRender;
          return r && r.id === id && (r.phase === 'finished' || r.phase === 'errored') ? r.phase : false;
        },
        target.story,
        { timeout: 20000 },
      ).then((h) => h.jsonValue()).catch(() => 'timeout');
      if (phase === 'timeout') return { ok: false, reason: 'render did not reach finished/errored within 20s' };
      const err = await page.evaluate(() => document.body.classList.contains('sb-show-errordisplay'));
      if (phase === 'errored' || err) return { ok: false, reason: `render ${phase}, sb-show-errordisplay=${err}` };
    }
    await page.evaluate(() => document.fonts?.ready);
    // R32 (b): a same-origin document, script or stylesheet that failed is a load failure - never a page to measure
    const failed = resourceFailure(page);
    if (failed) return { ok: false, reason: failed };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: `navigation failed: ${String(e.message ?? e).split('\n')[0].slice(0, 160)}` };
  }
}

export const SETTLE_BOUND_MS = 8000;
export const SETTLE_POLL_MS = 100;
export const DISMISS_BOUND_MS = 5000;

/**
 * R31: the one settle function. The page is settled when, on 3 consecutive polls 100ms apart, all of these hold:
 *   (a) the visible portal count is unchanged (and equals `expected` where one is given);
 *   (b) no finite animation runs (R26 (a): an infinite one, a loader, never settles and is not counted);
 *   (c) no request from the page to the page's own origin is in flight (a lazy chunk, a fetch);
 *   (d) the layout signature is unchanged: the number of non-empty boxes and a sum over their rounded boxes in the app root and
 *       every visible portal root, an element that runs an infinite animation and everything inside it left out. This sees
 *       what neither the animation API nor the network sees (a block that grows frame by frame from script).
 * Returns the portal count. The bound is 8 000ms; at the bound the page is measured as it is and `lastSettle(page)` says so.
 */
export async function waitStable(page, expected, timeout = SETTLE_BOUND_MS) {
  const tracker = trackerFor(page);
  const t0 = Date.now();
  let last = null;
  let count = -1;
  let same = 0;
  let bounded = true;
  while (Date.now() - t0 < timeout) {
    const s = await page.evaluate(() => ({
      n: window.__census.portals().length,
      running: window.__census.runningAnimations(),
      sig: window.__census.layoutSignature(),
    }));
    const inflight = sameOriginInflight(page, tracker);
    same = last && s.n === last.n && s.sig === last.sig && s.running === 0 && inflight === 0 ? same + 1 : 0;
    last = s;
    count = s.n;
    if (same >= 3 && (expected == null || s.n === expected)) { bounded = false; break; }
    await sleep(SETTLE_POLL_MS);
  }
  tracker.last = { ms: Date.now() - t0, bounded };
  return count;
}

export async function openAction(page, state) {
  const open = state.open;
  if (open.kind === 'mount') return { ok: true };
  // a joined selector may also match a copy that this width hides (a table row's twin card): only a visible one opens
  const loc = page.locator('#storybook-root').locator(open.selector).filter({ visible: true }).first();
  try {
    if (open.kind === 'click') await loc.click({ timeout: 4000 });
    else {
      await loc.focus({ timeout: 4000 });
      for (const key of open.keys) await page.keyboard.press(key);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: `open ${open.kind} "${open.selector}": ${String(e.message ?? e).split('\n')[0].slice(0, 140)}` };
  }
}

async function loadAndOpen(page, ctx, state, locale, width) {
  const target = { story: state.story, state: state.id, locale, width };
  const loaded = await loadTarget(page, ctx, target);
  if (!loaded.ok) return { stage: 'load', reason: loaded.reason };
  await waitStable(page, null); // R31: what the page loads late has arrived before anything is opened
  const opened = await openAction(page, state);
  if (!opened.ok) {
    // R32 (b): a resource that failed explains an open that did not work: it is a load failure, not an open failure
    const failed = resourceFailure(page);
    if (failed) return { stage: 'load', reason: failed };
    return { stage: 'open', reason: opened.reason, settle: lastSettle(page) };
  }
  const count = await waitStable(page, state.portals);
  const settle = lastSettle(page);
  // R32 (b): a chunk the open action loaded may have failed after the load check
  const failed = resourceFailure(page);
  if (failed) return { stage: 'load', reason: failed };
  return { stage: 'ok', count, settle };
}

async function visiblePortalCount(page) {
  return page.evaluate(() => window.__census.portals().length);
}

/**
 * Checks one dismissal mechanism. `alive` = the state is still open on the page (the first mechanism reuses the
 * measured page); otherwise the state is reopened in place (a click / keys state) or reloaded (a mount state).
 * Returns { details, reopened } - `reopened: false` means the page still holds an open overlay.
 */
export async function dismissCheck(page, ctx, state, locale, width, mechanism, alive) {
  const rule = `dismiss-${mechanism}`;
  if (!alive) {
    let ok = false;
    if (state.open.kind !== 'mount' && (await visiblePortalCount(page)) === 0) {
      const o = await openAction(page, state);
      ok = o.ok && (await waitStable(page, state.portals)) > 0;
    }
    if (!ok) {
      const reopened = await loadAndOpen(page, ctx, state, locale, width);
      if (reopened.stage !== 'ok') return { details: [`${rule}: could not reopen the state (${reopened.reason})`], closed: false };
    }
  }
  if ((await visiblePortalCount(page)) === 0) return { details: [`${rule}: no portal is open, nothing to dismiss`], closed: true };
  const closeSel = state.closeSelector ?? DEFAULT_CLOSE_SELECTOR;
  const fl = await page.evaluate((sel) => window.__census.flavor(sel), closeSel);

  let actedAt = 0; // R28: taken just before the dismissal event, so a measured close time never undercounts
  if (mechanism === 'escape') {
    actedAt = Date.now();
    await page.keyboard.press('Escape');
  } else if (mechanism === 'close-control') {
    // A bottom sheet renders no close button of its own (Mantine Drawer `withCloseButton={false}`): where Mantine
    // renders none the mechanism does not exist. Where the registry declares one on a non-sheet, it must be there.
    if (!fl.hasClose) {
      if (fl.sheet) return { details: [], closed: false, na: { [rule]: 'a bottom sheet renders no close control of its own (Mantine Drawer withCloseButton=false)' } };
      return { details: [`${rule}: close control "${closeSel}" matches nothing visible in the portal`], closed: false };
    }
    const loc = page.locator('[data-portal="true"]').locator(closeSel).filter({ visible: true }).first();
    try {
      actedAt = Date.now();
      await loc.click({ timeout: 3000 });
    } catch (e) {
      const why = String(e.message ?? e).split('\n')[0].slice(0, 100);
      return { details: [`${rule}: close control "${closeSel}" cannot be clicked (${why})`], closed: false };
    }
  } else {
    const point = await page.evaluate((trigger) => {
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const inside = '[role=dialog], [role=listbox], [role=menu], .mantine-Modal-content, .mantine-Drawer-content, .mantine-Popover-dropdown, .mantine-Combobox-dropdown, .mantine-Menu-dropdown, .mantine-Tooltip-tooltip, .mantine-Select-dropdown';
      const interactive = 'button, a, input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
      let coveredByOverlay = 0;
      for (const [x, y] of [[2, 2], [vw - 3, vh - 3], [vw - 3, 2], [2, vh - 3]]) {
        const hit = document.elementFromPoint(x, y);
        if (hit && hit.closest(inside)) coveredByOverlay++;
        if (!hit || hit.closest(inside) || hit.closest(interactive) || (trigger && hit.closest(trigger))) continue;
        return { x, y };
      }
      return { none: true, fullBleed: coveredByOverlay === 4 };
    }, state.trigger ?? null);
    // a full-bleed overlay (the nav drawer below 640px covers every corner) has no outside to click
    if (point.none && point.fullBleed) return { details: [], closed: false, na: { [rule]: 'a full-bleed overlay covers every corner of the viewport: there is no outside to click' } };
    if (point.none) return { details: [`${rule}: no point outside the overlay, its trigger and every control to click`], closed: false };
    actedAt = Date.now();
    await page.mouse.click(point.x, point.y);
  }

  // R28: a dismissal is judged on whether the overlay closes, not how fast. The visible portal count is polled every 50ms until
  // it is 0, bounded at 5 000ms (the bound only tells "closes" from "never closes"); the measured close time is evidence.
  const t0 = Date.now();
  let closedMs = null;
  while (Date.now() - t0 < DISMISS_BOUND_MS) {
    if ((await visiblePortalCount(page)) === 0) { closedMs = Date.now() - actedAt; break; }
    await sleep(50);
  }
  if (closedMs === null) return { details: [`${rule}: the portal is still visible ${DISMISS_BOUND_MS}ms after the dismissal`], closed: false, ms: null };

  const triggerState = state.trigger ? await page.evaluate((t) => window.__census.focusState(t).triggerFocusable, state.trigger) : false;
  const returnsFocus = fl.modal || state.focus === 'trap' || state.focus === 'inside';
  const naFocus = returnsFocus && state.trigger && !triggerState
    ? { 'focus-trigger': 'focus return to the trigger is not checked: the clicked element cannot take focus (Mantine returns focus to what held it)' }
    : undefined;
  if (returnsFocus && state.trigger && triggerState) {
    // R26 (b): the focus return is judged once the focus has settled (poll 50ms, same element 3 times, bound 1 000ms)
    const f = await page.evaluate((t) => window.__census.settleFocus(t), state.trigger);
    if (!f.onTrigger) {
      return { details: [`${rule}: focus did not return to "${state.trigger}" (it is on ${f.active})`], closed: true, ms: closedMs };
    }
  }
  return { details: [], closed: true, na: naFocus, ms: closedMs };
}

/**
 * One registry state at one locale x width: opens it, measures the app root and every portal root as separate
 * targets, then runs the focus and dismiss checks. Returns the evidence rows.
 */
export async function runStateJob(page, ctx, state, locale, width, { dismiss = true } = {}) {
  const target = { story: state.story, state: state.id, locale, width };
  const app = makeRow(target, 'app');
  const first = await loadAndOpen(page, ctx, state, locale, width);
  if (first.stage === 'load') {
    app.rules['error-screen'].push(first.reason);
    return [finish(app)];
  }
  app.settle = first.settle; // R31: the settle immediately before the measurement, shared by every row of the job
  if (first.stage === 'open') app.rules['open-failed'].push(first.reason);
  const count = first.stage === 'open' ? await visiblePortalCount(page) : first.count;
  if (count !== state.portals) app.rules['portal-count'].push(`declared ${state.portals} portal root(s), found ${count}`);

  const appInert = first.stage === 'ok' && count > 0 && (await page.evaluate(() => window.__census.flavor('x').modal));
  const measureApp = await page.evaluate(([inert, exempt, exemptOverflow, exemptText]) => window.__census.measure({ kind: 'app', index: 0, appInert: inert, exempt, exemptOverflow, exemptText }), [appInert, state.exemptTargets ?? null, state.exemptOverflow ?? null, state.exemptText ?? null]);
  if (measureApp.missing) app.rules['error-screen'].push('the app root #storybook-root is missing');
  if (appInert) {
    for (const rule of ['action-hidden', 'action-covered', 'target-small']) {
      markNotApplicable(app, rule, 'app-root actions are not measured: a modal overlay is open and the app behind it is inert');
    }
  }
  Object.assign(app.rules, Object.fromEntries(Object.entries(measureApp.rules)));
  markSkippedActions(app, measureApp.skippedActions, measureApp.exemptedControls, measureApp.exemptedOverflow, measureApp.exemptedText);
  const rows = [app];

  for (let i = 0; i < count; i++) {
    const row = makeRow(target, `portal:${i}`);
    row.settle = first.settle;
    const m = await page.evaluate(([index, exempt, exemptOverflow, exemptText]) => window.__census.measure({ kind: 'portal', index, exempt, exemptOverflow, exemptText }), [i, state.exemptTargets ?? null, state.exemptOverflow ?? null, state.exemptText ?? null]);
    Object.assign(row.rules, m.rules);
    markSkippedActions(row, m.skippedActions, m.exemptedControls, m.exemptedOverflow, m.exemptedText);
    rows.push(row);
  }
  const carrier = rows[1] ?? app; // focus and dismiss belong to the overlay; with no portal they stay on the app row

  if (first.stage === 'ok' && count > 0) {
    // The registry declares the wide (>= 640px) presentation. Below 640 a Select / Combobox / Menu / Modal is the
    // canonical bottom sheet (a Mantine Drawer): a modal presentation traps the focus whatever the state declared.
    const fl = await page.evaluate((sel) => window.__census.flavor(sel), state.closeSelector ?? DEFAULT_CLOSE_SELECTOR);
    const mode = fl.modal ? 'trap' : state.focus;
    const f0 = await page.evaluate((t) => window.__census.settleFocus(t), state.trigger ?? null); // R26 (b): the settled focus
    if (fl.modal && state.focus === 'trigger') {
      markNotApplicable(carrier, 'focus-trigger', 'the declared focus mode "trigger" is overridden: this presentation is a modal dialog or sheet, measured as "trap"');
    }
    if ((mode === 'trap' || mode === 'inside') && f0.portalIndex < 0) {
      carrier.rules['focus-open'].push(`on open the focus is on ${f0.active}, outside every portal root`);
    }
    if (mode === 'trigger' && !state.trigger) {
      markNotApplicable(carrier, 'focus-trigger', 'the state is opened on mount and has no trigger to hold the focus');
    } else if (mode === 'trigger' && !f0.triggerFocusable) {
      markNotApplicable(carrier, 'focus-trigger', 'the trigger cannot take focus (a clicked non-focusable element)');
    }
    if (mode === 'trigger' && state.trigger && f0.triggerFocusable && !f0.onTrigger) {
      carrier.rules['focus-trigger'].push(`the focus is on ${f0.active}, not on the trigger "${state.trigger}"`);
    }
    if (mode === 'trap') {
      const n = await page.evaluate(() => window.__census.tabbableCount());
      for (const key of ['Tab', 'Shift+Tab']) {
        for (let i = 0; i < n + 1; i++) {
          await page.keyboard.press(key);
          const f = await page.evaluate(() => window.__census.settleFocus(null)); // R26 (b): after each press, the settled focus
          if (f.portalIndex < 0) {
            carrier.rules['focus-trap'].push(`${key} press ${i + 1} of ${n + 1} moved the focus out to ${f.active}`);
            break;
          }
        }
      }
    }
    if (dismiss) {
      let alive = (await visiblePortalCount(page)) > 0;
      for (const mechanism of state.dismiss) {
        const r = await dismissCheck(page, ctx, state, locale, width, mechanism, alive);
        carrier.rules[`dismiss-${mechanism}`].push(...r.details);
        if ('ms' in r) carrier.dismissMs[mechanism] = r.ms; // R28: only a mechanism that ran; null = the overlay never closed
        for (const [rule, reason] of Object.entries(r.na ?? {})) markNotApplicable(carrier, rule, reason);
        alive = r.na?.[`dismiss-${mechanism}`] ? alive : false; // a failed dismissal leaves a stale page: the next mechanism reopens
      }
    }
  }
  return rows.map(finish);
}

/** The closed sweep of one Story: a portal that is visible with no `mount` registry row is unregistered. */
export async function runClosedJob(page, ctx, story, hasMountRow) {
  const target = { story, state: 'closed', locale: CLOSED_LOCALE, width: CLOSED_WIDTH };
  const row = makeRow(target, 'app');
  const loaded = await loadTarget(page, ctx, target);
  if (!loaded.ok) {
    row.rules['error-screen'].push(loaded.reason);
    return [finish(row)];
  }
  const count = await waitStable(page, null);
  row.settle = lastSettle(page);
  if (count > 0 && !hasMountRow) {
    row.rules['unregistered-portal'].push(`${count} portal root(s) are visible on mount and the registry has no "mount" row for this Story`);
  }
  return [finish(row)];
}

/**
 * R12: a `widths` state outside its range. At a width the registry says the state does not exist, the trigger must
 * not exist either: a visible app-root element with the trigger's role and accessible name that opens a portal there
 * is `widths-mismatch` (the range is wrong, or another row must cover that width). The role and name are captured at
 * an in-range width of the SAME state. `siblings` = the other rows of the same Story: an element that IS the trigger of
 * a sibling row in range at this width is that row's business, not a contradiction (recorded as not applicable, with the
 * row's id). A sibling whose trigger is a different element never excuses it.
 */
export async function runRangeJob(page, ctx, state, locale, width, { inRangeWidth, siblings = [] }) {
  const target = { story: state.story, state: state.id, locale, width };
  const row = makeRow(target, 'app');
  const bound = JSON.stringify(state.widths);
  const inRangeSiblings = siblings.filter((o) => o.id !== state.id && appliesAtWidth(o, width));
  let identity = null;
  if (state.open.kind !== 'mount') {
    const captured = await loadTarget(page, ctx, { ...target, width: inRangeWidth });
    if (!captured.ok) { row.rules['error-screen'].push(captured.reason); return [finish(row)]; }
    const trigger = page.locator('#storybook-root').locator(state.open.selector).filter({ visible: true }).first();
    try {
      identity = await trigger.evaluate((el) => window.__census.identityOf(el), null, { timeout: 4000 });
    } catch {
      row.rules['widths-mismatch'].push(`the trigger "${state.open.selector}" is not visible at its own in-range width ${inRangeWidth}px (widths ${bound})`);
      return [finish(row)];
    }
  }
  const loaded = await loadTarget(page, ctx, target);
  if (!loaded.ok) { row.rules['error-screen'].push(loaded.reason); return [finish(row)]; }

  if (!identity) {
    const covering = inRangeSiblings.find((o) => o.open.kind === 'mount');
    if (covering) {
      markNotApplicable(row, 'widths-mismatch', `width ${width} is covered by the mount row "${covering.id}" of the same Story`);
      return [finish(row)];
    }
    const n = await waitStable(page, null);
    row.settle = lastSettle(page);
    if (n > 0) row.rules['widths-mismatch'].push(`${n} portal root(s) are visible on mount at ${width}px, outside widths ${bound}`);
    return [finish(row)];
  }
  const found = await page.evaluate(([role, name]) => window.__census.findByIdentity(role, name), [identity.role, identity.name]);
  const siblingTriggers = inRangeSiblings.filter((o) => o.open.kind !== 'mount');
  const cover = found.length && siblingTriggers.length
    ? await page.evaluate(([paths, selectors]) => window.__census.coverage(paths, selectors), [found, siblingTriggers.map((o) => o.open.selector)])
    : found.map((p) => ({ path: p, rows: [] }));
  const matches = [];
  for (let i = 0; i < found.length; i++) {
    const own = cover[i].rows.find((x) => x.relation === 'self');
    if (own) markNotApplicable(row, 'widths-mismatch', `the element "${identity.name}" at ${width}px is the trigger of the row "${siblingTriggers[own.row].id}" of the same Story`);
    else matches.push(found[i]);
  }
  for (let i = 0; i < matches.length; i++) {
    if (i > 0) {
      const again = await loadTarget(page, ctx, target);
      if (!again.ok) break;
    }
    const loc = page.locator('#storybook-root').locator(':scope > ' + matches[i]);
    try {
      if (state.open.kind === 'click') await loc.click({ timeout: 3000 });
      else {
        await loc.focus({ timeout: 3000 });
        for (const key of state.open.keys) await page.keyboard.press(key);
      }
    } catch { continue; } // an element that cannot be operated at this width opens nothing
    const n = await waitStable(page, null);
    row.settle = lastSettle(page);
    if (n > 0) {
      row.rules['widths-mismatch'].push(`${identity.role} "${identity.name}" opens ${n} portal root(s) at ${width}px, outside widths ${bound} (captured at ${inRangeWidth}px)`);
      break;
    }
  }
  return [finish(row)];
}

/**
 * R16: the first failure of a job that is transient by nature - its page failed to load with a navigation error
 * (`net::ERR_*`, `navigation failed`), its render did not reach `finished` / `errored` in time (R20: the reason
 * `loadTarget` gives, a load flake under many workers) or its open action timed out - or null. A violation of a measured
 * rule is never transient, and neither is a Story whose render ENDED `errored` or shows the Storybook error display.
 */
export const RENDER_TIMEOUT = /^render did not reach finished\/errored within \d+s/;
/** R32 (c): a same-origin document, script or stylesheet that failed (the reason `resourceFailure` gives) is a transient load failure too. */
export const RESOURCE_FAILED = /^resource failed: /;
const isTransientLoad = (d) => /(?:^navigation failed|net::ERR_)/.test(d) || RENDER_TIMEOUT.test(d) || RESOURCE_FAILED.test(d);
/**
 * Task 923 R52 / R33 (i): a dismissal check reopens the state (`could not reopen the state (<reason>)`, written under the `dismiss-*` rule it was measuring). A reopen is an open: when its
 * reason is a transient load failure (a render timeout under load, a navigation error, a failed resource) the job is retried too, with that inner reason as the first failure. Found in the
 * final full run: one isolated run of `listingdetailview--public-listing` reported `dismiss-outside: could not reopen the state (render did not reach finished/errored within 20s)`
 * where the other runs were green.
 */
const REOPEN_FAILED = /could not reopen the state \((.*)\)$/;
export function transientReason(rows) {
  for (const r of rows) {
    for (const d of r.rules['error-screen']) if (isTransientLoad(d)) return d;
    for (const d of r.rules['open-failed']) if (/Timeout \d+ms exceeded|TimeoutError/.test(d)) return d;
    for (const [rule, details] of Object.entries(r.rules)) { // R33 (i) R52 reopen: a transient load failure of the reopen of a dismissal check
      if (!/^dismiss-/.test(rule)) continue;
      for (const d of details) {
        const m = REOPEN_FAILED.exec(d);
        if (m && isTransientLoad(m[1])) return m[1];
      }
    }
  }
  return null;
}

/**
 * R16 / R29: runs a job once; when its load or open stage failed transiently, runs it ONCE more on a fresh page. A job is
 * retried only for a load or open failure, never because a measured rule failed. The retried job's rows are the second
 * attempt's rows ONLY: the first attempt never reached the state (its open failed, so its app root was measured on the
 * closed, non-inert page), and nothing of it - no rule, no root - is carried into the result. Every row of the retried job
 * carries `retry: "<first failure>"` (rows of a job that was not retried carry no `retry` key). A second failure is the
 * violation as before.
 * `freshPage(old)` closes `old` and returns a new measuring page. Returns `{ rows, page }` (the page to keep using).
 */
export async function runWithRetry(run, page, freshPage) {
  const first = await run(page);
  const why = transientReason(first);
  if (!why) return { rows: first, page };
  const next = await freshPage(page);
  const second = await run(next);
  for (const row of second) {
    row.retry = why;
    finish(row);
  }
  return { rows: second, page: next };
}

/** Runs async job functions on a pool of measuring pages; `onRows` receives each job's rows as it ends. */
export async function runPool(browser, jobs, concurrency, onRows) {
  let next = 0;
  const freshPage = async (old) => {
    await old.close().catch(() => {});
    return newMeasuringPage(browser);
  };
  async function worker() {
    let page = await newMeasuringPage(browser);
    while (next < jobs.length) {
      const job = jobs[next++];
      let rows;
      try {
        ({ rows, page } = await runWithRetry(job.run, page, freshPage));
      } catch (e) {
        const row = makeRow(job.target, 'app');
        row.rules['error-screen'].push(`the job crashed: ${String(e.message ?? e).split('\n')[0].slice(0, 160)}`);
        rows = [finish(row)];
        await page.close().catch(() => {});
        page = await newMeasuringPage(browser); // a crashed page is replaced, the run continues
      }
      onRows(rows);
    }
    await page.close().catch(() => {});
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
}

export function summarize(rows, meta, states = []) {
  const perRule = Object.fromEntries(RULE_KEYS.map((k) => [k, 0]));
  const notApplicable = {};
  const perCombo = new Map();
  const byId = new Map(states.map((s) => [s.id, s]));
  const cells = new Map();
  let failing = 0;
  for (const r of rows) {
    if (!r.pass) failing++;
    for (const k of RULE_KEYS) if (r.rules[k].length) perRule[k]++;
    for (const k of Object.keys(r.notApplicable ?? {})) notApplicable[k] = (notApplicable[k] ?? 0) + 1;
    if (!r.pass) {
      const key = `${r.story} | ${r.state} | ${r.root}`;
      const e = perCombo.get(key) ?? { rules: new Set(), cells: 0 };
      for (const k of RULE_KEYS) if (r.rules[k].length) e.rules.add(k);
      e.cells++;
      perCombo.set(key, e);
    }
    // the cell's carrier row (the overlay's first portal root) decides whether a pointer can dismiss it
    if (r.root === 'portal:0') cells.set(`${r.story}|${r.state}|${r.locale}|${r.width}`, r);
  }
  // R13: Story x state x width where neither the close control nor an outside click can dismiss the overlay
  const noPointer = new Map();
  for (const r of cells.values()) {
    const state = byId.get(r.state);
    if (!state) continue;
    const pointer = state.dismiss.some((m) => (m === 'close-control' || m === 'outside') && !r.notApplicable?.[`dismiss-${m}`]);
    if (!pointer) {
      const key = `${r.story} | ${r.state} | ${r.width}`;
      noPointer.set(key, (noPointer.get(key) ?? 0) + 1);
    }
  }
  const combos = [...perCombo.entries()].map(([key, e]) => ({ key, rules: [...e.rules], cells: e.cells }));
  // R12: every `widths` state, with the evidence rows found at its in-range bound(s) and at the first width outside
  const appRowCount = new Map();
  for (const r of rows) if (r.root === 'app') appRowCount.set(`${r.state}|${r.width}`, (appRowCount.get(`${r.state}|${r.width}`) ?? 0) + 1);
  const widthsStates = states.filter((st) => st.widths).map((st) => {
    const e = rangeEdges(st);
    return {
      id: st.id, widths: st.widths,
      inRange: e.inRange.map((w) => ({ width: w, rows: appRowCount.get(`${st.id}|${w}`) ?? 0 })),
      outside: e.outside.map((w) => ({ width: w, rows: appRowCount.get(`${st.id}|${w}`) ?? 0 })),
    };
  });
  // R16: every Story x state x locale x width that was run a second time, with the first failure and the outcome
  const retried = new Map();
  for (const r of rows) {
    if (!r.retry) continue;
    const key = `${r.story} | ${r.state} | ${r.locale} | ${r.width}`;
    const e = retried.get(key) ?? { cell: key, firstFailure: r.retry, recovered: true };
    if (r.rules['open-failed'].length || r.rules['error-screen'].length) e.recovered = false;
    retried.set(key, e);
  }
  // R31: every job whose settle hit the bound (the page was measured as it was), by Story x state
  const boundedJobs = new Map();
  let skippedRows = 0;
  let skippedControls = 0;
  let exemptedRows = 0;
  let exemptedControls = 0;
  let overflowRows = 0;
  let overflowBoxes = 0;
  let textRows = 0;
  let textElements = 0;
  for (const r of rows) {
    if (r.exemptedOverflow) { overflowRows++; overflowBoxes += r.exemptedOverflow; }
    if (r.exemptedText) { textRows++; textElements += r.exemptedText; }
    if (r.skippedActions) { skippedRows++; skippedControls += r.skippedActions; }
    if (r.exemptedControls) { exemptedRows++; exemptedControls += r.exemptedControls; }
    if (!r.settle?.bounded || r.root !== 'app') continue; // one app row per job: counts the job once
    const key = `${r.story} | ${r.state}`;
    const e = boundedJobs.get(key) ?? { key, cells: [] };
    e.cells.push(`${r.locale} ${r.width}`);
    boundedJobs.set(key, e);
  }
  const settleBounded = [...boundedJobs.values()].sort((a, b) => a.key.localeCompare(b.key));
  return {
    meta, rows: rows.length, failing, perRule, notApplicable, skippedActions: { rows: skippedRows, controls: skippedControls }, exemptedControls: { rows: exemptedRows, controls: exemptedControls }, exemptedOverflow: { rows: overflowRows, boxes: overflowBoxes }, exemptedText: { rows: textRows, elements: textElements },
    noPointerDismissal: [...noPointer.keys()].sort(), widthsStates, retries: [...retried.values()].sort((a, b) => a.cell.localeCompare(b.cell)),
    settleBounded: { jobs: settleBounded.reduce((n, e) => n + e.cells.length, 0), byStoryState: settleBounded }, combos,
  };
}

export function formatSummary(s) {
  const L = [];
  L.push(`rendered state census — rows ${s.rows} (failing ${s.failing}); ${JSON.stringify(s.meta)}`);
  L.push('rows failing per rule:');
  for (const k of RULE_KEYS) L.push(`  ${k.padEnd(22)} ${s.perRule[k]}`);
  L.push('rows with a not-applicable check, per rule (R13: recorded in the row, never silent):');
  const naKeys = Object.keys(s.notApplicable).sort();
  if (naKeys.length === 0) L.push('  (none)');
  for (const k of naKeys) L.push(`  ${k.padEnd(22)} ${s.notApplicable[k]}`);
  L.push(`controls skipped by the action rules (R24 / R30: clipped away, out of the tab order, hidden from assistive technology): ${s.skippedActions.controls} in ${s.skippedActions.rows} row(s)`);
  L.push(`controls excused from target-small by a registry row's exemptTargets and its dated owner decision (Task 923 R33, D9): ${s.exemptedControls.controls} in ${s.exemptedControls.rows} row(s)`);
  L.push(`boxes excused from component-overflow by a registry row's exemptOverflow and its dated owner decision (Task 923 R33, D10): ${s.exemptedOverflow.boxes} in ${s.exemptedOverflow.rows} row(s)`);
  L.push(`text excused from text-ellipsis by a registry row's exemptText and its dated owner decision (Task 923 R136, D84): ${s.exemptedText.elements} in ${s.exemptedText.rows} row(s)`);
  L.push(`Story x state x width with no pointer dismissal (neither close-control nor outside applies): ${s.noPointerDismissal.length}`);
  for (const l of s.noPointerDismissal) L.push(`  ${l}`);
  const unmeasured = s.widthsStates.filter((w) => w.inRange.some((b) => b.rows === 0) || w.outside.some((b) => b.rows === 0));
  L.push(`widths states: ${s.widthsStates.length}; each measured at its in-range bound and at the first width outside it (rows per locale): ${s.widthsStates.length - unmeasured.length} complete, ${unmeasured.length} with a missing cell`);
  for (const w of s.widthsStates) {
    L.push(`  ${w.id} ${JSON.stringify(w.widths)}: in-range ${w.inRange.map((b) => `${b.width}px x${b.rows}`).join(', ')}; first outside ${w.outside.map((b) => `${b.width}px x${b.rows}`).join(', ')}`);
  }
  const recovered = s.retries.filter((x) => x.recovered).length;
  L.push(`retried jobs (R16: one retry on a fresh page after a navigation error, a render timeout or an open timeout; a second failure is the violation): ${s.retries.length} (recovered ${recovered}, still failing ${s.retries.length - recovered})`);
  for (const x of s.retries) L.push(`  ${x.cell} :: ${x.recovered ? 'recovered' : 'still failing'} :: first failure: ${x.firstFailure}`);
  L.push(`jobs that hit the settle bound (R31: ${SETTLE_BOUND_MS}ms; the page was measured as it was), by Story x state: ${s.settleBounded.jobs} job(s) in ${s.settleBounded.byStoryState.length} Story x state`);
  for (const e of s.settleBounded.byStoryState) L.push(`  ${e.key} :: ${e.cells.length} job(s) (${e.cells.join(', ')})`);
  L.push(`Story x state x root with a violation: ${s.combos.length}`);
  for (const c of s.combos) L.push(`  ${c.key} :: ${c.rules.join(', ')} (${c.cells} cell(s))`);
  return L.join('\n');
}
