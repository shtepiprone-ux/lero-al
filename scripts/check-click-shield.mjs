#!/usr/bin/env node
/**
 * check-click-shield.mjs — Playwright-based hit-test gate for click-blocking overlays.
 *
 * WHY THIS GATE EXISTS:
 *   Task 684 (081c03e7f) added a component-level `top` prop to Mantine's `<Notifications>` to
 *   clear the sticky site header. Mantine applies that prop to `.mantine-Notifications-root`
 *   UNQUALIFIED by `[data-position]`, reaching all SIX position containers Mantine renders
 *   (top-left/center/right, bottom-left/center/right) — not just the one visually in use. The
 *   three bottom-* containers already carry Mantine's own `bottom: var(--mantine-spacing-md)`
 *   (`:where([data-position='bottom-*'])`), so the added `top` pinned BOTH edges and stretched
 *   each one to full viewport height. No CSS in the project ever set `pointer-events` on that
 *   root, so the container was click-solid by default — three invisible ~440px-wide panels swallowed
 *   most clicks on the homepage in production for a month before detection (P0, Task 723,
 *   2026-08-06; see docs/sessions/2026-08-06-task723-notifications-click-shield.md).
 *
 *   No existing gate ever called `document.elementFromPoint()` against a real interactive
 *   element — `check-stories-rendered.mjs` asserts layout geometry (widths, overflow) but never
 *   hit-tests whether the pixel a control occupies actually routes clicks to that control. This
 *   gate closes that blind spot generally: it would catch ANY element silently sitting on top of
 *   an interactive control, not only this specific Notifications regression.
 *
 * WHAT IT CHECKS (per MANTINE_VIEWPORTS width x per LOCALES locale, against a running app):
 *   1. Collects every `a, button, [role="button"], input, select` with a non-zero rect whose
 *      own center point falls inside the viewport.
 *   2. Calls `document.elementFromPoint()` at each candidate's own center.
 *   3. FAILs a candidate when the returned node is neither the candidate itself, nor a
 *      descendant of it, nor an ancestor of it — i.e. some other element is what a real click at
 *      that pixel would actually hit.
 *   4. N6 exemption — a genuinely intentional overlay: an interceptor that IS, or descends from,
 *      `.mantine-Overlay-root` (Mantine's shared Modal/Drawer backdrop primitive — every Mantine
 *      overlay composes this one component, verified against
 *      node_modules/@mantine/core/esm/components/Overlay/Overlay.mjs) is NOT reported as a
 *      defect: a modal/drawer is SUPPOSED to intercept background clicks while open. This is a
 *      mechanism only. Whether the gate becomes blocking in CI for routes that open a modal by
 *      default is an owner policy decision, not exercised by this task's homepage-only proof
 *      (OQ3, tasks/Sprints/Sprint_52_kickoff_prompt_Task_723_NotificationsClickShield.md).
 *   5. Hard-errors (exit 2, never a silent exit 0) if any single cell checks zero candidates —
 *      the same empty-candidate-set guard `check-stories-rendered.mjs` already applies
 *      (`mantineStories.length === 0` check) — a run that "checked nothing" must not read as a
 *      clean pass.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 npm run check:click-shield         — full homepage sweep
 *   BASE_URL=http://localhost:3000 npm run check:click-shield -- --route=/en   — single route
 *   npm run check:click-shield:verify                                — planted-violation self-test
 *                                                                        (no server needed, CI-safe)
 *
 * First run — install Playwright browsers: npx playwright install chromium
 *
 * Added by Task 723 (Sprint 52, P0, 2026-08-06).
 */

import { createServer } from 'node:http';

const args = process.argv.slice(2);
const VERIFY_GATE = args.includes('--verify-gate');
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const routeArg = args.find((a) => a.startsWith('--route='));
const SINGLE_ROUTE = routeArg ? routeArg.slice('--route='.length) : null;

// Crash guard — always exit with a controlled integer code, never -1 (Task 723, same convention
// as check-stories-rendered.mjs).
process.on('uncaughtException', (err) => {
  console.error('❌ check-click-shield: uncaughtException — exiting with code 2');
  console.error(err);
  process.exit(2);
});

// ── Shared matrix (Task 723) ──────────────────────────────────────────────────
//
// Deliberately the SAME 4 cells as MANTINE_VIEWPORTS in check-stories-rendered.mjs:392 (not
// re-exported from there — that file is a Storybook-only harness with no shared module boundary
// to import from; duplicated here as plain data, same values, same names).
const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 812 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1024', width: 1024, height: 768 },
];

const LOCALES = ['sq', 'en', 'uk', 'it'];

const CANDIDATE_SELECTOR = 'a, button, [role="button"], input, select';

// Mantine's shared Overlay primitive backs every Modal/Drawer backdrop (verified against
// node_modules/@mantine/core/esm/components/Overlay/Overlay.mjs — getStyles("root") emits the
// stable `.mantine-Overlay-root` class). N6 exemption target.
const INTENTIONAL_OVERLAY_SELECTOR = '.mantine-Overlay-root';

// ── Core hit-test, runs inside the page ────────────────────────────────────────
//
// Returns { checked, violations[] }. A "violation" names both the blocked element and the
// element that actually intercepted the click (R4's explicit requirement — "print the blocked
// element and the intercepting element ... because 'something blocks clicks' without naming the
// blocker is what made this defect survive a month").
function describeElement(el) {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    class: (el.className ?? '').toString().slice(0, 120),
    text: (el.textContent ?? '').trim().slice(0, 40),
    rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
  };
}

async function hitTestPage(page) {
  return page.evaluate(
    ({ selector, overlaySelector }) => {
      function describe(el) {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          class: (el.className ?? '').toString().slice(0, 120),
          text: (el.textContent ?? '').trim().slice(0, 40),
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        };
      }

      const candidates = Array.from(document.querySelectorAll(selector));
      let checked = 0;
      const violations = [];

      for (const el of candidates) {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;

        const cx = rect.x + rect.width / 2;
        const cy = rect.y + rect.height / 2;
        if (cx < 0 || cy < 0 || cx >= window.innerWidth || cy >= window.innerHeight) continue;

        checked++;
        const hit = document.elementFromPoint(cx, cy);
        if (!hit) {
          violations.push({ element: describe(el), interceptor: null, reason: 'elementFromPoint returned null inside the viewport' });
          continue;
        }
        if (hit === el || el.contains(hit) || hit.contains(el)) continue;

        // N6 — genuinely intentional overlay exemption (Mantine Modal/Drawer backdrop).
        if (hit.closest(overlaySelector)) continue;

        violations.push({ element: describe(el), interceptor: describe(hit) });
      }

      return { checked, violations };
    },
    { selector: CANDIDATE_SELECTOR, overlaySelector: INTENTIONAL_OVERLAY_SELECTOR }
  );
}

// ── Planted-violation self-test (--verify-gate) ────────────────────────────────
//
// CI-safe, no server/build needed. Proves the gate is not a no-op by serving a tiny local page
// that reproduces the EXACT defect shape: a full-viewport, default-pointer-events div (standing
// in for the pre-fix `.mantine-Notifications-root`) painted on top of a real button.
const VIOLATION_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test</title></head>
<body style="margin:0">
  <button id="target" style="position:absolute;top:40px;left:40px;width:120px;height:40px;">Click me</button>
  <div id="shield" style="position:fixed;inset:0;background:transparent;"></div>
</body>
</html>`;

const CLEAN_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (clean)</title></head>
<body style="margin:0">
  <button id="target" style="position:absolute;top:40px;left:40px;width:120px;height:40px;">Click me</button>
</body>
</html>`;

const OVERLAY_EXEMPT_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (overlay-exempt)</title></head>
<body style="margin:0">
  <button id="target" style="position:absolute;top:40px;left:40px;width:120px;height:40px;">Click me</button>
  <div class="mantine-Overlay-root" style="position:fixed;inset:0;background:transparent;"></div>
</body>
</html>`;

async function runGateSelfTest() {
  console.log('\n🔬 Click-shield gate self-test (--verify-gate)');
  console.log('   Purpose: prove the gate is NOT a no-op by planting the Task 723 defect shape.\n');

  const { chromium } = await import('playwright').catch(() => {
    console.error('playwright not installed — run: npm install');
    process.exit(1);
  });

  let server;
  const pages = { violation: null, clean: null, overlayExempt: null };
  const baseUrl = await new Promise((res, rej) => {
    server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (req.url === '/violation') res.end(VIOLATION_PAGE_HTML);
      else if (req.url === '/overlay-exempt') res.end(OVERLAY_EXEMPT_PAGE_HTML);
      else res.end(CLEAN_PAGE_HTML);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      res(`http://127.0.0.1:${port}`);
    });
    server.on('error', rej);
  });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });

  const cases = [
    { url: `${baseUrl}/violation`, label: 'Planted shield (transparent div over a button)', expectFail: true },
    { url: `${baseUrl}/clean`, label: 'Clean page (no shield)', expectFail: false },
    { url: `${baseUrl}/overlay-exempt`, label: 'N6 exemption (mantine-Overlay-root shield)', expectFail: false },
  ];

  let allOk = true;
  for (const c of cases) {
    await page.goto(c.url, { waitUntil: 'domcontentloaded' });
    const result = await hitTestPage(page);
    const failed = result.violations.length > 0;
    const ok = failed === c.expectFail;
    console.log(`   ${ok ? '✅' : '❌'} ${c.label}: checked=${result.checked}, violations=${result.violations.length} (expected ${c.expectFail ? '>0' : '0'})`);
    if (failed) {
      for (const v of result.violations) {
        console.log(`      blocked: ${v.element.tag}.${v.element.class} @ (${v.element.rect.x},${v.element.rect.y})`);
        console.log(`      interceptor: ${v.interceptor?.tag}.${v.interceptor?.class}`);
      }
    }
    if (!ok) allOk = false;
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  if (allOk) {
    console.log('\n✅ GATE IS FUNCTIONAL — planted shield detected, clean page passes, N6 overlay exemption works.\n');
    process.exit(0);
  } else {
    console.error('\n❌ GATE SELF-TEST FAILED — see mismatches above. This is a gate defect.\n');
    process.exit(1);
  }
}

// ── Main: check routes on a running app server ─────────────────────────────────

async function runChecks() {
  const { chromium } = await import('playwright').catch(() => {
    console.error('playwright not installed — run: npm install');
    process.exit(1);
  });

  const routes = SINGLE_ROUTE ? [SINGLE_ROUTE] : LOCALES.map((l) => `/${l}`);

  console.log('\n🔍 Click-shield hit-test gate');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Routes: ${routes.join(', ')}`);
  console.log(`   Viewports: ${VIEWPORTS.map((v) => v.name).join(', ')}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const cells = [];
  let emptyCandidateCells = 0;

  for (const route of routes) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const url = `${BASE_URL}${route}`;
      let result;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(500);
        result = await hitTestPage(page);
      } catch (err) {
        result = { checked: 0, violations: [], error: String(err.message ?? err).slice(0, 200) };
      } finally {
        await page.close();
      }

      const cell = { route, viewport: vp.name, width: vp.width, ...result };
      cells.push(cell);

      if (cell.checked === 0) {
        emptyCandidateCells++;
        console.log(`   ${route} × ${vp.name}: ❌ EMPTY CANDIDATE SET (checked=0)${cell.error ? ` — ${cell.error}` : ''}`);
      } else if (cell.violations.length > 0) {
        console.log(`   ${route} × ${vp.name}: ❌ FAIL — checked=${cell.checked}, ${cell.violations.length} interception(s)`);
        for (const v of cell.violations) {
          console.log(`      blocked:      <${v.element.tag} class="${v.element.class}"> "${v.element.text}" @ (${v.element.rect.x},${v.element.rect.y} ${v.element.rect.width}x${v.element.rect.height})`);
          console.log(`      interceptor:  <${v.interceptor?.tag ?? '?'} class="${v.interceptor?.class ?? '?'}"> @ (${v.interceptor?.rect?.x},${v.interceptor?.rect?.y} ${v.interceptor?.rect?.width}x${v.interceptor?.rect?.height})`);
        }
      } else {
        console.log(`   ${route} × ${vp.name}: ✅ PASS — checked=${cell.checked}, 0 interceptions`);
      }
    }
  }

  await browser.close();

  const totalChecked = cells.reduce((s, c) => s + c.checked, 0);
  const totalViolations = cells.reduce((s, c) => s + c.violations.length, 0);

  console.log('\n── Summary ──────────────────────────────────────────────────');
  console.log(`   Cells: ${cells.length}  Elements checked: ${totalChecked}  Interceptions: ${totalViolations}  Empty-candidate cells: ${emptyCandidateCells}`);

  if (emptyCandidateCells > 0) {
    console.error('\n❌ At least one cell checked ZERO candidates — this is a harness failure, not a clean pass.');
    console.error('   A run that verified nothing must not exit 0 (agent-contract clause 9 / R4).\n');
    process.exit(2);
  }

  if (totalViolations > 0) {
    console.error(`\n❌ ${totalViolations} click-shield interception(s) found — see details above.\n`);
    process.exit(1);
  }

  console.log('\n✅ No click-shield interceptions detected.\n');
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

main().catch((err) => {
  console.error('\ncheck-click-shield.mjs: fatal error\n', err);
  process.exit(2);
});
