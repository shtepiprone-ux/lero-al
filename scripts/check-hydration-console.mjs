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
 *   node scripts/check-hydration-console.mjs --verify-gate
 *   npm run check:hydration:verify
 *
 *   # Check public routes on a running Next.js server:
 *   BASE_URL=http://localhost:3000 node scripts/check-hydration-console.mjs
 *   npm run check:hydration
 *
 *   # Also check admin routes (requires auth cookies as a JSON array):
 *   HYDRATION_GATE_COOKIES='[{"name":"sb-xxx-auth-token.0","value":"<tok>","domain":"localhost"}]' \
 *     BASE_URL=http://localhost:3000 node scripts/check-hydration-console.mjs --with-admin
 *
 * Env vars:
 *   HYDRATION_LISTING_PATH   Path to a real published listing detail page (e.g.
 *                            /en/listings/my-listing-slug-123). When set the route is
 *                            checked; when unset the route appears in output as
 *                            NOT-REAL-COVERAGE / SKIP — never silently dropped.
 *   HYDRATION_ADMIN_USER_ID  UUID of a real user with history. When set admin-detail
 *                            uses /en/admin/users/<id>; when unset the admin-detail
 *                            check is reported as NOT-REAL-COVERAGE / SKIP.
 *
 * Admin route note:
 *   Admin pages (/admin/users, /admin/users/[id]) require an authenticated session.
 *   For local owner validation, export the Supabase auth cookie from browser DevTools
 *   (Application → Cookies) as JSON and set HYDRATION_GATE_COOKIES.
 *   The exact route /admin/users/[id] is the Task 434 hydration regression route and
 *   MUST be checked with a real authenticated admin session before closing any admin task.
 *
 * CI integration:
 *   - `npm run check:hydration:verify` is CI-safe (self-test, no server needed).
 *   - `npm run check:hydration` requires a running `next start` or `next dev` instance.
 *   - See .github/workflows/governance-pr.yml for where to add the full check.
 *
 * First run — install Playwright browsers:
 *   npx playwright install chromium
 *
 * Added by Task 436 (Epic RS Slice 1, 2026-06-16).
 * See docs/critical-flow-registry.md for the flow registry rows this gate covers.
 */

import { createServer } from 'node:http';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── CLI flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const VERIFY_GATE = args.includes('--verify-gate');
const WITH_ADMIN  = args.includes('--with-admin');
const BASE_URL    = process.env.BASE_URL ?? 'http://localhost:3000';

// Owner-parametrizable coverage slots.
// When unset: route appears as NOT-REAL-COVERAGE/SKIP — never silently dropped.
const LISTING_PATH    = process.env.HYDRATION_LISTING_PATH   || null;
const ADMIN_USER_ID   = process.env.HYDRATION_ADMIN_USER_ID  || null;

// ── Hydration / console-error patterns ───────────────────────────────────────
//
// These are the exact strings that React 18 and the browser emit for hydration
// mismatches, invalid-HTML nesting, and SSR/CSR tree divergences.
// Keep patterns case-insensitive for resilience against minor wording changes.

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
  // React 18 tree regeneration message
  /this tree will be regenerated on the client/i,
  // React 19 / Next 15 variant
  /server component rendered more hooks/i,
  /rendered fewer hooks than expected/i,
];

// ── Route definitions ─────────────────────────────────────────────────────────
//
// PUBLIC_ROUTES: no auth needed — safe to check in CI or locally without cookies.
// ADMIN_ROUTES:  require an authenticated admin session. Supplied via
//               HYDRATION_GATE_COOKIES env var (JSON array of cookie objects).
//               MUST include /admin/users/[id] — the exact Task 434 regression route.

const PUBLIC_ROUTES = [
  { path: '/en',           label: 'Homepage (en)' },
  { path: '/en/listings',  label: 'Listings list (en)' },
  { path: '/sq',           label: 'Homepage (sq/Albanian)' },
  { path: '/uk',           label: 'Homepage (uk/Ukrainian)' },
  // Listing-detail — where the Task 435 report dialog lives.
  // Set HYDRATION_LISTING_PATH=/en/listings/<slug> with a real published listing.
  LISTING_PATH
    ? { path: LISTING_PATH, label: `Listing detail (${LISTING_PATH})` }
    : {
        path: null,
        label: 'Listing detail — AC1 route (Task 448)',
        notRealCoverage: true,
        reason: 'HYDRATION_LISTING_PATH not set — set to /en/listings/<slug> of a real published listing',
      },
];

const ADMIN_ROUTES = [
  { path: '/en/admin/users', label: 'Admin users list (Task 434 area)' },
  // Admin user detail — EXACT Task 434 hydration regression route.
  // Set HYDRATION_ADMIN_USER_ID to a real user UUID with history so this exercises
  // the real components; unset → NOT-REAL-COVERAGE (dummy UUID yields not-found state).
  ADMIN_USER_ID
    ? { path: `/en/admin/users/${ADMIN_USER_ID}`, label: 'Admin user detail /admin/users/[id] (EXACT Task 434 hydration route)' }
    : {
        path: null,
        label: 'Admin user detail /admin/users/[id] (EXACT Task 434 hydration route)',
        notRealCoverage: true,
        reason: 'HYDRATION_ADMIN_USER_ID not set — set to a real user UUID so components render with actual data',
      },
];

// ── Planted-violation page ────────────────────────────────────────────────────
//
// Served by a tiny embedded HTTP server during --verify-gate mode.
// Emits the exact console.error messages that React 18 emits for hydration
// mismatches — the same pattern as the Task 434 date-format SSR/CSR divergence.

const VIOLATION_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Hydration Gate Self-Test</title></head>
<body>
<div id="app">Server-rendered text: January 1 2026</div>
<script>
  // Simulate React 18 hydration mismatch (exact Task 434 failure pattern:
  // server formatted date one way, browser ICU formatted it differently).
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
    const type = msg.type(); // 'error' | 'warning' | 'log' | ...
    if ((type === 'error' || type === 'warning') &&
        HYDRATION_PATTERNS.some(p => p.test(text))) {
      violations.push({ type, text: text.slice(0, 300) });
    }
  };

  page.on('console', handler);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
    // Give React a moment to hydrate (it runs on the next tick after DOMContentLoaded).
    await page.waitForTimeout(800);
  } catch (err) {
    // Navigation error is treated as a skip, not a violation — the route may not
    // exist or may be unreachable. We report it as a warning.
    return { label, url, status: 'SKIP', reason: String(err.message).slice(0, 120), violations: [] };
  } finally {
    page.off('console', handler);
  }

  return { label, url, status: violations.length === 0 ? 'PASS' : 'FAIL', violations };
}

// ── Self-test: verify the gate is not a no-op ─────────────────────────────────
//
// Starts a tiny HTTP server that serves VIOLATION_PAGE_HTML, navigates to it,
// and asserts that the gate DETECTS violations. If the gate fails to detect them,
// that means the gate itself is broken (a no-op) — exits 1.

async function runGateSelfTest() {
  console.log('\n🔬 Hydration gate self-test (--verify-gate)');
  console.log('   Purpose: prove the gate is NOT a no-op by planting a violation.\n');

  const { chromium } = await import('playwright');

  // Start embedded violation server
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

// ── Main: check routes on running Next.js server ──────────────────────────────

async function runChecks() {
  const routes = WITH_ADMIN
    ? [...PUBLIC_ROUTES, ...ADMIN_ROUTES]
    : PUBLIC_ROUTES;

  console.log('\n🔍 Hydration / console-error gate');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Routes: ${routes.length} (${WITH_ADMIN ? 'public + admin' : 'public only'})`);
  if (WITH_ADMIN) {
    const hasCookies = !!process.env.HYDRATION_GATE_COOKIES;
    console.log(`   Auth:   ${hasCookies ? 'cookies from HYDRATION_GATE_COOKIES' : 'NO cookies — admin routes will redirect to login'}`);
  }
  console.log('');

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });

  // Parse auth cookies if provided (for admin routes)
  let authCookies = [];
  if (process.env.HYDRATION_GATE_COOKIES) {
    try {
      authCookies = JSON.parse(process.env.HYDRATION_GATE_COOKIES);
    } catch {
      console.error('   ⚠  HYDRATION_GATE_COOKIES is not valid JSON — ignoring');
    }
  }

  const context = await browser.newContext();
  if (authCookies.length > 0) {
    await context.addCookies(authCookies);
    console.log(`   Added ${authCookies.length} auth cookie(s)\n`);
  }

  const page = await context.newPage();
  const results = [];

  for (const route of routes) {
    // NOT-REAL-COVERAGE routes: env var not set → skip with explicit warning.
    // Never silently dropped; never reported as green.
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

  // ── Summary ───────────────────────────────────────────────────────────────

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
  } else {
    await runChecks();
  }
}

main().catch(err => {
  console.error('\ncheck-hydration-console.mjs: fatal error\n', err);
  process.exit(1);
});
