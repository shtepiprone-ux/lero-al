#!/usr/bin/env node
/**
 * check-header-id-parity.mjs — settled-DOM header Menu-target id comparator (structural drift
 * detector). NOT the Task 601 regression gate for the useId hydration mismatch — see below.
 *
 * 🔴 EMPIRICAL FINDING (Task 601, 2026-07-15) — this script CANNOT discriminate the specific
 * `useId` hydration-mismatch bug it was originally built to catch. Read before trusting a
 * PASS/FAIL from it as evidence about that bug class:
 *
 *   Mantine's `useId` hook (`node_modules/@mantine/hooks/esm/use-id/use-id.mjs`) seeds client
 *   state with the SSR-matching `reactId` (`useState(reactId)`), returns it unchanged on the
 *   FIRST render (so hydration itself can succeed cleanly), then an UNCONDITIONAL
 *   `useIsomorphicEffect` overwrites it with a fresh `randomId()` immediately after mount — on
 *   EVERY render, bug or no bug. By the time this script's `page.goto` + settle-wait reads the
 *   "hydrated" DOM, that swap has already happened.
 *
 *   Three independent native experiments (documented in
 *   `docs/sessions/2026-07-15-task601-header-hydration-id-parity-deterministic-proof.md`)
 *   confirmed this empirically against the REAL prod build with the REAL Task 599 fix/bug:
 *     1. This script's settled-DOM comparison FAILed on BOTH the fixed HEAD code and the
 *        `ssr:false`-replanted buggy code — identical failure shape either way (false positive).
 *     2. A MutationObserver capturing the full id-attribute-mutation history showed an
 *        IDENTICAL single-coalesced-mutation pattern on both fixed and buggy code (the browser
 *        coalesces same-tick mutations, erasing the transient hydration-corrected value).
 *     3. Direct console hydration-warning capture under `next dev` with the bug replanted
 *        showed ZERO warnings across 4 consecutive runs, including a cold `.next` cache.
 *
 *   → **The Task 601 regression gate for this specific bug is
 *   `src/components/layout/__tests__/header-hydration-id-parity.test.tsx`** (a deterministic
 *   jsdom `renderToString`→`hydrateRoot` dual-phase test asserting on React's own
 *   `onRecoverableError` callback — the only externally-observable signal that survives
 *   Mantine's post-mount id randomization). Run it via `npm run test:header-hydration-id-parity`.
 *
 * WHY THIS SCRIPT IS KEPT ANYWAY: its comparator (`compareIdSets`) and selector
 * (`extractTargetIds` / `TARGET_SELECTOR`, verified against the real Mantine source — see
 * below) remain useful as a STRUCTURAL drift detector — e.g. a genuine target-COUNT mismatch
 * (an extra/missing Menu in the header) is real signal this script would still catch, distinct
 * from the settled-id-value randomization false positive documented above. Its own
 * `--verify-gate` self-test remains accurate proof of that narrower claim.
 *
 * ── Original design rationale (still accurate for what this script actually measures) ──
 *
 * Detects the Mantine `useId` server↔client id divergence by comparing the header
 * LocaleSwitcher/UserMenu Menu **target ids** in the raw SSR HTML against the SAME elements'
 * ids in the settled hydrated DOM. Unlike `check-hydration-console.mjs` this never reads the
 * console, so it is:
 *   - immune to the `next dev` Turbopack console-noise floor (Task 601, confirmed
 *     NATIVELY by the Task 600 AC5 run — see docs/critical-flow-registry.md), and
 *   - immune to React stripping hydration-mismatch console warnings from production
 *     builds (Task 599) — because it never reads the console at all.
 *   (But see the empirical finding above: id-VALUE parity specifically is not a reliable
 *   signal for this bug class, regardless of console-independence.)
 *
 * 🔴 MUST run against a PRODUCTION build (`next build` + `next start`), NOT `next dev`:
 *   the id VALUES themselves are deterministic either way, but a prod build removes any
 *   possibility of Turbopack's on-demand/lazy compilation affecting request-to-request
 *   consistency, and matches the kickoff's literal requirement (Task 601 AC2).
 *
 * WHAT IT CHECKS (selector verified against the real Mantine source shipped in this
 * repo's node_modules — NOT guessed, per the hard contract):
 *   - `Menu.Target` (`@mantine/core/esm/components/Menu/MenuTarget/MenuTarget.mjs:56`)
 *     renders `Popover.Target` with `popupType: "menu"`.
 *   - `Popover.Target` (`.../Popover/PopoverTarget/PopoverTarget.mjs:39-44`) clones its
 *     child with `aria-haspopup="menu"` and `id: ctx.getTargetId()`.
 *   - `Popover` (`.../Popover/Popover.mjs:135,228`) computes
 *     `uid = useId(id)` (Mantine's SSR-safe id hook) and
 *     `getTargetId: () => \`${uid}-target\`` — this is the exact id whose numeric
 *     portion shifts when a component earlier in the tree (NotificationBell) is
 *     present on one side (client) and absent on the other (server), per Task 599's
 *     root-cause diagnosis.
 *   - `HeaderActions.tsx` / `NotificationBell*` render NO `Menu` (only `Popover`s with
 *     the default `popupType: "dialog"`, grep-confirmed zero `Menu.Target` usage) — so
 *     `.site-header [aria-haspopup="menu"]` matches EXACTLY the LocaleSwitcher trigger
 *     and (desktop, authenticated) the UserMenu trigger, in that DOM order.
 *   - `useResponsiveDropdown` (`responsiveBottomSheet.tsx`) returns `isMobile=false` on
 *     BOTH the SSR render and the client's first render (Mantine `getInitialValueInEffect:
 *     true`), so at a ≥640px viewport the Menu.Target path is rendered consistently on
 *     both sides — this is why the check must run at a ≥640px viewport (the default
 *     Playwright viewport, 1280×720, qualifies).
 *
 * HOW IT WORKS:
 *   1. Server ids: an authenticated Playwright API request (`request.get`, using the
 *      captured storageState cookies) fetches the RAW SSR HTML — no browser rendering,
 *      no script execution, guaranteed pre-hydration. The HTML is loaded into a page
 *      with all network requests blocked (`page.route('**\/*', route => route.abort())`
 *      before `page.setContent`) so no inline bootstrap script can mutate it.
 *   2. Client ids: a real authenticated browser navigation (`page.goto`) to the SAME
 *      URL, hydrated, ids read from the live DOM after a short settle delay.
 *   3. Assert server id === client id, index-for-index, for every header Menu target.
 *      Any divergence (or a target-count mismatch) → FAIL, printing the exact
 *      server-vs-client id pair — warning-independent, prod-noise-free.
 *
 * Usage:
 *   # Verify the comparator + selector logic work (no server needed — self-test):
 *   npm run check:header-id-parity:verify
 *
 *   # Check against a running PRODUCTION build:
 *   npm run build && npm run start
 *   npm run capture:admin-session
 *   HEADER_ID_PARITY_STORAGE_STATE=playwright/.auth/admin-storage-state.json \
 *     BASE_URL=http://localhost:3000 \
 *     npm run check:header-id-parity
 *
 * Env vars:
 *   HEADER_ID_PARITY_STORAGE_STATE   Path to a Playwright storageState JSON (preferred:
 *                                    defaults to playwright/.auth/admin-storage-state.json,
 *                                    the same file `npm run capture:admin-session` writes).
 *   HEADER_ID_PARITY_LOCALES         Comma-separated locale list. Default: en,uk,sq,it
 *                                    (en+uk are the kickoff-mandated pair; sq/it are
 *                                    cheap bonus coverage — same route, different locale).
 *   BASE_URL                         Default http://localhost:3000.
 *
 * Negative flows (mirrors check-hydration-console.mjs's discipline — never a false PASS):
 *   - No captured session → every locale is NOT-REAL-COVERAGE / SKIP, process exits 1.
 *   - Session present but expired/guest (0 Menu targets found on both sides) → SKIP,
 *     never scored as PASS.
 *   - Server unreachable / wrong port → SKIP with the connection error, then a fail-fast
 *     "is the production server running?" message once no route passed.
 *
 * Added by Task 601 (Epic RS — Regression Shield, 2026-07-15). Follow-up from the Task 600
 * native run, which showed `check-hydration-console.mjs`'s console-scan has a `next dev`
 * Turbopack noise floor that cannot isolate the specific Task 599 header `useId` mismatch
 * (see docs/critical-flow-registry.md → "Authenticated header hydration" row).
 */

import { chromium, request as pwRequest } from 'playwright';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── CLI flags / env ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const VERIFY_GATE = args.includes('--verify-gate');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const STORAGE_STATE_PATH = process.env.HEADER_ID_PARITY_STORAGE_STATE
  || resolve(ROOT, 'playwright', '.auth', 'admin-storage-state.json');
const LOCALES = (process.env.HEADER_ID_PARITY_LOCALES || 'en,uk,sq,it')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Verified selector — see header comment for the exact Mantine source citation.
const TARGET_SELECTOR = '.site-header [aria-haspopup="menu"]';

// ── Core: extract header Menu target ids from a loaded page ──────────────────

async function extractTargetIds(page) {
  return page.$$eval(TARGET_SELECTOR, els =>
    els.map(el => ({
      id: el.getAttribute('id') || null,
      text: (el.textContent || '').trim().slice(0, 40),
    }))
  );
}

// ── Core: compare server ids vs client ids for one route ─────────────────────

function compareIdSets({ label, url, serverIds, clientIds }) {
  const violations = [];

  if (serverIds.length === 0 && clientIds.length === 0) {
    return {
      label,
      url,
      status: 'SKIP',
      reason: `No header Menu targets found (selector: ${TARGET_SELECTOR}) — session may be ` +
        'expired/guest, or the authenticated header shape did not render',
      violations: [],
    };
  }

  if (serverIds.length !== clientIds.length) {
    violations.push({
      type: 'structure',
      text: `Menu target count mismatch: server=${serverIds.length} client=${clientIds.length}`,
    });
  }

  const max = Math.max(serverIds.length, clientIds.length);
  for (let i = 0; i < max; i++) {
    const s = serverIds[i];
    const c = clientIds[i];
    if (!s || !c) continue; // already reported as a structure mismatch above
    if (!s.id || !c.id) {
      violations.push({
        type: 'missing-id',
        text: `[${i}] "${s.text}" missing id attribute (server="${s.id}" client="${c.id}")`,
      });
    } else if (s.id !== c.id) {
      violations.push({
        type: 'id-mismatch',
        text: `[${i}] "${s.text}" server id="${s.id}" !== client id="${c.id}"`,
      });
    }
  }

  return { label, url, status: violations.length === 0 ? 'PASS' : 'FAIL', violations };
}

// ── Core: check one route (server SSR ids vs hydrated client ids) ────────────

async function checkRouteIdParity({ requestContext, browserContext, baseUrl, path, label }) {
  const url = `${baseUrl}${path}`;

  // 1. Raw SSR HTML via an authenticated HTTP request — no browser rendering at all.
  let ssrResponse;
  try {
    ssrResponse = await requestContext.get(url, { timeout: 15_000 });
  } catch (err) {
    return { label, url, status: 'SKIP', reason: `SSR request failed: ${String(err.message ?? err).slice(0, 150)}`, violations: [] };
  }
  if (!ssrResponse.ok()) {
    return { label, url, status: 'FAIL', violations: [{ type: 'http', text: `SSR request HTTP ${ssrResponse.status()} on ${url}` }] };
  }
  const html = await ssrResponse.text();

  let serverIds;
  const ssrPage = await browserContext.newPage();
  try {
    // Block ALL network requests before injecting the HTML — guarantees no script
    // (inline bootstrap or external chunk) can execute and mutate the raw SSR markup
    // before we read it.
    await ssrPage.route('**/*', route => route.abort());
    await ssrPage.setContent(html, { waitUntil: 'domcontentloaded' });
    serverIds = await extractTargetIds(ssrPage);
  } finally {
    await ssrPage.close();
  }

  // 2. Hydrated DOM via a real authenticated browser navigation to the SAME url.
  let clientIds;
  const clientPage = await browserContext.newPage();
  try {
    let resp;
    try {
      resp = await clientPage.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
    } catch (err) {
      return { label, url, status: 'SKIP', reason: `Client navigation failed: ${String(err.message ?? err).slice(0, 150)}`, violations: [] };
    }
    if (!resp || !resp.ok()) {
      return { label, url, status: 'FAIL', violations: [{ type: 'http', text: `Client navigation HTTP ${resp ? resp.status() : 'none'} on ${url}` }] };
    }
    await clientPage.waitForTimeout(500);
    clientIds = await extractTargetIds(clientPage);
  } finally {
    await clientPage.close();
  }

  return compareIdSets({ label, url, serverIds, clientIds });
}

// ── G-A: gate self-test (--verify-gate) — CI-safe, no Next server ────────────
//
// Proves the comparator (compareIdSets) correctly PASSes on identical ids and FAILs
// on a diverging pair or a structural mismatch, AND proves the extraction selector
// (extractTargetIds / TARGET_SELECTOR) actually finds the right nodes against a literal
// fixture reproducing the real header markup shape. Deterministic, no Next.js server,
// no captured session — mirrors check-hydration-console.mjs's --verify-gate self-test.

const FIXTURE_HEADER_HTML = `<!DOCTYPE html>
<html><body>
<header class="site-header sticky top-0">
  <div><button id="mantine-7-target" aria-haspopup="menu" aria-expanded="false">EN</button></div>
  <div><button id="mantine-8-target" aria-haspopup="menu" aria-expanded="false">User Name</button></div>
  <!-- A Popover with the default popupType="dialog" must NOT be picked up -->
  <div><button id="mantine-9-target" aria-haspopup="dialog" aria-expanded="false">Bell</button></div>
</header>
</body></html>`;

async function runGateSelfTest() {
  console.log('\n🔬 Header id-parity gate self-test (--verify-gate)');
  console.log('   Purpose: prove compareIdSets() detects divergence and extractTargetIds()');
  console.log('   finds the real header Menu targets — neither is a no-op.\n');

  let pass = true;

  // [1] Identical ids on both sides → PASS.
  const same = compareIdSets({
    label: 'synthetic-match',
    url: 'http://synthetic/',
    serverIds: [{ id: 'mantine-1-target', text: 'EN' }, { id: 'mantine-2-target', text: 'User' }],
    clientIds: [{ id: 'mantine-1-target', text: 'EN' }, { id: 'mantine-2-target', text: 'User' }],
  });
  if (same.status !== 'PASS') {
    console.error('   ❌ [1] identical ids did not PASS:', same);
    pass = false;
  } else {
    console.log('   ✅ [1] identical ids → PASS');
  }

  // [2] A shifted useId counter (the real bug class) → FAIL with the printed id pair.
  const offset = compareIdSets({
    label: 'synthetic-offset',
    url: 'http://synthetic/',
    serverIds: [{ id: 'mantine-1-target', text: 'EN' }, { id: 'mantine-2-target', text: 'User' }],
    clientIds: [{ id: 'mantine-3-target', text: 'EN' }, { id: 'mantine-4-target', text: 'User' }],
  });
  if (offset.status !== 'FAIL' || offset.violations.length !== 2) {
    console.error('   ❌ [2] shifted-id offset did not FAIL correctly:', offset);
    pass = false;
  } else {
    console.log(`   ✅ [2] shifted-id offset → FAIL — ${offset.violations.map(v => v.text).join(' | ')}`);
  }

  // [3] Structural divergence (target count differs) → FAIL.
  const structural = compareIdSets({
    label: 'synthetic-structural',
    url: 'http://synthetic/',
    serverIds: [{ id: 'mantine-1-target', text: 'EN' }],
    clientIds: [{ id: 'mantine-1-target', text: 'EN' }, { id: 'mantine-2-target', text: 'User' }],
  });
  if (structural.status !== 'FAIL') {
    console.error('   ❌ [3] structural (count) mismatch did not FAIL:', structural);
    pass = false;
  } else {
    console.log('   ✅ [3] structural (Menu-target-count) mismatch → FAIL');
  }

  // [4] No targets found on either side → SKIP, never a false PASS.
  const empty = compareIdSets({ label: 'synthetic-empty', url: 'http://synthetic/', serverIds: [], clientIds: [] });
  if (empty.status !== 'SKIP') {
    console.error('   ❌ [4] zero targets on both sides did not SKIP (would be a false PASS/FAIL):', empty);
    pass = false;
  } else {
    console.log('   ✅ [4] zero targets on both sides → SKIP (never a false PASS)');
  }

  // [5] extractTargetIds against a literal fixture reproducing the real header markup —
  //     proves the selector finds exactly the 2 Menu targets and ignores the non-Menu
  //     (aria-haspopup="dialog") Popover, e.g. the NotificationBell.
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    await page.setContent(FIXTURE_HEADER_HTML, { waitUntil: 'domcontentloaded' });
    const extracted = await extractTargetIds(page);
    await page.close();
    if (
      extracted.length !== 2 ||
      extracted[0].id !== 'mantine-7-target' ||
      extracted[1].id !== 'mantine-8-target'
    ) {
      console.error('   ❌ [5] extractTargetIds did not find the expected 2 targets:', extracted);
      pass = false;
    } else {
      console.log(`   ✅ [5] extractTargetIds found exactly 2 targets (dialog Popover correctly excluded): ${extracted.map(e => e.id).join(', ')}`);
    }
  } finally {
    await browser.close();
  }

  if (pass) {
    console.log('\n✅ GATE IS FUNCTIONAL — comparator detects id divergence, selector extracts the real targets.\n');
    process.exit(0);
  } else {
    console.error('\n❌ GATE IS A NO-OP or BROKEN — see failures above. This is a gate defect.\n');
    process.exit(1);
  }
}

// ── Main: check routes on a running PRODUCTION Next.js server ────────────────

async function runChecks() {
  console.log('\n🔍 Header id-parity gate — server SSR vs hydrated DOM (Task 601)');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Locales: ${LOCALES.join(', ')}`);

  if (!existsSync(STORAGE_STATE_PATH)) {
    console.error(`\n❌ No captured session at ${STORAGE_STATE_PATH}`);
    console.error('   The authenticated header shape (LocaleSwitcher + UserMenu Menu targets) never');
    console.error('   renders for a guest — this check requires a real session.');
    console.error('   Run: npm run capture:admin-session\n');
    for (const locale of LOCALES) {
      console.log(`   Checking Header id-parity (${locale}) … SKIP ⚠  (NOT-REAL-COVERAGE: no captured session)`);
    }
    console.error('\n⚠  All routes are NOT-REAL-COVERAGE — no session available.\n');
    process.exit(1);
  }

  console.log(`   Session: ${STORAGE_STATE_PATH}\n`);

  const browser = await chromium.launch({ headless: true });
  const requestContext = await pwRequest.newContext({ storageState: STORAGE_STATE_PATH });
  const browserContext = await browser.newContext({ storageState: STORAGE_STATE_PATH });

  const results = [];
  try {
    for (const locale of LOCALES) {
      const path = `/${locale}`;
      const label = `Header id-parity (${locale})`;
      process.stdout.write(`   Checking ${label} … `);
      let result;
      try {
        result = await checkRouteIdParity({ requestContext, browserContext, baseUrl: BASE_URL, path, label });
      } catch (err) {
        result = { label, url: `${BASE_URL}${path}`, status: 'SKIP', reason: `fatal: ${String(err.message ?? err).slice(0, 150)}`, violations: [] };
      }
      results.push(result);
      if (result.status === 'PASS') {
        console.log('PASS ✅');
      } else if (result.status === 'SKIP') {
        console.log(`SKIP ⚠  (${result.reason})`);
      } else {
        console.log(`FAIL ❌  (${result.violations.length} violation(s))`);
      }
    }
  } finally {
    await requestContext.dispose();
    await browserContext.close();
    await browser.close();
  }

  const failed = results.filter(r => r.status === 'FAIL');
  const skipped = results.filter(r => r.status === 'SKIP');
  const passed = results.filter(r => r.status === 'PASS');

  console.log('\n── Summary ──────────────────────────────────────────────────');
  console.log(`   PASS: ${passed.length}  FAIL: ${failed.length}  SKIP: ${skipped.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Header Menu target id divergence found (server SSR ≠ hydrated DOM):\n');
    for (const r of failed) {
      console.error(`   Route: ${r.label} (${r.url})`);
      r.violations.forEach((v, i) => console.error(`   [${i + 1}] (${v.type}) ${v.text}`));
      console.error('');
    }
    console.error('This is a REAL useId hydration mismatch — the header Menu target ids differ');
    console.error('between what the server sent and what the client hydrated to.\n');
    process.exit(1);
  }

  if (skipped.length > 0 && passed.length === 0) {
    console.warn('\n⚠  All routes were skipped — is the PRODUCTION server running?');
    console.warn(`   Start it with: npm run build && npm run start  (then re-run against BASE_URL=${BASE_URL})\n`);
    process.exit(1);
  }

  console.log('\n✅ No header Menu target id divergence detected.\n');
  process.exit(0);
}

// ── Entry point ────────────────────────────────────────────────────────────────

async function main() {
  if (VERIFY_GATE) {
    await runGateSelfTest();
  } else {
    await runChecks();
  }
}

main().catch(err => {
  console.error('\ncheck-header-id-parity.mjs: fatal error\n', err);
  process.exit(1);
});
