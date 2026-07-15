#!/usr/bin/env node
/**
 * check-hydration-console.mjs — Playwright-based hydration / console-error gate.
 *
 * Navigates to Next.js app routes and FAILS if:
 *   - The browser console contains a React hydration mismatch ("Hydration failed because…"),
 *     an SSR/CSR tree-mismatch warning, invalid-HTML nesting, a whitespace text-node warning,
 *     or a runtime/build-error pattern ("Cannot find module…", "Module not found…", Task 600).
 *   - The navigation response status is not OK (≥400 — a hard server error, Task 600).
 *   - An uncaught client-side exception fires (`pageerror`, Task 600).
 *   - The Next.js dev error-overlay dialog is present in the DOM (Task 600).
 *
 * WHY THIS GATE EXISTS:
 *   `build` / `tsc` / `lint` do NOT catch React hydration mismatches.
 *   Task 434 (admin date-format SSR/CSR divergence) passed all CI checks while
 *   breaking the page. This gate was added by Epic RS Slice 1 (Task 436) to catch
 *   that class of regression automatically.
 *
 * 🔴 HARDENED AGAINST FALSE PASS ON A HARD-ERRORED PAGE (Task 600, 2026-07-15):
 *   Before this task, `checkRoute` ONLY inspected `page.on('console')` for `HYDRATION_PATTERNS`.
 *   During the Task 599 review, a corrupted-`.next` runtime error (`Cannot find module
 *   '../chunks/ssr/[turbopack]_runtime.js'`) produced a hard 500 — the app never hydrated — yet
 *   the gate reported 7/7 PASS, because the crash never emitted console text matching a hydration
 *   regex. `checkRoute` now also fails on a non-OK response status, any uncaught `pageerror`, and
 *   the Next dev error-overlay dialog being present in the DOM (selector verified empirically
 *   against a real running Next 15 dev instance — see `--verify-error-page`).
 *
 * 🔴 DEV-ONLY DIAGNOSTIC — MUST run against `next dev`, NEVER `next start` (Task 599, 2026-07-15):
 *   React strips hydration-mismatch console warnings from PRODUCTION builds by design (perf/size).
 *   `check:hydration` against a `next start` server will PASS even when a real hydration mismatch
 *   is present — this is a false green, not evidence of correctness. Verified empirically on this
 *   task: a deliberately reintroduced mismatch (restored `ssr:false` + `if (loading) return null`
 *   on `NotificationBell`) produced a clean 7/7 PASS against `next start` on 3 consecutive runs,
 *   yet the SAME code reliably failed under `next dev` (see the authenticated-homepage differential
 *   below). BASE_URL must point at a `next dev` server for this gate to mean anything.
 *
 * Usage:
 *   # Verify the gate mechanism works (no server needed — self-test):
 *   npm run check:hydration:verify
 *
 *   # Verify admin route config is wired (no server, no auth — CI-safe):
 *   npm run check:hydration:admin-config
 *
 *   # Verify the gate FAILs a hard-errored page instead of a false PASS (no Next server — CI-safe):
 *   npm run check:hydration:error-page
 *
 *   # Check public routes on a running Next.js server:
 *   BASE_URL=http://localhost:3000 npm run check:hydration
 *
 *   # Check public + admin routes (preferred: storageState from capture harness):
 *   npm run capture:admin-session                        # Step 1: capture session
 *   HYDRATION_GATE_STORAGE_STATE=playwright/.auth/admin-storage-state.json \
 *     HYDRATION_ADMIN_USER_ID=<uuid> \
 *     BASE_URL=http://localhost:3000 \
 *     npm run check:hydration -- --with-admin            # Step 2: check
 *
 *   # Legacy fallback — admin via raw cookie JSON from browser DevTools:
 *   HYDRATION_GATE_COOKIES='[{"name":"sb-xxx-auth-token.0","value":"…","domain":"localhost"}]' \
 *     BASE_URL=http://localhost:3000 npm run check:hydration -- --with-admin
 *
 * Env vars:
 *   HYDRATION_LISTING_PATH          Path to a real published listing detail page.
 *   HYDRATION_ADMIN_USER_ID         UUID of a real user with history.
 *   HYDRATION_GATE_STORAGE_STATE    Path to a Playwright storageState JSON (preferred).
 *   HYDRATION_GATE_COOKIES          JSON array of cookie objects (legacy fallback).
 *   If BOTH session sources are set → fail-fast (never silently merge stale sessions).
 *
 * Admin route coverage:
 *   Admin routes are ONLY navigated when an authenticated session is provided.
 *   Without a session, --with-admin marks both admin routes as SKIP / NOT-REAL-COVERAGE
 *   — they are NEVER navigated unauthenticated (that would only render the login page,
 *   producing a false PASS).
 *
 * Authenticated-homepage coverage (Task 599):
 *   Whenever a session is provided (HYDRATION_GATE_STORAGE_STATE / HYDRATION_GATE_COOKIES),
 *   independent of --with-admin, the gate ALSO navigates /en and /uk authenticated — the
 *   exact state (header right-cluster with the NotificationBell present) that exposed the
 *   Mantine useId hydration mismatch this gate previously missed (guest-only public routes
 *   never render the bell, so no mismatch). Without a session these two routes are marked
 *   SKIP / NOT-REAL-COVERAGE, never a false PASS.
 *
 *   Sandbox-observed differential (2026-07-15, `next dev`, real captured Supabase session,
 *   NOT a verdict — see docs/critical-flow-registry.md "Authenticated header hydration" row):
 *   with the pre-fix code restored (`ssr:false` dynamic import), 3 consecutive runs showed
 *   guest `/en` PASS 3/3 vs authenticated `/en` FAIL 3/3 — a clean differential tracking the
 *   presence/absence of the ssr:false boundary. Post-fix, a freshly-restarted `next dev`
 *   still showed authenticated-route failures in a minority of runs, indistinguishable in
 *   this sandbox from unrelated pre-existing dev-mode flakiness that also hits guest-only
 *   routes with no bell (`/uk`, `/sq`, `/listings`) on identical unchanged code. Per
 *   agent-contract clause 14 this sandbox is a SCREEN, not a verdict — the authoritative
 *   planted-violation transcript (fix clean ≥3/3, replanted ssr:false FAILs authenticated
 *   routes) must come from an owner NATIVE `next dev` run, not this sandbox.
 *
 * CI integration:
 *   - `npm run check:hydration:verify` is CI-safe (self-test, no server needed).
 *   - `npm run check:hydration:admin-config` is CI-safe (config self-test, no server/auth).
 *   - `npm run check:hydration:error-page` is CI-safe (self-test, no server needed, Task 600).
 *   - `npm run check:hydration` requires a running `next dev` server — owner-run only.
 *     NEVER run it against `next start` / production — see "DEV-ONLY DIAGNOSTIC" above.
 *
 * First run — install Playwright browsers:
 *   npx playwright install chromium
 *
 * Added by Task 436 (Epic RS Slice 1, 2026-06-16). Slice 6b (Task 451): storageState,
 * admin-config self-test, no-session admin SKIP. Task 599 (2026-07-15): authenticated-homepage
 * coverage. Task 600 (2026-07-15): hardened against false PASS on HTTP error / pageerror /
 * dev error-overlay; RUNTIME_ERROR_PATTERNS; --verify-error-page self-test.
 */

import { createServer } from 'node:http';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const VERIFY_GATE        = args.includes('--verify-gate');
const VERIFY_ADMIN_CONFIG = args.includes('--verify-admin-config');
const VERIFY_ERROR_PAGE  = args.includes('--verify-error-page');
const WITH_ADMIN         = args.includes('--with-admin');
const BASE_URL           = process.env.BASE_URL ?? 'http://localhost:3000';

// Owner-parametrizable coverage slots.
// When unset: route appears as NOT-REAL-COVERAGE/SKIP — never silently dropped.
const LISTING_PATH    = process.env.HYDRATION_LISTING_PATH   || null;
const ADMIN_USER_ID   = process.env.HYDRATION_ADMIN_USER_ID  || null;

// Authenticated session for admin routes.
// HYDRATION_GATE_STORAGE_STATE: path to a Playwright storageState JSON file
//   (produced by capture-admin-session.mjs). Preferred over HYDRATION_GATE_COOKIES.
// HYDRATION_GATE_COOKIES: JSON array of Playwright cookie objects (legacy fallback).
// If BOTH are set → fail-fast (never silently merge stale sessions).
const STORAGE_STATE_PATH = process.env.HYDRATION_GATE_STORAGE_STATE || null;
const COOKIES_JSON       = process.env.HYDRATION_GATE_COOKIES       || null;

// ── Hydration / console-error patterns ───────────────────────────────────────

const HYDRATION_PATTERNS = [
  /hydration failed/i,
  /text content (did not|does not) match/i,
  /there was an error while hydrating/i,
  /server rendered html didn't match/i,
  /expected server html to contain a matching/i,
  /whitespace text nodes cannot be a child of/i,
  /did not match. server:/i,
  /validatedomnesting/i,
  /did not match server-rendered html/i,
  /this tree will be regenerated on the client/i,
  /server component rendered more hooks/i,
  /rendered fewer hooks than expected/i,
];

// Runtime/build-error console patterns (Task 600). Additive to HYDRATION_PATTERNS, not a
// replacement — these catch the class of error that hid behind a false PASS during the Task 599
// review: a corrupted `.next` runtime ("Cannot find module …[turbopack]_runtime.js") produced a
// hard 500 with no hydration-pattern console text at all.
const RUNTIME_ERROR_PATTERNS = [
  /cannot find module/i,
  /unhandled runtime error/i,
  /module not found/i,
  /failed to compile/i,
];

// ── Route planner (pure function — shared by runChecks + verifyAdminConfig) ──
//
// Returns the full route list for a given configuration. Admin routes are
// marked notRealCoverage when no session is available — they are NEVER
// navigated unauthenticated (that would only render the login page = false PASS).

function planRoutes({ withAdmin, hasSession, adminUserId, listingPath }) {
  const routes = [
    { path: '/en',           label: 'Homepage (en)' },
    { path: '/en/listings',  label: 'Listings list (en)' },
    { path: '/sq',           label: 'Homepage (sq/Albanian)' },
    { path: '/uk',           label: 'Homepage (uk/Ukrainian)' },
    listingPath
      ? { path: listingPath, label: `Listing detail (${listingPath})` }
      : {
          path: null,
          label: 'Listing detail — AC1 route (Task 448)',
          notRealCoverage: true,
          reason: 'HYDRATION_LISTING_PATH not set — set to /en/listings/<slug> of a real published listing',
        },
  ];

  // Authenticated-homepage coverage (Task 599). The header right-cluster
  // (LocaleSwitcher + UserMenu + NotificationBell) only renders its
  // authenticated shape when a session is loaded into the browser context —
  // the exact state that exposed the useId hydration mismatch this gate
  // previously missed. Independent of --with-admin: this is a general
  // authenticated-header check, not an admin-only one.
  if (hasSession) {
    routes.push(
      { path: '/en', label: 'Homepage authenticated (en) — header hydration (Task 599)' },
      { path: '/uk', label: 'Homepage authenticated (uk) — header hydration (Task 599)' },
    );
  } else {
    routes.push(
      {
        path: null,
        label: 'Homepage authenticated (en) — header hydration (Task 599)',
        notRealCoverage: true,
        reason: 'no session (HYDRATION_GATE_STORAGE_STATE / HYDRATION_GATE_COOKIES not set)',
      },
      {
        path: null,
        label: 'Homepage authenticated (uk) — header hydration (Task 599)',
        notRealCoverage: true,
        reason: 'no session (HYDRATION_GATE_STORAGE_STATE / HYDRATION_GATE_COOKIES not set)',
      },
    );
  }

  if (!withAdmin) return routes;

  if (!hasSession) {
    routes.push(
      {
        path: null,
        label: 'Admin users list (Task 434 area)',
        notRealCoverage: true,
        reason: 'no admin session (HYDRATION_GATE_STORAGE_STATE / HYDRATION_GATE_COOKIES not set)',
      },
      {
        path: null,
        label: 'Admin user detail /admin/users/[id] (EXACT Task 434 hydration route)',
        notRealCoverage: true,
        reason: 'no admin session (HYDRATION_GATE_STORAGE_STATE / HYDRATION_GATE_COOKIES not set)',
      },
    );
    return routes;
  }

  // Session is available — list route is always navigated
  routes.push({ path: '/en/admin/users', label: 'Admin users list (Task 434 area)' });

  // Detail route gated on UUID
  if (adminUserId) {
    routes.push({
      path: `/en/admin/users/${adminUserId}`,
      label: 'Admin user detail /admin/users/[id] (EXACT Task 434 hydration route)',
    });
  } else {
    routes.push({
      path: null,
      label: 'Admin user detail /admin/users/[id] (EXACT Task 434 hydration route)',
      notRealCoverage: true,
      reason: 'HYDRATION_ADMIN_USER_ID not set — set to a real user UUID so components render with actual data',
    });
  }

  return routes;
}

// ── Planted-violation page ────────────────────────────────────────────────────

const VIOLATION_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Hydration Gate Self-Test</title></head>
<body>
<div id="app">Server-rendered text: January 1 2026</div>
<script>
  console.error(
    "Hydration failed because the server rendered HTML didn't match the client. " +
    "As a result this tree will be regenerated on the client. " +
    "This can happen if a SSR-ed Client Component used:\\n" +
    "- Variable input such as Date.now() or Math.random() which changes each time it's called.\\n" +
    "- A server/client branch like if (typeof window !== 'undefined').\\n" +
    "- Date formatting that diverges between Node.js and browser ICU (e.g. 'January 1 2026' vs '1 Jan 2026')."
  );
  console.error(
    "Text content does not match server-rendered HTML. " +
    "Server: \\"January 1 2026\\" Client: \\"1 Jan 2026\\""
  );
</script>
</body>
</html>`;

// ── Core: check a single route ────────────────────────────────────────────────

async function checkRoute(page, url, label) {
  const violations = [];

  const consoleHandler = msg => {
    const text = msg.text();
    const type = msg.type();
    if ((type === 'error' || type === 'warning') &&
        (HYDRATION_PATTERNS.some(p => p.test(text)) || RUNTIME_ERROR_PATTERNS.some(p => p.test(text)))) {
      violations.push({ type, text: text.slice(0, 300) });
    }
  };

  // Task 600: uncaught client-side exceptions never surface via page.on('console') — they need
  // their own listener. This is what catches "Cannot find module …[turbopack]_runtime.js" and
  // any other thrown runtime error that previously produced a false PASS.
  const pageErrorHandler = err => {
    violations.push({ type: 'pageerror', text: String(err.message ?? err).slice(0, 300) });
  };

  page.on('console', consoleHandler);
  page.on('pageerror', pageErrorHandler);

  let response;
  try {
    response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForTimeout(800);
  } catch (err) {
    return { label, url, status: 'SKIP', reason: String(err.message).slice(0, 120), violations: [] };
  } finally {
    page.off('console', consoleHandler);
    page.off('pageerror', pageErrorHandler);
  }

  // Task 600: fail on a non-OK navigation response (e.g. a corrupted-.next 500) — a hard error
  // page has no hydration-pattern console text to match, so this was previously a false PASS.
  if (response && !response.ok()) {
    violations.push({ type: 'http', text: `HTTP ${response.status()} on ${url}` });
  }

  // Task 600: detect the Next.js dev error-overlay in the DOM even if console/pageerror were
  // somehow silent. Verified against a real Next 15 dev instance (Task 600): the overlay renders
  // inside <nextjs-portal>'s shadow root as #nextjs__container_errors_label (text e.g. "Runtime
  // Error") only when an error dialog is actually shown — confirmed absent on a clean 200 page
  // (the <nextjs-portal>/devtools-indicator element itself is ALWAYS present in dev mode, so its
  // mere existence is not a valid signal; the error-dialog child inside its shadow root is).
  const overlayText = await page.evaluate(() => {
    const portal = document.querySelector('nextjs-portal');
    if (!portal || !portal.shadowRoot) return null;
    const label = portal.shadowRoot.querySelector('#nextjs__container_errors_label');
    return label ? label.textContent : null;
  }).catch(() => null);
  if (overlayText) {
    violations.push({ type: 'overlay', text: overlayText.slice(0, 300) });
  }

  return { label, url, status: violations.length === 0 ? 'PASS' : 'FAIL', violations };
}

// ── Self-test: verify the gate is not a no-op ─────────────────────────────────

async function runGateSelfTest() {
  console.log('\n🔬 Hydration gate self-test (--verify-gate)');
  console.log('   Purpose: prove the gate is NOT a no-op by planting a violation.\n');

  const { chromium } = await import('playwright');

  let violationServer;
  const violationUrl = await new Promise((resolve, reject) => {
    violationServer = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(VIOLATION_PAGE_HTML);
    });
    violationServer.listen(0, '127.0.0.1', () => {
      const { port } = violationServer.address();
      resolve(`http://127.0.0.1:${port}/`);
    });
    violationServer.on('error', reject);
  });

  console.log(`   Planted-violation server started at ${violationUrl}`);
  console.log('   This page emits the EXACT React hydration error that Task 434 would trigger.\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let result;
  try {
    result = await checkRoute(page, violationUrl, 'Planted hydration violation');
  } finally {
    await browser.close();
    await new Promise(r => violationServer.close(r));
  }

  console.log('   Route:', result.label);
  console.log('   Status:', result.status);
  if (result.violations.length > 0) {
    console.log('   Violations detected:');
    result.violations.forEach((v, i) => {
      console.log(`     [${i + 1}] (${v.type}) ${v.text.slice(0, 120)}...`);
    });
  }

  if (result.status === 'FAIL') {
    console.log('\n✅ GATE IS FUNCTIONAL — planted violation was correctly detected.');
    console.log('   The gate will FAIL on real hydration mismatches in the Next.js app.\n');
    process.exit(0);
  } else {
    console.error('\n❌ GATE IS A NO-OP — planted violation was NOT detected.');
    console.error('   The hydration error patterns may not match. This is a gate defect.\n');
    process.exit(1);
  }
}

// ── G-C: error-page self-test (--verify-error-page) ──────────────────────────
//
// Task 600. Proves checkRoute() no longer gives a false PASS on a hard-errored page — the exact
// blind spot the Task 599 review hit (a corrupted-.next 500 with no hydration-pattern console
// text reported 7/7 PASS). Serves 3 tiny local pages: an HTTP 500, a page that throws an uncaught
// pageerror, and a clean 200 page. CI-safe, no Next server needed — only requires chromium, same
// as --verify-gate.

const ERROR_PAGE_500_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>Server Error</body></html>`;

const ERROR_PAGE_THROW_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body>
<div id="app">This page throws an uncaught client-side exception</div>
<script>
  setTimeout(() => { throw new Error('Task 600 self-test: deliberate uncaught pageerror'); }, 10);
</script>
</body></html>`;

const ERROR_PAGE_CLEAN_HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>Clean page, no errors</body></html>`;

async function runErrorPageSelfTest() {
  console.log('\n🔬 Error-page self-test (--verify-error-page)');
  console.log('   Purpose: prove checkRoute() FAILs on a hard-errored page instead of a false PASS.\n');

  let server;
  const baseUrl = await new Promise((resolve, reject) => {
    server = createServer((req, res) => {
      if (req.url === '/500') {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(ERROR_PAGE_500_HTML);
      } else if (req.url === '/throw') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(ERROR_PAGE_THROW_HTML);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(ERROR_PAGE_CLEAN_HTML);
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve(`http://127.0.0.1:${port}`);
    });
    server.on('error', reject);
  });

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const cases = [
    { url: `${baseUrl}/500`, label: 'HTTP 500 page', expect: 'FAIL' },
    { url: `${baseUrl}/throw`, label: 'Uncaught pageerror page', expect: 'FAIL' },
    { url: `${baseUrl}/clean`, label: 'Clean 200 page', expect: 'PASS' },
  ];

  let pass = true;
  try {
    for (const c of cases) {
      const result = await checkRoute(page, c.url, c.label);
      const ok = result.status === c.expect;
      console.log(`   ${ok ? '✅' : '❌'} ${c.label}: expected ${c.expect}, got ${result.status}` +
        (result.violations.length ? ` — ${result.violations.map(v => `(${v.type}) ${v.text.slice(0, 80)}`).join('; ')}` : ''));
      if (!ok) pass = false;
    }
  } finally {
    await browser.close();
    await new Promise(r => server.close(r));
  }

  if (pass) {
    console.log('\n✅ ERROR-PAGE HARDENING IS FUNCTIONAL — 500/pageerror FAIL, clean page PASSes.\n');
    process.exit(0);
  } else {
    console.error('\n❌ ERROR-PAGE HARDENING IS BROKEN — see mismatches above. This is a gate defect.\n');
    process.exit(1);
  }
}

// ── G-B: admin-config self-test (--verify-admin-config) ──────────────────────
//
// Server-less, auth-less, deterministic. Verifies the route plan for all 3 session
// states using the same planRoutes() function that runChecks() uses.
// This MUST be able to FAIL on a planted misconfig (a no-op is a task failure).

function verifyAdminConfig() {
  console.log('\n🔬 Admin-config self-test (--verify-admin-config)');
  console.log('   Purpose: prove the admin branch route plan is correctly gated.\n');

  let pass = true;

  // State 1: no session → both admin routes must be notRealCoverage
  const noSessionPlan = planRoutes({ withAdmin: true, hasSession: false, adminUserId: null, listingPath: null });
  const noSessionAdmin = noSessionPlan.filter(r => r.label.includes('Admin'));
  if (noSessionAdmin.length !== 2) {
    console.error(`   ❌ [1] no-session plan has ${noSessionAdmin.length} admin routes, expected 2`);
    pass = false;
  } else if (!noSessionAdmin.every(r => r.notRealCoverage)) {
    const navigable = noSessionAdmin.filter(r => !r.notRealCoverage).map(r => r.label);
    console.error(`   ❌ [1] no-session plan has navigable admin route(s): ${navigable.join(', ')} — false green`);
    pass = false;
  } else {
    console.log('   ✅ [1] no-session: both admin routes → notRealCoverage (never PASS)');
  }

  // State 2: session, no UUID → list navigable, detail notRealCoverage
  const sessionNoUuidPlan = planRoutes({ withAdmin: true, hasSession: true, adminUserId: null, listingPath: null });
  const sessionNoUuidAdmin = sessionNoUuidPlan.filter(r => r.label.includes('Admin'));
  const listRoute = sessionNoUuidAdmin.find(r => r.label.includes('list'));
  const detailRoute = sessionNoUuidAdmin.find(r => r.label.includes('detail'));

  if (!listRoute || listRoute.notRealCoverage || listRoute.path !== '/en/admin/users') {
    console.error(`   ❌ [2] session-no-UUID: list route missing or not navigable (path=${listRoute?.path}, notReal=${listRoute?.notRealCoverage})`);
    pass = false;
  } else {
    console.log(`   ✅ [2] session-no-UUID: list route navigable → ${listRoute.path}`);
  }

  if (!detailRoute || !detailRoute.notRealCoverage) {
    console.error(`   ❌ [2] session-no-UUID: detail route is navigable when UUID not set — false green`);
    pass = false;
  } else {
    console.log('   ✅ [2] session-no-UUID: detail route → notRealCoverage (correct)');
  }

  // State 3: session + UUID → both navigable with correct paths
  const testUuid = 'test-uuid-451';
  const fullPlan = planRoutes({ withAdmin: true, hasSession: true, adminUserId: testUuid, listingPath: null });
  const fullAdmin = fullPlan.filter(r => r.label.includes('Admin'));
  const fullList = fullAdmin.find(r => r.label.includes('list'));
  const fullDetail = fullAdmin.find(r => r.label.includes('detail'));

  if (!fullList || fullList.notRealCoverage || fullList.path !== '/en/admin/users') {
    console.error(`   ❌ [3] session+UUID: list route not navigable`);
    pass = false;
  } else {
    console.log(`   ✅ [3] session+UUID: list route → ${fullList.path}`);
  }

  const expectedDetailPath = `/en/admin/users/${testUuid}`;
  if (!fullDetail || fullDetail.notRealCoverage || fullDetail.path !== expectedDetailPath) {
    console.error(`   ❌ [3] session+UUID: detail route wrong (path=${fullDetail?.path}, notReal=${fullDetail?.notRealCoverage})`);
    pass = false;
  } else {
    console.log(`   ✅ [3] session+UUID: detail route → ${fullDetail.path}`);
  }

  // State 4 (Task 599): authenticated-homepage coverage gates purely on
  // hasSession, independent of --with-admin, and is never a false PASS.
  const noSessionHomepagePlan = planRoutes({ withAdmin: false, hasSession: false, adminUserId: null, listingPath: null });
  const noSessionHomepageAuth = noSessionHomepagePlan.filter(r => r.label.includes('Homepage authenticated'));
  if (noSessionHomepageAuth.length !== 2 || !noSessionHomepageAuth.every(r => r.notRealCoverage)) {
    console.error(`   ❌ [4] no-session: authenticated-homepage routes not correctly gated (found ${noSessionHomepageAuth.length}, notRealCoverage=${noSessionHomepageAuth.map(r => r.notRealCoverage)}) — false green risk`);
    pass = false;
  } else {
    console.log('   ✅ [4] no-session: both authenticated-homepage routes → notRealCoverage (never PASS)');
  }

  const sessionHomepagePlan = planRoutes({ withAdmin: false, hasSession: true, adminUserId: null, listingPath: null });
  const sessionHomepageAuth = sessionHomepagePlan.filter(r => r.label.includes('Homepage authenticated'));
  const enAuth = sessionHomepageAuth.find(r => r.label.includes('(en)'));
  const ukAuth = sessionHomepageAuth.find(r => r.label.includes('(uk)'));
  if (!enAuth || enAuth.notRealCoverage || enAuth.path !== '/en' || !ukAuth || ukAuth.notRealCoverage || ukAuth.path !== '/uk') {
    console.error(`   ❌ [5] session (withAdmin=false): authenticated-homepage routes not navigable (en=${JSON.stringify(enAuth)}, uk=${JSON.stringify(ukAuth)})`);
    pass = false;
  } else {
    console.log(`   ✅ [5] session (withAdmin=false): authenticated-homepage routes navigable → ${enAuth.path}, ${ukAuth.path}`);
  }

  if (pass) {
    console.log('\n✅ Admin-config self-test PASSED — route plan correctly gates on session state.\n');
    process.exit(0);
  } else {
    console.error('\n❌ Admin-config self-test FAILED — misconfig detected.\n');
    process.exit(1);
  }
}

// ── Main: check routes on running Next.js server ──────────────────────────────

async function runChecks() {
  // Fail-fast if both session sources are set (never silently merge stale sessions)
  if (STORAGE_STATE_PATH && COOKIES_JSON) {
    console.error('\n❌ Both HYDRATION_GATE_STORAGE_STATE and HYDRATION_GATE_COOKIES are set.');
    console.error('   Set only one session source to avoid merging stale sessions.\n');
    process.exit(1);
  }

  const hasSession = !!(STORAGE_STATE_PATH || COOKIES_JSON);

  const routes = planRoutes({
    withAdmin: WITH_ADMIN,
    hasSession,
    adminUserId: ADMIN_USER_ID,
    listingPath: LISTING_PATH,
  });

  console.log('\n🔍 Hydration / console-error gate');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Routes: ${routes.length} (${WITH_ADMIN ? 'public + admin' : 'public only'})`);
  if (WITH_ADMIN) {
    if (STORAGE_STATE_PATH) {
      console.log(`   Auth:   storageState from ${STORAGE_STATE_PATH}`);
    } else if (COOKIES_JSON) {
      console.log(`   Auth:   cookies from HYDRATION_GATE_COOKIES`);
    } else {
      console.log(`   Auth:   NO session — admin routes will be SKIPPED (not navigated)`);
    }
  }
  console.log('');

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });

  let context;
  if (STORAGE_STATE_PATH) {
    const { existsSync } = await import('node:fs');
    if (!existsSync(STORAGE_STATE_PATH)) {
      console.error(`   ❌ Storage state file not found: ${STORAGE_STATE_PATH}`);
      console.error('   Run: npm run capture:admin-session\n');
      await browser.close();
      process.exit(1);
    }
    context = await browser.newContext({ storageState: STORAGE_STATE_PATH });
    console.log(`   Loaded storageState from ${STORAGE_STATE_PATH}\n`);
  } else {
    context = await browser.newContext();

    if (COOKIES_JSON) {
      let authCookies = [];
      try {
        authCookies = JSON.parse(COOKIES_JSON);
      } catch {
        console.error('   ⚠  HYDRATION_GATE_COOKIES is not valid JSON — ignoring');
      }
      if (authCookies.length > 0) {
        await context.addCookies(authCookies);
        console.log(`   Added ${authCookies.length} auth cookie(s) from HYDRATION_GATE_COOKIES\n`);
      }
    }
  }

  const page = await context.newPage();
  const results = [];

  for (const route of routes) {
    if (route.notRealCoverage) {
      console.log(`   Checking ${route.label} … SKIP ⚠  (NOT-REAL-COVERAGE: ${route.reason})`);
      results.push({ label: route.label, url: null, status: 'SKIP', reason: `NOT-REAL-COVERAGE: ${route.reason}`, violations: [] });
      continue;
    }

    const url = `${BASE_URL}${route.path}`;
    process.stdout.write(`   Checking ${route.label} … `);
    const result = await checkRoute(page, url, route.label);
    results.push(result);

    if (result.status === 'PASS') {
      console.log('PASS ✅');
    } else if (result.status === 'SKIP') {
      console.log(`SKIP ⚠  (${result.reason})`);
    } else {
      console.log(`FAIL ❌  (${result.violations.length} violation(s))`);
    }
  }

  await browser.close();

  const failed  = results.filter(r => r.status === 'FAIL');
  const skipped = results.filter(r => r.status === 'SKIP');
  const passed  = results.filter(r => r.status === 'PASS');

  console.log('\n── Summary ──────────────────────────────────────────────────');
  console.log(`   PASS: ${passed.length}  FAIL: ${failed.length}  SKIP: ${skipped.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Hydration violations found:\n');
    for (const r of failed) {
      console.error(`   Route: ${r.label} (${r.url})`);
      r.violations.forEach((v, i) => {
        console.error(`   [${i + 1}] (${v.type}) ${v.text}`);
      });
      console.error('');
    }
    console.error('Fix the hydration mismatches before merging.');
    console.error('These errors do NOT appear in tsc / lint / build — only in a running browser.\n');
    process.exit(1);
  }

  if (skipped.length > 0 && passed.length === 0) {
    console.warn('\n⚠  All routes were skipped — is the dev server running?');
    console.warn(`   Start it with: npm run dev  (then re-run: BASE_URL=${BASE_URL} npm run check:hydration)\n`);
    process.exit(1);
  }

  console.log('\n✅ No hydration violations detected.\n');
  process.exit(0);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  if (VERIFY_GATE) {
    await runGateSelfTest();
  } else if (VERIFY_ADMIN_CONFIG) {
    verifyAdminConfig();
  } else if (VERIFY_ERROR_PAGE) {
    await runErrorPageSelfTest();
  } else {
    await runChecks();
  }
}

main().catch(err => {
  console.error('\ncheck-hydration-console.mjs: fatal error\n', err);
  process.exit(1);
});
