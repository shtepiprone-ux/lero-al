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
// Returns { checked, violations[], cleared[] }. A "violation"/"cleared" entry names both the
// blocked element and the element that actually intercepted the click (R4's explicit requirement
// — "print the blocked element and the intercepting element ... because 'something blocks
// clicks' without naming the blocker is what made this defect survive a month").
//
// All DOM-touching helpers below are defined INSIDE each `page.evaluate()` callback (Playwright
// serializes the callback and runs it in the browser's own context — a module-level function
// declared in this Node process is not reachable from inside it, so every helper the browser side
// needs must be a nested function in the same closure, matching this file's existing convention).
//
// Task 725 R5a — fixed two diagnostic defects found while root-causing the bottom-nav collision:
//   1. `(el.className ?? '').toString()` yields the literal string `"[object SVGAnimatedString]"`
//      for SVG elements (`className` on an SVG element is an `SVGAnimatedString`, not a string).
//      `el.getAttribute('class')` reads the real attribute regardless of element type.
//   2. The interceptor's own `getBoundingClientRect()` can be a zero-width bbox (e.g. an SVG
//      `<path>`), which does not mean a zero-width hit area — the actual clickable region is
//      whatever `position:fixed`/`sticky` ancestor establishes the stacking context. Every
//      description now also reports `nearestPositionedAncestor` (its own rect/position/z-index)
//      so a reader is not misled by a raw interceptor's bbox.
//
// Task 725 R2a/R2b — transient-vs-permanent overlap. A `position:fixed`/`sticky` interceptor
// (e.g. a bottom nav bar) occupies a viewport-relative band that never moves with scroll; a
// candidate that fails the hit-test at the CURRENT scroll position may still be reachable at a
// DIFFERENT one, if scrolling would move it clear of that band. Computed entirely from measured
// DOM (real rects, real `scrollHeight`/`innerHeight`) — never a component name, story id, route
// path, or author-applied attribute (R2b; Task 724 F1's opt-out test applies verbatim: if a
// developer could make a future failing control pass by adding something to its container, this
// would be an opt-out, not a rule — nothing here is author-applied, it is derived fresh from the
// interceptor's own computed `position` and rect on every run).
//
// Only `position:fixed`/`sticky` interceptors are eligible — a normal document-flow overlap (the
// Task 723 shape this gate was built to catch) moves WITH the page on scroll, so no scroll offset
// changes its relative position to the candidate; treating it as clearable would silently reopen
// exactly the blind spot this gate exists to close.
//
// Geometry: let `elDocTop`/`elDocBottom` be the candidate's DOCUMENT-relative top/bottom (its
// viewport rect plus the current scroll offset — invariant under scrolling). Let `ancRect` be the
// fixed/sticky ancestor's VIEWPORT-relative rect (invariant under scrolling, by definition of
// `position:fixed`; `sticky` is treated as fixed for this purpose since once stuck, it behaves
// identically). A scroll offset `s` clears the candidate from a bottom-anchored band when
// `elDocBottom - s <= ancRect.top` (the candidate has scrolled up above the band) — solved for the
// smallest such `s`. A scroll offset clears a top-anchored band when `elDocTop - s >= ancRect.bottom`
// (scrolling up moves the candidate below/away from the band) — solved for the largest such `s`.
// Both candidate offsets are clamped to `[0, maxScrollY]` (`document.documentElement.scrollHeight -
// window.innerHeight`, floored at 0) — a candidate offset outside the page's real scrollable range
// is not reachable and is discarded, which is exactly what makes a permanent trailing-edge
// occlusion (content flush with the document's end, with no clearance before it) correctly stay
// unclearable: the required offset would exceed `maxScrollY`.

async function hitTestPage(page) {
  const startScrollY = await page.evaluate(() => window.scrollY);

  // Phase 1 — hit-test at the current (start) scroll position; for any failure whose interceptor's
  // nearest positioned ancestor is fixed/sticky, compute candidate clearing offsets from measured
  // DOM (never guessed).
  const phase1 = await page.evaluate(
    ({ selector, overlaySelector }) => {
      function realClass(el) {
        const attr = el.getAttribute && el.getAttribute('class');
        return attr ?? '';
      }
      function nearestPositionedAncestorOf(el) {
        let p = el.parentElement;
        while (p) {
          if (window.getComputedStyle(p).position !== 'static') return p;
          p = p.parentElement;
        }
        return null;
      }
      function describe(el) {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);
        const ancestor = nearestPositionedAncestorOf(el);
        let nearestPositionedAncestor = null;
        if (ancestor) {
          const aRect = ancestor.getBoundingClientRect();
          const aCs = window.getComputedStyle(ancestor);
          nearestPositionedAncestor = {
            tag: ancestor.tagName.toLowerCase(),
            class: realClass(ancestor).slice(0, 120),
            rect: { x: Math.round(aRect.x), y: Math.round(aRect.y), width: Math.round(aRect.width), height: Math.round(aRect.height) },
            position: aCs.position,
            zIndex: aCs.zIndex,
          };
        }
        return {
          tag: el.tagName.toLowerCase(),
          class: realClass(el).slice(0, 120),
          text: (el.textContent ?? '').trim().slice(0, 40),
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
          position: cs.position,
          zIndex: cs.zIndex,
          nearestPositionedAncestor,
        };
      }
      function computeClearingOffsetCandidates(elRect, ancRect, maxScrollY) {
        const elDocTop = elRect.top + window.scrollY;
        const elDocBottom = elRect.bottom + window.scrollY;
        const offsets = [];
        const sClearBelow = elDocBottom - ancRect.top;
        if (sClearBelow >= 0 && sClearBelow <= maxScrollY) offsets.push(Math.min(maxScrollY, Math.ceil(sClearBelow) + 1));
        const sClearAbove = elDocTop - ancRect.bottom;
        if (sClearAbove >= 0 && sClearAbove <= maxScrollY) offsets.push(Math.max(0, Math.floor(sClearAbove) - 1));
        return offsets;
      }

      const candidates = Array.from(document.querySelectorAll(selector));
      let checked = 0;
      const results = [];
      const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

      for (let i = 0; i < candidates.length; i++) {
        const el = candidates[i];
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;

        const cx = rect.x + rect.width / 2;
        const cy = rect.y + rect.height / 2;
        if (cx < 0 || cy < 0 || cx >= window.innerWidth || cy >= window.innerHeight) continue;

        checked++;
        const hit = document.elementFromPoint(cx, cy);
        if (!hit) {
          results.push({ kind: 'violation', element: describe(el), interceptor: null, reason: 'elementFromPoint returned null inside the viewport' });
          continue;
        }
        if (hit === el || el.contains(hit) || hit.contains(el)) continue;

        // N6 — genuinely intentional overlay exemption (Mantine Modal/Drawer backdrop).
        if (hit.closest(overlaySelector)) continue;

        const ancestor = nearestPositionedAncestorOf(hit);
        const ancPos = ancestor ? window.getComputedStyle(ancestor).position : null;
        if (ancestor && (ancPos === 'fixed' || ancPos === 'sticky')) {
          const ancRect = ancestor.getBoundingClientRect();
          const offsets = computeClearingOffsetCandidates(rect, ancRect, maxScrollY);
          if (offsets.length > 0) {
            results.push({
              kind: 'candidate-transient',
              element: describe(el),
              interceptor: describe(hit),
              candidateOffsets: offsets,
              selectorIndex: i,
            });
            continue;
          }
        }

        results.push({ kind: 'violation', element: describe(el), interceptor: describe(hit) });
      }

      return { checked, results, maxScrollY };
    },
    { selector: CANDIDATE_SELECTOR, overlaySelector: INTENTIONAL_OVERLAY_SELECTOR }
  );

  const violations = phase1.results.filter((r) => r.kind === 'violation');
  const transientCandidates = phase1.results.filter((r) => r.kind === 'candidate-transient');
  const cleared = [];

  // Phase 2 — for each transient candidate, actually scroll to its computed offset and re-hit-test
  // there (real measurement, not just the geometry that produced the candidate offset). The first
  // offset that clears it wins; if none do, it reverts to a real violation.
  for (const tc of transientCandidates) {
    let resolvedOffset = null;
    for (const offset of tc.candidateOffsets) {
      const recheck = await page.evaluate(
        ({ selector, selectorIndex, offset, overlaySelector }) => {
          // `behavior: 'instant'` deliberately overrides any page-level `scroll-behavior: smooth`
          // CSS (confirmed present on this project's `<html>`) — a smooth scroll animates
          // asynchronously, so a synchronous re-read immediately after a bare `scrollTo(x, y)`
          // captures the PRE-scroll rect, silently making every candidate offset look uncleared.
          window.scrollTo({ top: offset, left: 0, behavior: 'instant' });
          const el = Array.from(document.querySelectorAll(selector))[selectorIndex];
          if (!el) return { cleared: false };
          const rect = el.getBoundingClientRect();
          const cx = rect.x + rect.width / 2;
          const cy = rect.y + rect.height / 2;
          if (cx < 0 || cy < 0 || cx >= window.innerWidth || cy >= window.innerHeight) return { cleared: false, offscreen: true };
          const hit = document.elementFromPoint(cx, cy);
          if (!hit) return { cleared: false };
          if (hit === el || el.contains(hit) || hit.contains(el)) return { cleared: true };
          if (hit.closest(overlaySelector)) return { cleared: true };
          return { cleared: false };
        },
        { selector: CANDIDATE_SELECTOR, selectorIndex: tc.selectorIndex, offset, overlaySelector: INTENTIONAL_OVERLAY_SELECTOR }
      );
      if (recheck.cleared) {
        resolvedOffset = offset;
        break;
      }
    }
    if (resolvedOffset !== null) {
      cleared.push({ element: tc.element, interceptor: tc.interceptor, clearingScrollOffset: resolvedOffset });
    } else {
      violations.push({ element: tc.element, interceptor: tc.interceptor, reason: 'no reachable scroll offset cleared it — treated as a real violation' });
    }
  }

  // Restore the page's original scroll position — later candidates in this same call must be
  // measured from the same start state, not wherever phase 2 left off.
  await page.evaluate((y) => window.scrollTo({ top: y, left: 0, behavior: 'instant' }), startScrollY);

  return { checked: phase1.checked, violations, cleared };
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

// Task 725 R12 — two more fixtures, added to prove the transient-vs-permanent redesign against a
// controlled, deterministic, CI-safe page rather than the live homepage (whose exact geometry
// shifts with content/translations). Both plant a `position:fixed` bottom bar 60px tall covering
// the last 60px of a 300px-tall viewport, with a real button positioned at `top:250px` — inside
// the bar's band at scroll=0 in both cases. The bar's own child `<span>` (not the bar div itself)
// is what actually receives the click, so `elementFromPoint` returns a STATIC descendant whose
// nearest positioned ancestor is the fixed bar — the same shape the real bottom-nav collision has
// (a static `<path>` icon inside a `position:fixed` `<nav>`), not the bar itself being the hit
// target. The only difference between the two fixtures is total page height, which is exactly
// what determines whether a clearing scroll offset exists:
//   - `TRANSIENT_PAGE_HTML`: `body` is 2000px tall (`maxScrollY = 2000 - 300 = 1700`) — scrolling
//     down ~51px moves the button clear of the bar. Must resolve as CLEARED, not a violation.
//   - `PERMANENT_PAGE_HTML`: `body` is exactly 300px tall, matching the viewport (`maxScrollY =
//     0`) — there is no scroll offset at all, so the button can never clear the bar. Must FAIL.
const TRANSIENT_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (transient overlap)</title></head>
<body style="margin:0;height:2000px;position:relative;">
  <button id="target" style="position:absolute;top:250px;left:40px;width:120px;height:40px;">Click me</button>
  <div id="fixed-bar" style="position:fixed;bottom:0;left:0;right:0;height:60px;">
    <span style="display:block;width:100%;height:100%;"></span>
  </div>
</body>
</html>`;

const PERMANENT_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (permanent occlusion)</title></head>
<body style="margin:0;height:300px;position:relative;">
  <button id="target" style="position:absolute;top:250px;left:40px;width:120px;height:40px;">Click me</button>
  <div id="fixed-bar" style="position:fixed;bottom:0;left:0;right:0;height:60px;">
    <span style="display:block;width:100%;height:100%;"></span>
  </div>
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
  const pages = { violation: null, clean: null, overlayExempt: null, transient: null, permanent: null };
  const baseUrl = await new Promise((res, rej) => {
    server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (req.url === '/violation') res.end(VIOLATION_PAGE_HTML);
      else if (req.url === '/overlay-exempt') res.end(OVERLAY_EXEMPT_PAGE_HTML);
      else if (req.url === '/transient') res.end(TRANSIENT_PAGE_HTML);
      else if (req.url === '/permanent') res.end(PERMANENT_PAGE_HTML);
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
    // Task 725 R12 — arm ② (transient) and arm ① (permanent). Both plant an identical fixed
    // bottom bar over an identically-positioned button; only the page's total scrollable height
    // differs, which is exactly what should decide clearable vs. not.
    { url: `${baseUrl}/transient`, label: 'R12 arm② — fixed bar, tall page (scroll clears it)', expectFail: false, expectCleared: true },
    { url: `${baseUrl}/permanent`, label: 'R12 arm① — fixed bar, page height == viewport (no scroll offset exists)', expectFail: true },
  ];

  let allOk = true;
  for (const c of cases) {
    await page.goto(c.url, { waitUntil: 'domcontentloaded' });
    const result = await hitTestPage(page);
    const failed = result.violations.length > 0;
    const clearedOk = c.expectCleared ? result.cleared.length > 0 : true;
    const ok = failed === c.expectFail && clearedOk;
    console.log(`   ${ok ? '✅' : '❌'} ${c.label}: checked=${result.checked}, violations=${result.violations.length}, cleared=${result.cleared.length} (expected ${c.expectFail ? 'violations>0' : c.expectCleared ? 'cleared>0, violations=0' : 'violations=0'})`);
    if (failed) {
      for (const v of result.violations) {
        console.log(`      blocked: ${v.element.tag}.${v.element.class} @ (${v.element.rect.x},${v.element.rect.y})`);
        console.log(`      interceptor: ${v.interceptor?.tag}.${v.interceptor?.class}`);
        if (v.reason) console.log(`      reason: ${v.reason}`);
      }
    }
    if (result.cleared.length > 0) {
      for (const cl of result.cleared) {
        console.log(`      cleared: ${cl.element.tag}.${cl.element.class} @ scrollY=${cl.clearingScrollOffset}`);
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
        result = { checked: 0, violations: [], cleared: [], error: String(err.message ?? err).slice(0, 200) };
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
          if (v.reason) console.log(`      reason:       ${v.reason}`);
        }
      } else if (cell.cleared.length > 0) {
        console.log(`   ${route} × ${vp.name}: ✅ PASS (${cell.cleared.length} transient, scroll-cleared) — checked=${cell.checked}`);
        for (const c of cell.cleared) {
          console.log(`      cleared:      <${c.element.tag} class="${c.element.class}"> "${c.element.text}" @ scrollY=${c.clearingScrollOffset} (fixed/sticky interceptor <${c.interceptor.tag} class="${c.interceptor.class}">, nearest positioned ancestor: <${c.interceptor.nearestPositionedAncestor?.tag ?? '?'} class="${c.interceptor.nearestPositionedAncestor?.class ?? '?'}"> @ (${c.interceptor.nearestPositionedAncestor?.rect?.x},${c.interceptor.nearestPositionedAncestor?.rect?.y} ${c.interceptor.nearestPositionedAncestor?.rect?.width}x${c.interceptor.nearestPositionedAncestor?.rect?.height}))`);
        }
      } else {
        console.log(`   ${route} × ${vp.name}: ✅ PASS — checked=${cell.checked}, 0 interceptions`);
      }
    }
  }

  await browser.close();

  const totalChecked = cells.reduce((s, c) => s + c.checked, 0);
  const totalViolations = cells.reduce((s, c) => s + c.violations.length, 0);
  const totalCleared = cells.reduce((s, c) => s + c.cleared.length, 0);

  console.log('\n── Summary ──────────────────────────────────────────────────');
  console.log(`   Cells: ${cells.length}  Elements checked: ${totalChecked}  Interceptions: ${totalViolations}  Cleared (transient): ${totalCleared}  Empty-candidate cells: ${emptyCandidateCells}`);

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
