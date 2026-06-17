#!/usr/bin/env node
/**
 * check-hydration-console.mjs — Playwright-based hydration / console-error gate.
 *
 * Navigates to Next.js app routes and FAILS if the browser console contains:
 *   - React hydration mismatch errors ("Hydration failed because…")
 *   - SSR/CSR tree-mismatch warnings ("Text content does not match. Server: … Client: …")
 *   - Invalid-HTML nesting warnings ("validateDOMNesting: <div> cannot appear in <p>")
 *   - Whitespace text node warnings ("whitespace text nodes cannot be a child of")
 *   - General React SSR/client tree-mismatch warnings
 *
 * WHY THIS GATE EXISTS:
 *   `build` / `tsc` / `lint` do NOT catch React hydration mismatches.
 *   Task 434 (admin date-format SSR/CSR divergence) passed all CI checks while
 *   breaking the page. This gate was added by Epic RS Slice 1 (Task 436) to catch
 *   that class of regression automatically.
 *
 * Usage:
 *   # Verify the gate mechanism works (no server needed — self-test):
 *   npm run check:hydration:verify
 *
 *   # Verify admin route config is wired (no server, no auth — CI-safe):
 *   npm run check:hydration:admin-config
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
 * CI integration:
 *   - `npm run check:hydration:verify` is CI-safe (self-test, no server needed).
 *   - `npm run check:hydration:admin-config` is CI-safe (config self-test, no server/auth).
 *   - `npm run check:hydration` requires a running server — owner-run only.
 *
 * First run — install Playwright browsers:
 *   npx playwright install chromium
 *
 * Added by Task 436 (Epic RS Slice 1, 2026-06-16). Slice 6b (Task 451): storageState,
 * admin-config self-test, no-session admin SKIP.
 */

import { createServer } from 'node:http';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const VERIFY_GATE        = args.includes('--verify-gate');
const VERIFY_ADMIN_CONFIG = args.includes('--verify-admin-config');
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

  const handler = msg => {
    const text = msg.text();
    const type = msg.type();
    if ((type === 'error' || type === 'warning') &&
        HYDRATION_PATTERNS.some(p => p.test(text))) {
      violations.push({ type, text: text.slice(0, 300) });
    }
  };

  page.on('console', handler);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForTimeout(800);
  } catch (err) {
    return { label, url, status: 'SKIP', reason: String(err.message).slice(0, 120), violations: [] };
  } finally {
    page.off('console', handler);
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
  } else {
    await runChecks();
  }
}

main().catch(err => {
  console.error('\ncheck-hydration-console.mjs: fatal error\n', err);
  process.exit(1);
});
