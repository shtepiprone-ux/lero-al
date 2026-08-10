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
const scenarioArg = args.find((a) => a.startsWith('--scenario='));
// Task 727 R5/R6 — no flag = every scenario, full 16-cell matrix each (the actual
// `npm run check:click-shield` invocation the CI job in R7 runs). `--scenario=` narrows to one,
// for local debugging and for producing the per-scenario evidence logs this task's checkpoints
// require (K3-modal.log / K4-drawer.log) without re-running the other two.
const SINGLE_SCENARIO = scenarioArg ? scenarioArg.slice('--scenario='.length) : null;

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

// Task 727 R1 — every currently-live dialog surface (Modal.Content, Drawer.Content) renders
// role="dialog"; role="alertdialog" is covered by the same rule per the owner decision (§3.1
// OQ3) even though nothing in this repo renders it today (confirmed 2026-08-09 —
// `grep -rc alertdialog src/` returns 0). Implemented, not exercised live.
const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]';

// Task 727 R1/R2 — the contextual N6 predicate, written ONCE here and reconstructed identically
// inside BOTH hit-test page.evaluate() closures below (phase-1 direct path, formerly :223; phase-2
// scroll-recheck path, formerly :276) via `new Function(...)`. Playwright serializes each
// page.evaluate() callback independently — a Node-side function declared in this module is not
// reachable inside the browser context, so a plain shared JS function cannot be called from both
// closures directly (this file's existing convention already duplicates its DOM helpers for the
// identical reason, see the hitTestPage docstring above). Passing this identical string as an
// evaluate() argument and rebuilding the function from it at both sites is what makes the two
// call sites agree BY CONSTRUCTION rather than by two hand-copied blocks that can drift apart
// (the Task 725 §14.9.29 lesson: the scroll path and the direct path must not merely resemble
// each other).
//
// The rule (owner decision, Task 727 kickoff §3.1, closing OQ3, quoted verbatim): a backdrop MAY
// still exempt a candidate that sits OUTSIDE any active dialog — a modal/drawer intentionally
// intercepts background-page clicks while open, and that remains allowed. A candidate INSIDE an
// active [role="dialog"]/[role="alertdialog"] is NEVER exempt by this rule: if the interceptor at
// that pixel is (or descends from) the overlay backdrop, the dialog's own backdrop is eating its
// own control, which is the exact defect this task exists to catch (confirmed in source, kickoff
// §3.2 — the prior unconditional form tested only the interceptor, never where the candidate
// itself sat). Keyed entirely on measured DOM structure (`Element.closest()` against a real
// rendered role attribute) — never a component name, route, or author-appliable class (Task 724
// F1: an exemption an author can produce by adding something to their own markup is an opt-out,
// not a rule; role="dialog" is Mantine's own accessibility contract for these primitives, not
// something a consumer opts into per-instance to silence this gate).
// Task 727 R1/R4 — driving a real Drawer live (session evidence, K4-drawer.log first pass)
// proved the interceptor side of this rule cannot stay `.mantine-Overlay-root` alone: a real
// open Drawer/Modal's own PANEL content (its header, its form fields — never just the semi-
// transparent backdrop div) routinely paints over background-page elements too, especially the
// mobile bottom-sheet variant, which can cover most of the viewport. Exempting only backdrop hits
// reddened 136/324 candidates across a single 16-cell real-Drawer sweep — entirely background
// elements the Drawer's panel visually sits on top of, not a single one of them reachable by a
// real user while the Drawer is open. That is exactly the "turns every open modal red" failure R4
// exists to prevent (N6's own warning: an unconditional-in-the-other-direction gate "will be
// switched off within a week"). The interceptor side of the exemption therefore matches EITHER
// the backdrop OR the active dialog's own content — an open dialog legitimately owns everything
// it visually covers, backdrop or panel. The candidate side is unchanged and is what actually
// implements R1/R3: a candidate INSIDE the dialog is never exempt, regardless of which of the two
// the interceptor is (even the backdrop intercepting the dialog's own control is a violation).
const N6_EXEMPT_PREDICATE_BODY = `
  var hitIsOverlaySystem = !!(hit.closest(overlaySelector) || hit.closest(dialogSelector));
  if (!hitIsOverlaySystem) return false;
  return el.closest(dialogSelector) === null;
`;

// Task 727 R5 — the real listing this repository has today for the Modal scenario (verified live
// 2026-08-09: `/en/listings/11-mr7ucly4` renders `.listing-gallery` with 5 images and its cover
// opens `LightboxView`, a real Modal.Root/Modal.Content role="dialog"). The Task 612 fixture slug
// (`test-7-molyl9c8`, used by scripts/task612-qa-listinggallery-lightbox-portal.mjs, 2026-07-16)
// no longer resolves — confirmed 404 today — so listing slugs are not a stable long-term fixture;
// overridable via CLICK_SHIELD_MODAL_SLUG for whoever next needs to replace this one. See the
// Task 727 session log for the full repository search this scenario choice is based on: NO
// production Mantine Modal is reachable from the homepage at all — MantineModal
// (design-system/mantine/patterns/MantineModal.tsx) has zero production consumers, so the
// homepage-only route set this gate used before this task cannot exercise a Modal scenario.
const MODAL_SCENARIO_SLUG = process.env.CLICK_SHIELD_MODAL_SLUG ?? '11-mr7ucly4';

// Task 727 R5 — three real scenarios driven against the running app (replacing the synthetic
// self-test as the source of "did the fix work" evidence for CI). `trigger` is a Playwright
// locator clicked before the hit-test runs; `null` for the untouched base scenario. Every
// triggered scenario's cell is a HARD FAILURE (see openScenarioOverlay below) if the trigger
// cannot be found/clicked or `[role="dialog"]` never appears — a scenario that silently failed to
// open the overlay would report zero violations and look exactly like a clean pass, which is the
// false-success shape this task's own kickoff (A2) pre-declares as the likeliest way this work
// goes wrong.
const SCENARIOS = [
  {
    name: 'base',
    label: 'Base route (untouched)',
    route: (locale) => `/${locale}`,
    trigger: null,
  },
  {
    name: 'drawer',
    label: 'AuthSheet open (Mantine Drawer, role="dialog")',
    // AuthSheet (src/modules/auth/components/AuthSheet.tsx) is a real controlled MantineDrawer
    // mounted globally via Header.tsx on every route, including the homepage. Its trigger is the
    // header Favorites heart ActionIcon — the ONE control in HeaderActions that opens it and
    // stays visible at every click-shield viewport while logged out (the header's own
    // login/register Buttons are `visibleFrom="md"`, invisible at 320/375/390 — see
    // HeaderActions.tsx). Selector keys on lucide's stable icon class, not the translated
    // aria-label, so it works identically across all 4 locales.
    route: (locale) => `/${locale}`,
    trigger: 'header button:has(svg.lucide-heart)',
  },
  {
    name: 'modal',
    label: 'Listing lightbox open (Mantine Modal, role="dialog")',
    // LightboxView (src/modules/listings/components/LightboxView.tsx) — the ONLY production
    // Mantine Modal (Modal.Root/Modal.Content, role="dialog") in the app. Reuses the Task 612
    // precedent (scripts/task612-qa-listinggallery-lightbox-portal.mjs) for driving this exact
    // component against a real listing rather than inventing a synthetic fixture for it.
    route: (locale) => `/${locale}/listings/${MODAL_SCENARIO_SLUG}`,
    trigger: '.listing-gallery .cursor-zoom-in',
  },
];

// Opens a scenario's trigger (if any) and proves `[role="dialog"]`/`[role="alertdialog"]` is
// genuinely present in the DOM before the caller hit-tests — never inferred from "the click
// didn't throw". Returns `dialogPresent: false` (a hard scenario failure at the call site, not a
// soft skip) when the trigger is missing, unclickable, or no dialog appears in time.
async function openScenarioOverlay(page, scenario) {
  if (!scenario.trigger) return { opened: true, dialogPresent: false, error: null };
  const trigger = page.locator(scenario.trigger).first();
  if ((await trigger.count()) === 0) {
    return { opened: false, dialogPresent: false, error: `trigger not found: ${scenario.trigger}` };
  }
  try {
    await trigger.click({ timeout: 10000 });
    await page.waitForSelector(DIALOG_SELECTOR, { timeout: 5000 });
  } catch (err) {
    return { opened: false, dialogPresent: false, error: String(err.message ?? err).slice(0, 200) };
  }
  await page.waitForTimeout(300);
  const dialogPresent = await page.evaluate((sel) => !!document.querySelector(sel), DIALOG_SELECTOR);
  return { opened: true, dialogPresent, error: null };
}

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
// viewport rect plus the current scroll offset — invariant under scrolling). Let `occluderRect` be
// the VIEWPORT-relative EXTENT of the candidate's nearest fixed/sticky ancestor — that ancestor's
// own rect, unioned with the rect of every one of its descendants that is actually hit-testable and
// overflows it (`computeAncestorExtent`/`isHitTestableForExtent`, Task 740, corrected C1, plural).
// Two prior, narrower boxes each undershot in one direction: the ancestor's rect alone undershoots
// when an overflowing descendant OVERHANGS it (`.fabLink`'s `margin-top:-12px` extends it above
// `.navBar`, 729's 6 false positives — Task 739's fix); `union(hit, ancestor)` (Task 739, as landed)
// still undershoots whenever the TRUE overhanging descendant is not the one `elementFromPoint`
// happened to report as `hit` — `.fabLink` blocks all six footer identities but was only `hit` in
// two of them, so four candidates re-landed on `.fabLink` regardless (Task 740's own census). The
// full extent is correct because it does not depend on which single descendant `hit` happened to
// be — measured against the landed `union(hit, ancestor)` box on all four real survivors, 3 runs
// each, before adopting this (docs/sessions/2026-08-09-task740-clickshield-system-extent.md, R1).
// Non-hit-testable overflow (`pointer-events:none`, `visibility:hidden`, `display:none`, zero-area)
// is excluded by construction — an unfiltered union-everything rule would over-extend the box,
// generate an offset past `maxScrollY`, and get it discarded, turning a genuinely clearable
// candidate into a reported-permanent one (R6's over-extension control fixture proves this both
// ways). `occluderRect` is invariant under scrolling because every rect it unions is a descendant of
// the fixed/sticky ancestor with no other scroll container between them, exactly as scroll-invariant
// as the ancestor itself — `sticky` is treated as fixed for this purpose since this app's one sticky
// element (`.site-header`, `top:0`) is the first node in the document and is therefore already in
// its stuck position for every reachable `scrollY`, so it behaves identically to `fixed` across the
// whole scroll range this generator ever runs in (verified 2026-08-09, not merely assumed — OQ1). A
// scroll offset `s` clears the candidate from a bottom-anchored band when
// `elDocBottom - s <= occluderRect.top` (the candidate has scrolled up above the band) — solved for
// the smallest such `s`. A scroll offset clears a top-anchored band when
// `elDocTop - s >= occluderRect.bottom` (scrolling up moves the candidate below/away from the band)
// — solved for the largest such `s`.
// Both candidate offsets are clamped to `[0, maxScrollY]` (`document.documentElement.scrollHeight -
// window.innerHeight`, floored at 0) — a candidate offset outside the page's real scrollable range
// is not reachable and is discarded, which is exactly what makes a permanent trailing-edge
// occlusion (content flush with the document's end, with no clearance before it) correctly stay
// unclearable: the required offset would exceed `maxScrollY`.
//
// Task 729 R3 — below/above-fold band scan. `document.querySelectorAll(selector)` at :330 (now
// inside `runBand` below) already enumerates every candidate in the DOM regardless of scroll
// position; the only thing the pre-729 gate never did was SCROLL anywhere to hit-test the ones
// whose centre fell outside the viewport at scrollY=0. A Task 729 census against the real app
// (docs/sessions/<date>-task729-below-fold-blind-spot.md) found ~900 such candidates on this
// app's homepage/listing pages — real footer navigation links, listing cards, and action buttons,
// not decorative or off-canvas elements — so §7.3's second branch applies: coverage must be
// closed, not just documented.
//
// The chosen mechanism scans the page in bands of one viewport-height each, from the start
// scroll position down to the document's `maxScrollY`, re-running the SAME hit-test loop at each
// band and skipping any candidate index already resolved (checked, violated, or cleared) in an
// earlier band. Cost is proportional to `document.scrollHeight ÷ window.innerHeight` (a handful
// of extra full-page evaluate() passes per cell) — NOT to the excluded-candidate count. The
// rejected alternative was a per-candidate scroll+recheck (reusing phase 2's existing
// `selectorIndex` lookup for every excluded candidate individually): correct, but O(excluded)
// round trips — ~900 extra Playwright IPC calls on this app's pages per full scenario sweep,
// against O(bands) ≈ 4-5 for the band scan. Band-scanning is horizontal-scroll-blind by
// construction (it only calls `window.scrollTo`) — a candidate excluded because it sits to the
// right of the viewport inside a nested horizontally-scrollable container (e.g. a lightbox
// thumbnail strip) stays excluded after every band, which is correct: that is a different
// mechanism (container scroll, not window scroll) and a different, unaddressed gap, named as a
// finding rather than fixed here per R7.

async function hitTestPage(page) {
  const startScrollY = await page.evaluate(() => window.scrollY);
  const { innerHeight, maxScrollY: initialMaxScrollY } = await page.evaluate(() => ({
    innerHeight: window.innerHeight,
    maxScrollY: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
  }));

  const scanOffsets = [startScrollY];
  for (let offset = startScrollY + innerHeight; offset < initialMaxScrollY; offset += innerHeight) {
    scanOffsets.push(offset);
  }
  if (initialMaxScrollY > startScrollY) scanOffsets.push(initialMaxScrollY);

  const resolved = new Set();
  const allResults = [];
  let checked = 0;
  let finalExcluded = [];

  // One hit-test pass at whatever scroll offset the page is currently at, skipping any candidate
  // index already resolved by an earlier band. Identical hit-test logic to the pre-729 single-pass
  // phase 1, generalized to run more than once and to dedupe across runs.
  const runBand = (page_) =>
    page_.evaluate(
      ({ selector, overlaySelector, dialogSelector, predicateBody, resolvedIndices }) => {
        const isN6Exempt = new Function('el', 'hit', 'overlaySelector', 'dialogSelector', predicateBody);
        const resolvedSet = new Set(resolvedIndices);
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
        function computeClearingOffsetCandidates(elRect, occluderRect, maxScrollY) {
          const elDocTop = elRect.top + window.scrollY;
          const elDocBottom = elRect.bottom + window.scrollY;
          const offsets = [];
          const sClearBelow = elDocBottom - occluderRect.top;
          if (sClearBelow >= 0 && sClearBelow <= maxScrollY) offsets.push(Math.min(maxScrollY, Math.ceil(sClearBelow) + 1));
          const sClearAbove = elDocTop - occluderRect.bottom;
          if (sClearAbove >= 0 && sClearAbove <= maxScrollY) offsets.push(Math.max(0, Math.floor(sClearAbove) - 1));
          return offsets;
        }
        // Task 729 — the transient/permanent classification below needs the nearest ancestor that
        // is SPECIFICALLY fixed/sticky, not merely the nearest non-static one.
        // `nearestPositionedAncestorOf` (Task 725, kept above for `describe()`'s informational
        // report) stops at the FIRST non-static ancestor, which is routinely a `position:relative`
        // wrapper (e.g. Mantine's ActionIcon/UnstyledButton root — `position:relative` on every
        // instance, for its own loader overlay) sitting between the interceptor and a genuinely
        // fixed/sticky ancestor (e.g. `.site-header { position: sticky }`) one or more levels
        // further up. That made a real, scroll-clearable header/bottom-nav collision misclassify as
        // a permanent violation — confirmed live (docs/sessions/<date>-task729-*.md) — exposed for
        // the first time by the below-fold band scan, since pre-729 coverage never hit-tested a
        // candidate whose interceptor had this exact ancestor shape. Walks past any number of
        // non-fixed/sticky positioned ancestors; keyed purely on computed `position`, never a
        // component name or author-applied attribute (Task 724 F1).
        function nearestFixedOrStickyAncestorOf(el) {
          let p = el.parentElement;
          while (p) {
            const pos = window.getComputedStyle(p).position;
            if (pos === 'fixed' || pos === 'sticky') return p;
            p = p.parentElement;
          }
          return null;
        }

        // Task 740 R2 — the inclusion rule, as prose: a descendant of the fixed/sticky ancestor
        // counts toward the ancestor's occluding EXTENT only if it can actually receive a real
        // click at its own position — i.e. it is hit-testable. Excluded, each for a stated
        // hit-testing reason (not because exclusion improves any count):
        //   - `pointer-events: none` — the browser's `elementFromPoint`/click dispatch skips these
        //     entirely; a decoration with this property physically cannot intercept a click, however
        //     large its box.
        //   - `visibility: hidden` — removed from hit-testing (and painting) by the CSS spec; present
        //     in the DOM/layout but not clickable.
        //   - `display: none` — not rendered at all; `getBoundingClientRect()` on such an element is
        //     degenerate (zero-area) by construction, listed separately only for clarity.
        //   - zero-area (`width<=0` or `height<=0`) — nothing to hit-test regardless of the above.
        // Every check is computed style or geometry — R3/Task 724 F1: no class name, component name,
        // `data-*` attribute or module hash anywhere in this predicate.
        function isHitTestableForExtent(el) {
          const cs = window.getComputedStyle(el);
          if (cs.pointerEvents === 'none') return false;
          if (cs.visibility === 'hidden') return false;
          if (cs.display === 'none') return false;
          const r = el.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) return false;
          return true;
        }

        // OQ2 — is the extent stable across bands and cells? A fixed/sticky ancestor's descendant
        // structure does not change with scroll (only viewport-relative position does, and every
        // rect read here is viewport-relative already), so the extent is stable across scroll BUT
        // not across cells (different locale/viewport/DOM state, e.g. an open Drawer/Modal, can
        // change which descendants exist or their sizes) — so `extentCache` is scoped to this one
        // `runBand` invocation only (one band, one cell), never persisted across `page.evaluate()`
        // calls. R4 cost: this is O(ancestor's descendant count) the FIRST time a given ancestor is
        // seen in this band, then O(1) for every other candidate that shares it (`.navBar` and
        // `.site-header` are each reused by many candidates within one cell) — cached per ancestor,
        // not recomputed per candidate.
        const extentCache = new Map();
        function computeAncestorExtent(ancestor) {
          if (extentCache.has(ancestor)) return extentCache.get(ancestor);
          const ar = ancestor.getBoundingClientRect();
          let top = ar.top;
          let bottom = ar.bottom;
          const descendants = ancestor.querySelectorAll('*');
          for (let j = 0; j < descendants.length; j++) {
            const d = descendants[j];
            if (!isHitTestableForExtent(d)) continue;
            const dr = d.getBoundingClientRect();
            if (dr.top < top) top = dr.top;
            if (dr.bottom > bottom) bottom = dr.bottom;
          }
          const extent = { top, bottom };
          extentCache.set(ancestor, extent);
          return extent;
        }

        const candidates = Array.from(document.querySelectorAll(selector));
        let checked = 0;
        const results = [];
        const excluded = [];
        const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

        for (let i = 0; i < candidates.length; i++) {
          if (resolvedSet.has(i)) continue;
          const el = candidates[i];
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;

          const cx = rect.x + rect.width / 2;
          const cy = rect.y + rect.height / 2;
          if (cx < 0 || cy < 0 || cx >= window.innerWidth || cy >= window.innerHeight) {
            // Task 729 R1/R2 — still outside the viewport AT THIS BAND. Recorded with identifying
            // detail + document-space position; only the FINAL band's leftover list (a candidate
            // outside the viewport at every scanned band) is reported as genuinely excluded — see
            // the caller. `checked=N` must stop silently implying full-page coverage regardless of
            // which §7.3 branch the measurement selects.
            const reason =
              cy >= window.innerHeight ? 'below-fold' : cy < 0 ? 'above-fold' : cx >= window.innerWidth ? 'right-of-viewport' : 'left-of-viewport';
            excluded.push({
              index: i,
              reason,
              element: describe(el),
              docTop: Math.round(rect.top + window.scrollY),
              docLeft: Math.round(rect.left + window.scrollX),
            });
            continue;
          }

          checked++;
          const hit = document.elementFromPoint(cx, cy);
          if (!hit) {
            results.push({ index: i, kind: 'violation', element: describe(el), interceptor: null, reason: 'elementFromPoint returned null inside the viewport' });
            continue;
          }
          if (hit === el || el.contains(hit) || hit.contains(el)) {
            results.push({ index: i, kind: 'clean' });
            continue;
          }

          // N6 — contextual overlay exemption (Task 727 R1): exempt only when the CANDIDATE sits
          // outside any active dialog. A candidate inside [role="dialog"]/[role="alertdialog"]
          // intercepted by the overlay backdrop is never exempt — see N6_EXEMPT_PREDICATE_BODY.
          if (isN6Exempt(el, hit, overlaySelector, dialogSelector)) {
            results.push({ index: i, kind: 'clean' });
            continue;
          }

          // Task 740 — corrected C1, plural (739's own review note N2): the geometry must bound the
          // fixed/sticky SYSTEM's whole EXTENT — its own rect union every hit-testable descendant
          // that overflows it — not `union(hit, ancestor)`, which covers only the one descendant
          // that happened to be `hit`. `.fabLink` (`.navBar`'s own box starts at 756; `.fabLink`
          // overhangs to 745 via `margin-top:-12px`) is the element that actually blocks all six
          // footer identities — confirmed in 739's own census, `re-lands on .fabLink` in every row —
          // but it is the *reported* `hit` in only two of them; in the other four, `hit` is
          // `.navItem` (757) or `.fabLabel` (792), both themselves inside `.navBar`'s own box, so
          // `union(hit, ancestor)` collapsed to 756 and still undershot by the same ~11px `.fabLink`
          // adds — 739's shipped 4 residual false positives. `nearestFixedOrStickyAncestorOf(hit)`
          // still proves scroll invariance (unchanged justification); `computeAncestorExtent` walks
          // every descendant of that ancestor and unions in only the hit-testable ones
          // (`isHitTestableForExtent`, R2/R3 above) — measured against the landed `union(hit,
          // ancestor)` box on all four real survivors, 3 runs each, before adopting this
          // (docs/sessions/2026-08-09-task740-clickshield-system-extent.md, R1 census): the extent's
          // computed top (745) matches `.fabLink`'s own top exactly and resolves all four survivors
          // `cleared` in all 12 measurements, where the landed box resolved inconsistently. Phase 2
          // (`:495-539`) remains the sole arbiter regardless — a wrong hypothesis here still fails
          // its real `scrollTo` + `elementFromPoint` recheck and falls through to `violation`, so an
          // over-inclusive extent cannot manufacture a false `cleared` — it can only inflate the
          // offset past `maxScrollY` and get it discarded, which is why R2's hit-testability filter
          // (excluding `pointer-events:none`, hidden, and zero-area descendants) is load-bearing, not
          // decorative: an unfiltered union-everything rule turns clearable candidates into
          // permanent violations the moment a decorative overflow is large enough (R6's control).
          const fixedOrStickyAncestor = nearestFixedOrStickyAncestorOf(hit);
          if (fixedOrStickyAncestor) {
            const occluderRect = computeAncestorExtent(fixedOrStickyAncestor);
            const offsets = computeClearingOffsetCandidates(rect, occluderRect, maxScrollY);
            if (offsets.length > 0) {
              results.push({
                index: i,
                kind: 'candidate-transient',
                element: describe(el),
                interceptor: describe(hit),
                candidateOffsets: offsets,
                selectorIndex: i,
              });
              continue;
            }
          }

          results.push({ index: i, kind: 'violation', element: describe(el), interceptor: describe(hit) });
        }

        return { checked, results, excluded };
      },
      {
        selector: CANDIDATE_SELECTOR,
        overlaySelector: INTENTIONAL_OVERLAY_SELECTOR,
        dialogSelector: DIALOG_SELECTOR,
        predicateBody: N6_EXEMPT_PREDICATE_BODY,
        resolvedIndices: Array.from(resolved),
      }
    );

  for (const bandOffset of scanOffsets) {
    if (bandOffset !== startScrollY) {
      await page.evaluate((y) => window.scrollTo({ top: y, left: 0, behavior: 'instant' }), bandOffset);
    }
    const band = await runBand(page);
    checked += band.checked;
    for (const r of band.results) {
      resolved.add(r.index);
      if (r.kind !== 'clean') allResults.push(r);
    }
    finalExcluded = band.excluded;
  }

  const violations = allResults.filter((r) => r.kind === 'violation');
  const transientCandidates = allResults.filter((r) => r.kind === 'candidate-transient');
  const cleared = [];

  // Phase 2 — for each transient candidate, actually scroll to its computed offset and re-hit-test
  // there (real measurement, not just the geometry that produced the candidate offset). The first
  // offset that clears it wins; if none do, it reverts to a real violation.
  for (const tc of transientCandidates) {
    let resolvedOffset = null;
    for (const offset of tc.candidateOffsets) {
      const recheck = await page.evaluate(
        ({ selector, selectorIndex, offset, overlaySelector, dialogSelector, predicateBody }) => {
          const isN6Exempt = new Function('el', 'hit', 'overlaySelector', 'dialogSelector', predicateBody);
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
          // N6 — contextual overlay exemption (Task 727 R1/R2): same shared predicate as
          // hitTestPage's phase-1 direct path, reconstructed identically from the same source
          // string so this scroll-recheck path cannot silently diverge from it (§14.9.29).
          if (isN6Exempt(el, hit, overlaySelector, dialogSelector)) return { cleared: true };
          return { cleared: false };
        },
        {
          selector: CANDIDATE_SELECTOR,
          selectorIndex: tc.selectorIndex,
          offset,
          overlaySelector: INTENTIONAL_OVERLAY_SELECTOR,
          dialogSelector: DIALOG_SELECTOR,
          predicateBody: N6_EXEMPT_PREDICATE_BODY,
        }
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
  // measured from the same start state, not wherever phase 2 or the band scan left off.
  await page.evaluate((y) => window.scrollTo({ top: y, left: 0, behavior: 'instant' }), startScrollY);

  // Task 729 R1/R2 — only a candidate outside the viewport at EVERY scanned band (the final
  // band's leftover list) is a genuine exclusion; strip the internal band-dedupe `index` before
  // returning.
  const excluded = finalExcluded.map(({ index, ...rest }) => rest);

  return { checked, violations, cleared, excluded };
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

// Task 739 R4 — two more fixtures, added because none of the 8 pre-739 cases (including R12's own
// TRANSIENT/PERMANENT pair above) reproduce an interceptor that OVERHANGS its fixed ancestor's own
// box — the `#overhang` span here is `position:absolute;top:-20px;height:80px` inside a
// `position:fixed;height:60px` bar, so it extends 20px above the bar's own top edge, the same shape
// as `.fabLink`'s `margin-top:-12px` overhang beyond `.navBar` (docs/sessions/2026-08-09-task739-*.md
// §3.4). The target button sits at `top:225px;height:10px` (viewport 220-300 is the bar+overhang's
// real hit-box; 240-300 is the bar's OWN box; the button's 220-235 band is reachable ONLY inside the
// overhang, not the bar) — this isolates exactly the geometry Task 739 fixes: the pre-Task-739
// generator (ancestor's box alone, top:240) undershoots by the same ~20px the overhang adds. Task
// 740's extent (`computeAncestorExtent`, top:220 — the `#overhang` span is `hit`, and it is also the
// one overflowing descendant, so the extent and `hit`'s own box coincide here) correctly clears it;
// so did Task 739's landed `union(hit, ancestor)`, since `#overhang` happened to be `hit` in this
// specific fixture — this fixture alone could not have caught 739's own gap (Task 740, kickoff §3.2:
// `.fabLink` is not always `hit`). Same page-height convention as R12's pair decides transient vs.
// permanent:
//   - `OVERHANG_TRANSIENT_PAGE_HTML`: `body` 2000px tall — must resolve CLEARED post-fix (and FAIL
//     pre-fix, proving this fixture actually expresses the defect rather than passing by accident).
//   - `OVERHANG_PERMANENT_PAGE_HTML`: `body` exactly 300px, `maxScrollY = 0` — must FAIL in both the
//     pre-fix and post-fix gate; a fix that makes this case go quiet bought silence, not correctness
//     (C5).
const OVERHANG_TRANSIENT_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (overhanging interceptor, transient)</title></head>
<body style="margin:0;height:2000px;position:relative;">
  <button id="target" style="position:absolute;top:225px;left:40px;width:120px;height:10px;">Click me</button>
  <div id="fixed-bar" style="position:fixed;bottom:0;left:0;right:0;height:60px;">
    <span id="overhang" style="position:absolute;top:-20px;left:0;right:0;height:80px;display:block;"></span>
  </div>
</body>
</html>`;

const OVERHANG_PERMANENT_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (overhanging interceptor, permanent)</title></head>
<body style="margin:0;height:300px;position:relative;">
  <button id="target" style="position:absolute;top:225px;left:40px;width:120px;height:10px;">Click me</button>
  <div id="fixed-bar" style="position:fixed;bottom:0;left:0;right:0;height:60px;">
    <span id="overhang" style="position:absolute;top:-20px;left:0;right:0;height:80px;display:block;"></span>
  </div>
</body>
</html>`;

// Task 739 attempt 2, R5/R12 — the mirror control the overhang pair above cannot provide: an
// interceptor STRICTLY SMALLER than its fixed ancestor (a small icon inside a tall bar), where
// clearing the icon's own small box is NOT enough — the candidate must clear the BAR's full extent
// to actually resolve. `#icon` is `top:10px;height:10px` (viewport 230-240) inside a
// `position:fixed;height:80px` bar (viewport 220-300) — the same shape as `svg.lucide-menu` (a 20px
// icon) sitting inside `.site-header`'s full 65px box. The target button sits at `top:233px;height:4px`
// (viewport 233-237), inside the icon's own narrow band. An interceptor-only fix (attempt 1) computes
// its offset from the icon's box alone (230), clears the icon, and lands the candidate at ~229 —
// still INSIDE the bar's larger box (220-300), so a real click there still hits the bar, not the
// button: this fixture must FAIL under attempt 1's diff, proving it is a control and not decoration
// (R12's own requirement — attempt 1's overhang fixtures failed this bar because their overhang span
// was a *superset* of the bar, so interceptor-only passed them by construction; this fixture's
// interceptor is a *subset*, the opposite shape). The union-of-extent fix (attempt 2) computes its
// offset from the bar's own full box (220), which correctly clears it.
//   - `CONTAINMENT_TRANSIENT_PAGE_HTML`: `body` 2000px tall — must FAIL under attempt 1, resolve
//     CLEARED after the rework.
//   - `CONTAINMENT_PERMANENT_PAGE_HTML`: `body` exactly 300px, `maxScrollY = 0` — must FAIL in both,
//     the same C5 generosity-is-bounded proof R4's permanent twin gives the overhang case.
const CONTAINMENT_TRANSIENT_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (contained interceptor, transient)</title></head>
<body style="margin:0;height:2000px;position:relative;">
  <button id="target" style="position:absolute;top:233px;left:40px;width:120px;height:4px;">Click me</button>
  <div id="fixed-bar" style="position:fixed;bottom:0;left:0;right:0;height:80px;">
    <span id="icon" style="position:absolute;top:10px;left:0;right:0;height:10px;display:block;"></span>
  </div>
</body>
</html>`;

const CONTAINMENT_PERMANENT_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (contained interceptor, permanent)</title></head>
<body style="margin:0;height:300px;position:relative;">
  <button id="target" style="position:absolute;top:233px;left:40px;width:120px;height:4px;">Click me</button>
  <div id="fixed-bar" style="position:fixed;bottom:0;left:0;right:0;height:80px;">
    <span id="icon" style="position:absolute;top:10px;left:0;right:0;height:10px;display:block;"></span>
  </div>
</body>
</html>`;

// Task 740 R6 — the control for the OPPOSITE failure direction from the overhang/containment pairs
// above: over-extension. `#decoration` is `pointer-events:none`, `top:-500px;height:560px` inside a
// `position:fixed;height:60px` bar — a huge, purely visual overflow that CANNOT receive a real
// click. The target button sits inside the bar's own solid box (`top:250px`, matching R12 arm②'s
// original convention exactly), so it genuinely needs clearing — `hit` is the bar's own `<span>`, not
// the decoration. A rule that unions every descendant's rect regardless of `pointer-events` (the
// naive rule this fixture is built to catch) inflates the extent to `-260..300`, generates an
// offset that either exceeds `maxScrollY` or lands the candidate off-screen, and the candidate falls
// through to a reported `violation` — even though it is, in reality, trivially clearable by scrolling
// the bar's own 60px out of the way. `isHitTestableForExtent`'s `pointer-events:none` exclusion
// (R2) is what keeps this fixture passing under the correct rule.
//   - `OVEREXTENSION_TRANSIENT_PAGE_HTML`: `body` 2000px tall — must FAIL under a deliberately naive
//     union-everything rule, and resolve CLEARED under the correct, filtered extent.
//   - `OVEREXTENSION_PERMANENT_PAGE_HTML`: `body` exactly 300px, `maxScrollY = 0` — must FAIL under
//     both rules, the same C5/generosity-is-bounded proof the other two permanent twins give.
const OVEREXTENSION_TRANSIENT_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (over-extension control, transient)</title></head>
<body style="margin:0;height:2000px;position:relative;">
  <button id="target" style="position:absolute;top:250px;left:40px;width:120px;height:40px;">Click me</button>
  <div id="fixed-bar" style="position:fixed;bottom:0;left:0;right:0;height:60px;">
    <span style="display:block;width:100%;height:100%;"></span>
    <div id="decoration" style="position:absolute;top:-500px;left:0;right:0;height:560px;pointer-events:none;"></div>
  </div>
</body>
</html>`;

const OVEREXTENSION_PERMANENT_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (over-extension control, permanent)</title></head>
<body style="margin:0;height:300px;position:relative;">
  <button id="target" style="position:absolute;top:250px;left:40px;width:120px;height:40px;">Click me</button>
  <div id="fixed-bar" style="position:fixed;bottom:0;left:0;right:0;height:60px;">
    <span style="display:block;width:100%;height:100%;"></span>
    <div id="decoration" style="position:absolute;top:-500px;left:0;right:0;height:560px;pointer-events:none;"></div>
  </div>
</body>
</html>`;

// Task 727 R10/AC8 — three fixtures proving the contextual N6 rule itself (not the pre-existing
// transient/permanent scroll mechanism above). All three keep the shield as a plain sibling
// `<div>` after the dialog in document order with no CSS transform anywhere on the page, so plain
// DOM-order paint stacking puts it on top — no coordinate-drift caveat here (see the live-plant
// note in the session log for why a REAL Mantine Drawer/Modal needs the shield appended to
// document.body instead: its content animates via `transform`, which becomes the containing
// block for `position:fixed` descendants too).
const DIALOG_VIOLATION_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (contextual N6 — inside dialog, violation)</title></head>
<body style="margin:0">
  <div role="dialog" aria-modal="true" style="position:fixed;top:40px;left:40px;width:200px;height:150px;">
    <button id="target" style="position:absolute;top:20px;left:20px;width:120px;height:40px;">Click me</button>
  </div>
  <div class="mantine-Overlay-root" style="position:fixed;inset:0;background:transparent;"></div>
</body>
</html>`;

const DIALOG_CLEAN_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (contextual N6 — inside dialog, no shield)</title></head>
<body style="margin:0">
  <div role="dialog" aria-modal="true" style="position:fixed;top:40px;left:40px;width:200px;height:150px;">
    <button id="target" style="position:absolute;top:20px;left:20px;width:120px;height:40px;">Click me</button>
  </div>
</body>
</html>`;

const ALERTDIALOG_VIOLATION_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Click-shield gate self-test (contextual N6 — inside alertdialog, violation)</title></head>
<body style="margin:0">
  <div role="alertdialog" aria-modal="true" style="position:fixed;top:40px;left:40px;width:200px;height:150px;">
    <button id="target" style="position:absolute;top:20px;left:20px;width:120px;height:40px;">Click me</button>
  </div>
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
  const pages = { violation: null, clean: null, overlayExempt: null, transient: null, permanent: null };
  const baseUrl = await new Promise((res, rej) => {
    server = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (req.url === '/violation') res.end(VIOLATION_PAGE_HTML);
      else if (req.url === '/overlay-exempt') res.end(OVERLAY_EXEMPT_PAGE_HTML);
      else if (req.url === '/transient') res.end(TRANSIENT_PAGE_HTML);
      else if (req.url === '/permanent') res.end(PERMANENT_PAGE_HTML);
      else if (req.url === '/overhang-transient') res.end(OVERHANG_TRANSIENT_PAGE_HTML);
      else if (req.url === '/overhang-permanent') res.end(OVERHANG_PERMANENT_PAGE_HTML);
      else if (req.url === '/containment-transient') res.end(CONTAINMENT_TRANSIENT_PAGE_HTML);
      else if (req.url === '/containment-permanent') res.end(CONTAINMENT_PERMANENT_PAGE_HTML);
      else if (req.url === '/overextension-transient') res.end(OVEREXTENSION_TRANSIENT_PAGE_HTML);
      else if (req.url === '/overextension-permanent') res.end(OVEREXTENSION_PERMANENT_PAGE_HTML);
      else if (req.url === '/dialog-violation') res.end(DIALOG_VIOLATION_PAGE_HTML);
      else if (req.url === '/dialog-clean') res.end(DIALOG_CLEAN_PAGE_HTML);
      else if (req.url === '/alertdialog-violation') res.end(ALERTDIALOG_VIOLATION_PAGE_HTML);
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
    // Task 739 R4 — the overhang shape neither R12 fixture expresses: the interceptor extends
    // beyond its own fixed ancestor's box (`.fabLink` beyond `.navBar`'s real-app shape). Pre-fix,
    // the transient one FAILs (undershoot); post-fix it must resolve CLEARED. The permanent twin
    // must FAIL in both — C5, generosity is bounded.
    { url: `${baseUrl}/overhang-transient`, label: 'Task 739 — overhanging interceptor, tall page (scroll clears it)', expectFail: false, expectCleared: true },
    { url: `${baseUrl}/overhang-permanent`, label: 'Task 739 — overhanging interceptor, page height == viewport (no scroll offset exists)', expectFail: true },
    // Task 739 attempt 2, R5/R12 — the mirror control: a SMALLER interceptor contained within a
    // taller fixed bar. Must FAIL under attempt 1 (interceptor-only undershoots the bar's own
    // extent) and PASS after the union-of-extent rework.
    { url: `${baseUrl}/containment-transient`, label: 'Task 739 attempt 2 — contained interceptor, tall page (scroll clears it)', expectFail: false, expectCleared: true },
    { url: `${baseUrl}/containment-permanent`, label: 'Task 739 attempt 2 — contained interceptor, page height == viewport (no scroll offset exists)', expectFail: true },
    // Task 740 R6 — the over-extension control: a huge `pointer-events:none` decoration must NOT
    // count toward the extent. Must FAIL under a deliberately naive union-everything rule, PASS
    // under the correct, filtered extent.
    { url: `${baseUrl}/overextension-transient`, label: 'Task 740 — over-extension control, tall page (decoration excluded, scroll clears it)', expectFail: false, expectCleared: true },
    { url: `${baseUrl}/overextension-permanent`, label: 'Task 740 — over-extension control, page height == viewport (no scroll offset exists)', expectFail: true },
    // Task 727 R1/R3/R10 — the contextual N6 rule itself. A candidate INSIDE an active dialog is
    // never exempt, even when the interceptor is the genuine `.mantine-Overlay-root` backdrop
    // (this is the exact defect the task exists to close — a modal whose own backdrop covers its
    // own button used to pass silently); a candidate inside a dialog with nothing shielding it
    // stays clean (proves the dialog-context check alone introduces no false positive); the same
    // rule covers `[role="alertdialog"]` per the owner decision (§3.1), even though nothing in
    // this repo renders that role live today (§3.5) — implemented and self-tested, not claimed as
    // exercised against the real app.
    { url: `${baseUrl}/dialog-violation`, label: 'Contextual N6 — candidate INSIDE [role="dialog"] intercepted by its own Overlay backdrop (must now FAIL)', expectFail: true },
    { url: `${baseUrl}/dialog-clean`, label: 'Contextual N6 — candidate INSIDE [role="dialog"], no shield (must PASS)', expectFail: false },
    { url: `${baseUrl}/alertdialog-violation`, label: 'Contextual N6 — candidate INSIDE [role="alertdialog"] intercepted by Overlay (rule covers both roles, must FAIL)', expectFail: true },
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

  const scenariosToRun = SINGLE_SCENARIO ? SCENARIOS.filter((s) => s.name === SINGLE_SCENARIO) : SCENARIOS;
  if (scenariosToRun.length === 0) {
    console.error(`❌ unknown --scenario= value "${SINGLE_SCENARIO}" — expected one of: ${SCENARIOS.map((s) => s.name).join(', ')}`);
    process.exit(2);
  }

  console.log('\n🔍 Click-shield hit-test gate');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Scenarios: ${scenariosToRun.map((s) => s.name).join(', ')}`);
  console.log(`   Locales: ${LOCALES.join(', ')}`);
  console.log(`   Viewports: ${VIEWPORTS.map((v) => v.name).join(', ')}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const cells = [];
  let emptyCandidateCells = 0;
  let scenarioOpenFailures = 0;

  for (const scenario of scenariosToRun) {
    console.log(`\n── Scenario: ${scenario.name} — ${scenario.label} ──`);
    for (const locale of LOCALES) {
      // `--route=` remains a base-scenario-only manual debug override (its pre-existing purpose,
      // Task 723) — the drawer/modal scenarios always drive their own named route since that
      // route IS the scenario (a drawer/modal reachable there is the thing being proven).
      const route = SINGLE_ROUTE && scenario.name === 'base' ? SINGLE_ROUTE : scenario.route(locale);
      for (const vp of VIEWPORTS) {
        const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
        const url = `${BASE_URL}${route}`;
        let result;
        let openResult = { opened: true, dialogPresent: false, error: null };
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(500);
          openResult = await openScenarioOverlay(page, scenario);
          if (scenario.trigger && !openResult.dialogPresent) {
            result = { checked: 0, violations: [], cleared: [], excluded: [], error: openResult.error ?? 'dialog did not appear' };
          } else {
            result = await hitTestPage(page);
          }
        } catch (err) {
          result = { checked: 0, violations: [], cleared: [], excluded: [], error: String(err.message ?? err).slice(0, 200) };
        } finally {
          await page.close();
        }

        const cell = {
          scenario: scenario.name,
          locale,
          route,
          viewport: vp.name,
          width: vp.width,
          dialogPresent: openResult.dialogPresent,
          ...result,
        };
        cells.push(cell);

        const label = `[${scenario.name}] ${route} × ${vp.name}`;

        if (scenario.trigger && !openResult.dialogPresent) {
          scenarioOpenFailures++;
          console.log(`   ${label}: ❌ SCENARIO OVERLAY NEVER OPENED — ${cell.error} (A2: a zero-violation result here would mean nothing)`);
          continue;
        }

        // Task 729 R2 — the skipped-candidate count is part of the gate's normal output on every
        // branch below, not behind a debug flag: `checked=N` must stop implying full-page coverage
        // regardless of which §7.3 fix branch this run precedes or follows.
        const excludedSuffix = `, excluded(below/above-fold)=${cell.excluded.length}`;

        if (cell.checked === 0) {
          emptyCandidateCells++;
          console.log(`   ${label}: ❌ EMPTY CANDIDATE SET (checked=0)${excludedSuffix}${cell.error ? ` — ${cell.error}` : ''}`);
        } else if (cell.violations.length > 0) {
          console.log(`   ${label}: ❌ FAIL — checked=${cell.checked}${excludedSuffix}, ${cell.violations.length} interception(s)${scenario.trigger ? ` (dialog present: ${openResult.dialogPresent})` : ''}`);
          for (const v of cell.violations) {
            console.log(`      blocked:      <${v.element.tag} class="${v.element.class}"> "${v.element.text}" @ (${v.element.rect.x},${v.element.rect.y} ${v.element.rect.width}x${v.element.rect.height})`);
            console.log(`      interceptor:  <${v.interceptor?.tag ?? '?'} class="${v.interceptor?.class ?? '?'}"> @ (${v.interceptor?.rect?.x},${v.interceptor?.rect?.y} ${v.interceptor?.rect?.width}x${v.interceptor?.rect?.height})`);
            if (v.reason) console.log(`      reason:       ${v.reason}`);
          }
        } else if (cell.cleared.length > 0) {
          console.log(`   ${label}: ✅ PASS (${cell.cleared.length} transient, scroll-cleared) — checked=${cell.checked}${excludedSuffix}${scenario.trigger ? ` (dialog present: ${openResult.dialogPresent})` : ''}`);
          for (const c of cell.cleared) {
            console.log(`      cleared:      <${c.element.tag} class="${c.element.class}"> "${c.element.text}" @ scrollY=${c.clearingScrollOffset} (fixed/sticky interceptor <${c.interceptor.tag} class="${c.interceptor.class}">, nearest positioned ancestor: <${c.interceptor.nearestPositionedAncestor?.tag ?? '?'} class="${c.interceptor.nearestPositionedAncestor?.class ?? '?'}"> @ (${c.interceptor.nearestPositionedAncestor?.rect?.x},${c.interceptor.nearestPositionedAncestor?.rect?.y} ${c.interceptor.nearestPositionedAncestor?.rect?.width}x${c.interceptor.nearestPositionedAncestor?.rect?.height}))`);
          }
        } else {
          console.log(`   ${label}: ✅ PASS — checked=${cell.checked}${excludedSuffix}, 0 interceptions${scenario.trigger ? ` (dialog present: ${openResult.dialogPresent})` : ''}`);
        }
      }
    }
  }

  await browser.close();

  const totalChecked = cells.reduce((s, c) => s + c.checked, 0);
  const totalViolations = cells.reduce((s, c) => s + c.violations.length, 0);
  const totalCleared = cells.reduce((s, c) => s + c.cleared.length, 0);
  // Task 729 R1/R2 — the below/above-fold exclusion total, ships in every run's own output.
  const totalExcluded = cells.reduce((s, c) => s + c.excluded.length, 0);

  console.log('\n── Summary ──────────────────────────────────────────────────');
  console.log(
    `   Scenarios: ${scenariosToRun.length}  Cells: ${cells.length}  Elements checked: ${totalChecked}  Excluded (below/above-fold): ${totalExcluded}  Interceptions: ${totalViolations}  Cleared (transient): ${totalCleared}  Empty-candidate cells: ${emptyCandidateCells}  Scenario-open failures: ${scenarioOpenFailures}`
  );
  for (const scenario of scenariosToRun) {
    const scenarioCells = cells.filter((c) => c.scenario === scenario.name);
    console.log(
      `   [${scenario.name}] cells=${scenarioCells.length}  checked=${scenarioCells.reduce((s, c) => s + c.checked, 0)}  excluded=${scenarioCells.reduce((s, c) => s + c.excluded.length, 0)}  violations=${scenarioCells.reduce((s, c) => s + c.violations.length, 0)}`
    );
  }

  // Task 729 R1 — optional full per-candidate census dump (identifying detail per scenario × cell),
  // used to produce the one-time measurement this task's fix decision is based on. Never required
  // for a normal CI run — R2's count above ships unconditionally; this is the instrumentation.
  const CENSUS_FILE = process.env.CLICK_SHIELD_CENSUS_FILE;
  if (CENSUS_FILE) {
    const { writeFileSync, mkdirSync } = await import('node:fs');
    const { dirname } = await import('node:path');
    mkdirSync(dirname(CENSUS_FILE), { recursive: true });
    const census = cells.map((c) => ({
      scenario: c.scenario,
      locale: c.locale,
      route: c.route,
      viewport: c.viewport,
      checked: c.checked,
      excludedCount: c.excluded.length,
      excluded: c.excluded,
    }));
    writeFileSync(CENSUS_FILE, JSON.stringify({ totalExcluded, cells: census }, null, 2));
    console.log(`   Census written: ${CENSUS_FILE} (totalExcluded=${totalExcluded})`);
  }

  if (scenarioOpenFailures > 0) {
    console.error('\n❌ At least one triggered scenario never got its overlay open (dialog absent from the DOM) —');
    console.error('   a zero-violation result from that cell would mean nothing (Task 727 A2). This is a harness');
    console.error('   failure, not a clean pass.\n');
    process.exit(2);
  }

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
