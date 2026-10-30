/**
 * r8-50-bound-mutations.mjs - proof that every bound of the overflow metrics, of the settled state and of the load check is load-bearing (Task 923, R11, R15, R19, R22, R24-R26, R28, R29, R31, R32)
 *
 *   node docs/sessions/evidence/task923/r8-50-bound-mutations.mjs
 * Each mutation edits a COPY of the in-page measuring code (nothing under the repository is written) and runs one fixture
 * through it:
 *   - the seven exemptions of Revision 1 (`expect: fail`): with the exemption removed, its BENIGN fixture must fail the
 *     named rule - otherwise the fixture would not prove the exemption;
 *   - the two bounds of Revision 2 and the four conditions of Revision 3 (`expect: pass`): with the bound / condition
 *     removed, its PLANTED fixture must go green, or (R19 case a and b removed) the benign fixture must fail - otherwise
 *     the fixture would not prove that the bound is what finds / excuses it.
 *   - the two conditions of Revision 4 (R22): the slide test judges only what lies outside the bound (the whole-element test of
 *     R19 is put back: the benign `track-active-slide-inside` must fail), and an off-screen control must be hidden and
 *     untabbable (any control accepted: the planted `track-offscreen-slide-tabbable` must go green).
 *   - the six conditions of Revision 5 (R24-R26): the action-rule skip needs both halves (drop "clipped away": the covered,
 *     hidden control inside its frame goes green; drop "hidden and untabbable": the aria-only off-screen slide goes green),
 *     an in-flow slide of a transformed track is judged against the frame only when it lies wholly inside it and only when
 *     its parent is transformed, `waitStable` ignores infinite animations, and the focus is read once settled.
 *   - the five conditions of Revision 6 (R28, R29, R31): the dismissal bound (back at 1 000ms, the slow-closing dialog fails
 *     dismiss-escape), a retry replaces the first attempt (the first attempt merged back in, the retried fixture fails target-small
 *     on the app root), and the three conditions of the settle: no in-flight request, the layout signature, and its exclusion of
 *     an infinite animation. `file: runner` mutations edit a COPY of runner.mjs in a directory made with fs.mkdtempSync; its
 *     relative imports are rewritten to the file URLs of the repository files, the one edit is applied and the copy is import()ed -
 *     no repository file is ever written. `file: in-page` mutations edit the in-page code as before.
 *   - the three conditions of Revision 7 (R32): the failed-resource check of the load (b) - dropped, the stylesheet-fails-once
 *     fixture is measured without its stylesheet and fails target-small; the retry of a failed resource (c) - dropped, it fails
 *     error-screen; the resource types (a) - a fetch recorded too, fetch-404-benign fails error-screen.
 *   - the gate fix of R33 Story 059 (i): a request aborted by the navigation that leaves its document is that document's failure - the
 *     epoch check reverted, the benign stale-abort-benign fixture fails error-screen.
 * 41 of 41 must be proved (29 of Revision 7 R32 and the eleven gate changes of the R33 loop: Story 059 hidden Drawer, Story 059 stale abort, Story 018 unpainted text,
 * owner D9 exemptTargets,
 * Story 021 horizontally scrolling parent;
 * one more for every further fix).
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as repoRunner from '../../../../scripts/rendered-state-census/runner.mjs';

const { startStaticServer } = repoRunner;

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const source = readFileSync('scripts/rendered-state-census/in-page.mjs', 'utf8').replace('export function installCensus', 'function installCensus');
const runnerSource = readFileSync('scripts/rendered-state-census/runner.mjs', 'utf8');
const repoUrl = (name) => pathToFileURL(resolve('scripts/rendered-state-census', name)).href;

/** A mutated COPY of runner.mjs, imported from a temp directory; its relative imports point at the repository files. */
async function mutatedRunner(m) {
  const dir = mkdtempSync(join(tmpdir(), 'census-'));
  const code = runnerSource
    .replace("from './in-page.mjs'", `from '${repoUrl('in-page.mjs')}'`)
    .replace("from './registry.mjs'", `from '${repoUrl('registry.mjs')}'`)
    .replace(m.from, m.to);
  const file = join(dir, 'runner.mjs');
  writeFileSync(file, code);
  return import(pathToFileURL(file).href);
}

const MUTATIONS = [
  { name: 'negative margin exempts only its own size', fixture: 'neg-margin-fullbleed', rule: 'component-overflow', root: 'portal:0', expect: 'fail',
    from: 'const overBeyond = (over, margin) => over > 0.5 && !(margin < 0 && over <= -margin + 0.5);', to: 'const overBeyond = (over) => over > 0.5;' },
  { name: 'table box parent (the table algorithm places its own rows)', fixture: 'table-rowspan', rule: 'component-overflow', root: 'portal:0', expect: 'fail',
    from: 'const tableExempt = tableBox && !(pcs.display', to: 'const tableExempt = false && !(pcs.display' },
  { name: 'slide clipped away by design', fixture: 'slide-carousel', rule: 'component-overflow', root: 'portal:0', expect: 'fail',
    from: 'clippedAway = wholly && (/auto|scroll/.test(csOf(clipper).overflowX) || transformedBetween(e, clipper));', to: 'clippedAway = false;' },
  { name: 'text-hidden: text really outside the padding box', fixture: 'text-inner-box', rule: 'text-hidden', root: 'portal:0', expect: 'fail',
    from: '&& textPastBox(e)) {', to: ') {' },
  { name: 'viewport: hidden away by an ancestor inside the viewport', fixture: 'hidden-away-clipped', rule: 'viewport-overflow', root: 'portal:0', expect: 'fail',
    from: 'if (offCanvas(e, r) || hiddenAwayFrom(e, root)) continue;', to: 'if (offCanvas(e, r)) continue;' },
  { name: 'viewport: closed off-canvas fixed panel', fixture: 'offcanvas-closed-panel', rule: 'viewport-overflow', root: 'app', expect: 'fail',
    from: 'if (offCanvas(e, r) || hiddenAwayFrom(e, root)) continue;', to: 'if (hiddenAwayFrom(e, root)) continue;' },
  { name: 'action covered by a dialog in another portal root', fixture: 'stacked-dialogs', rule: 'action-covered', root: 'portal:0', expect: 'fail',
    from: 'const stacked = !!aPortal && !!hitPortal && aPortal !== hitPortal;', to: 'const stacked = false;' },
  // Revision 2 (R15): the two bounds of positioned / transformed content
  { name: 'R15 bound 1: the overlay panel', fixture: 'abs-past-panel', rule: 'component-overflow', root: 'portal:0', expect: 'pass',
    from: "if (p.matches(OVERLAY_PANEL) || pcs.overflowX !== 'visible' || pcs.overflowY !== 'visible') return p;", to: "if (pcs.overflowX !== 'visible' || pcs.overflowY !== 'visible') return p;" },
  { name: 'R15 bound 2: the clipping ancestor', fixture: 'abs-past-clipper', rule: 'component-overflow', root: 'portal:0', expect: 'pass',
    from: "if (p.matches(OVERLAY_PANEL) || pcs.overflowX !== 'visible' || pcs.overflowY !== 'visible') return p;", to: 'if (p.matches(OVERLAY_PANEL)) return p;' },
  // Revision 3 (R19): the two exemptions for positioned content, each with its guard condition
  { name: 'R19 (a) removed: the clipped-away media-only slide', fixture: 'positioned-slide-away', rule: 'component-overflow', root: 'portal:0', expect: 'fail',
    from: 'const exemptSlide = slideShape && !slideBreak;', to: 'const exemptSlide = false;' },
  { name: 'R19 (a) without its no-text / no-control condition', fixture: 'positioned-slide-away-control', rule: 'component-overflow', root: 'portal:0', expect: 'pass',
    from: 'const exemptSlide = slideShape && !slideBreak;', to: 'const exemptSlide = slideShape;' },
  { name: 'R19 (b) removed: the media crop that covers its frame', fixture: 'media-cover-zoom', rule: 'component-overflow', root: 'portal:0', expect: 'fail',
    from: "const exemptMedia = bclips && /^(IMG|VIDEO|PICTURE|CANVAS)$/.test(e.tagName) && !hasText(e) && covers;", to: 'const exemptMedia = false;' },
  { name: 'R19 (b) without its cover condition', fixture: 'media-shifted-past-frame', rule: 'component-overflow', root: 'portal:0', expect: 'pass',
    from: ' && covers;', to: ';' },
  // Revision 4 (R22): the slide test judges only what lies outside the bound, and an off-screen control must be hidden AND untabbable
  { name: 'R22 judges only the outside: the whole element again (the R19 text)', fixture: 'track-active-slide-inside', rule: 'component-overflow', root: 'portal:0', expect: 'fail',
    from: 'const exemptSlide = slideShape && !slideBreak;', to: 'const exemptSlide = slideShape && !hasText(e) && !e.matches(BOUND_CONTROL) && !e.querySelector(BOUND_CONTROL);' },
  { name: 'R22 control clause: any off-screen control accepted', fixture: 'track-offscreen-slide-tabbable', rule: 'component-overflow', root: 'portal:0', expect: 'pass',
    from: 'if (d.matches(BOUND_CONTROL) && !(outOfTabOrder(d) && hiddenFromAT(d)))', to: 'if (false && !(outOfTabOrder(d) && hiddenFromAT(d)))' },
  // Revision 5 (R24): the action-rule skip needs BOTH halves
  { name: 'R24 (ii) dropped: a hidden, untabbable control INSIDE its frame is skipped too', fixture: 'visible-hidden-control-covered', rule: 'action-covered', root: 'portal:0', expect: 'pass',
    from: 'if (outOfTabOrder(a) && hiddenFromAT(a) && clippedAwayBy(a, root, r)) { skippedActions++; continue; }', to: 'if (outOfTabOrder(a) && hiddenFromAT(a)) { skippedActions++; continue; }' },
  { name: 'R24 (i) dropped: a clipped-away control that is only aria-hidden (still tabbable) is skipped too', fixture: 'track-offscreen-slide-aria-only', rule: 'action-covered', root: 'portal:0', expect: 'pass',
    from: 'if (outOfTabOrder(a) && hiddenFromAT(a) && clippedAwayBy(a, root, r)) { skippedActions++; continue; }', to: 'if (clippedAwayBy(a, root, r)) { skippedActions++; continue; }' },
  // Revision 5 (R25): an in-flow slide of a transformed track is judged against the frame
  // `detailRe`: the fixture stays red with the clause dropped, because its transformed track is itself flagged by the positioned
  // path (R15 / R22: a track that holds a tabbable control outside the frame). The clause is then proved by the IN-FLOW detail of
  // the straddling slide: present as delivered, gone with the clause dropped (session log, deviation D33).
  { name: 'R25 "wholly inside the clipper" dropped: any child of a transformed parent is skipped', fixture: 'track-flex-slide-straddles', rule: 'component-overflow', root: 'portal:0', expect: 'pass',
    detailRe: /^button "" x [\d.]+\.\.[\d.]+ past div [\d.]+\.\.[\d.]+$/,
    from: "const trackSlideInFrame = pcs.transform !== 'none' && !!clipper && insidePaddingBox(er, clipper);", to: "const trackSlideInFrame = pcs.transform !== 'none' && !!clipper;" },
  { name: 'R25 "parent transformed" dropped: any child wholly inside its clipper is skipped', fixture: 'inflow-past-untransformed-parent', rule: 'component-overflow', root: 'portal:0', expect: 'pass',
    from: "const trackSlideInFrame = pcs.transform !== 'none' && !!clipper && insidePaddingBox(er, clipper);", to: 'const trackSlideInFrame = !!clipper && insidePaddingBox(er, clipper);' },
  // Revision 5 (R26): the settled state
  { name: 'R26 (a) undone: infinite animations are counted again', fixture: 'infinite-spinner-toast', rule: 'portal-count', root: 'app', expect: 'fail',
    from: "return typeof iterations === 'number' && Number.isFinite(iterations);", to: 'return true;' },
  { name: 'R26 (b) undone: the focus is read at once (need = 1 poll)', fixture: 'trap-transient-body-focus', rule: 'focus-trap', root: 'portal:0', expect: 'fail',
    from: '{ interval = 50, need = 3, bound = 1000 } = {}', to: '{ interval = 50, need = 1, bound = 1000 } = {}' },
  // Revision 6 (R28): a dismissal is judged on whether the overlay closes; the bound is 5 000ms. `file: 'runner'` edits a copy of runner.mjs.
  { name: 'R28 undone: the dismissal bound is back at 1 000ms', file: 'runner', fixture: 'slow-close', rule: 'dismiss-escape', root: 'portal:0', expect: 'fail',
    from: 'export const DISMISS_BOUND_MS = 5000;', to: 'export const DISMISS_BOUND_MS = 1000;' },
  // Revision 6 (R29): a retry replaces the first attempt. `flaky` + `retry`: the page fails its first load and the job runs through runWithRetry.
  { name: 'R29 undone: the first attempt is merged back into the retried rows', file: 'runner', fixture: 'open-flaky-once-closed-violation', flaky: true, retry: true, rule: 'target-small', root: 'app', expect: 'fail',
    from: '  const second = await run(next);',
    to: `  const second = await run(next);
  for (const row of second) {
    const before = first.find((r) => r.root === row.root);
    if (before) for (const k of RULE_KEYS) if (!['open-failed', 'portal-count', 'error-screen'].includes(k) && before.rules[k].length && !row.rules[k].length) row.rules[k] = before.rules[k];
  }` },
  // Revision 6 (R31): the three conditions of the settle
  { name: 'R31 (c) dropped: a request in flight no longer holds the page back', file: 'runner', fixture: 'late-fetch-overflow', rule: 'component-overflow', root: 'portal:0', expect: 'pass',
    from: 'const inflight = sameOriginInflight(page, tracker);', to: 'const inflight = 0;' },
  { name: 'R31 (d) dropped: the layout signature is constant', fixture: 'raf-grow-overflow', rule: 'component-overflow', root: 'portal:0', expect: 'pass',
    from: 'function layoutSignature() {', to: "function layoutSignature() { return '0/0';" },
  { name: 'R31 (d) infinite-animation exclusion dropped: a loader holds the layout signature', fixture: 'infinite-spinner-toast', rule: 'portal-count', root: 'app', expect: 'fail',
    from: 'a.effect?.getTiming().iterations === Infinity && a.effect.target', to: 'false && a.effect.target' },
  // Revision 7 (R32): a failed same-origin document / script / stylesheet is a load failure
  { name: 'R32 (b) dropped: a failed stylesheet is measured as a page (resourceFailure never reports)', file: 'runner', fixture: 'stylesheet-fails-once', flaky: true, retry: true, rule: 'target-small', root: 'portal:0', expect: 'fail',
    from: 'export function resourceFailure(page) {', to: 'export function resourceFailure(page) { return null;' },
  { name: 'R32 (c) dropped: a failed resource is not retried', file: 'runner', fixture: 'stylesheet-fails-once', flaky: true, retry: true, rule: 'error-screen', root: 'app', expect: 'fail',
    from: '|| RENDER_TIMEOUT.test(d) || RESOURCE_FAILED.test(d);', to: '|| RENDER_TIMEOUT.test(d);' }, // R52: the check moved into `isTransientLoad` (shared with the reopen retry), so the anchor ends at `;` instead of `) return d;`
  { name: 'R32 (a) widened: a fetch that answers 404 is recorded as a failed resource', file: 'runner', fixture: 'fetch-404-benign', rule: 'error-screen', root: 'app', expect: 'fail',
    from: "const LOADED_RESOURCE_TYPES = new Set(['document', 'script', 'stylesheet']);", to: "const LOADED_RESOURCE_TYPES = new Set(['document', 'script', 'stylesheet', 'fetch']);" },
  // Revision 7, R33 Story 059 (i): a request aborted by the navigation that leaves its document is that document's failure
  { name: 'R33 (i) Story 059 undone: an abort of the previous page request is blamed on the new page', file: 'runner', fixture: 'clean', prior: 'stale-script-pending', rule: 'error-screen', root: 'app', expect: 'fail',
    from: 'const isStale = (r) => issued.get(r) !== t.epoch;', to: 'const isStale = () => false;' },
  // Revision 7, Story 018: text that is not painted (opacity 0, visibility hidden) is not hidden text
  { name: 'R33 (i) Story 018 undone: unpainted text counts as text past its clipping box', fixture: 'loading-label-invisible', rule: 'text-hidden', root: 'portal:0', expect: 'fail',
    from: 'if (notPainted(n.parentElement, el)) continue;', to: '' },
  // Revision 7, Story 021: a wide row in a parent that scrolls horizontally is reached by scrolling
  { name: 'R33 (i) Story 021 undone: a row past the right edge of a horizontally scrolling parent is overflow', fixture: 'scroll-row-in-dialog', rule: 'component-overflow', root: 'portal:0', expect: 'fail',
    from: '(!scrollsX && overBeyond(overR, marginR))', to: 'overBeyond(overR, marginR)' },
  // Revision 7, Story 059: a kept-mounted, hidden Drawer in the portal root does not make the overlay modal
  { name: 'R33 (i) Story 059 undone: a hidden Drawer makes the popover a modal (measured as trap)', fixture: 'hidden-drawer-popover', rule: 'focus-open', root: 'portal:0', expect: 'fail',
    from: "const shown = (p, sel) => [...p.querySelectorAll(sel)].some(vis);", to: "const shown = (p, sel) => !!p.querySelector(sel);" },
  // Revision 7, Story 059: a link under a fixed header is reachable by scrolling
  { name: 'R33 (i) Story 059 undone: a link under a fixed page header counts as covered', fixture: 'sticky-header-covers-link', rule: 'action-covered', root: 'app', expect: 'fail',
    from: 'if (!ok && !reachable) add(', to: 'if (!ok) add(' },
  // Revision 7, Story 073: a ScrollArea shape (scrolling viewport, visible-overflow wrapper, wide row)
  { name: 'R33 (i) Story 073 undone: only the direct parent decides whether a wide row scrolls', fixture: 'scroll-viewport-wrapper', rule: 'component-overflow', root: 'portal:0', expect: 'fail',
    from: "if (ox !== 'visible') { scrollsX = /auto|scroll/.test(ox); break; }", to: "if (true) { scrollsX = /auto|scroll/.test(csOf(parent).overflowX); break; }" },
  { name: 'R33 (i) Story 073 undone: text past the box counts on an axis the element does not clip', fixture: 'scroll-viewport-wrapper', rule: 'text-hidden', root: 'portal:0', expect: 'fail',
    from: '(clipX && (r.right > right + 0.5 || r.left < left - 0.5))', to: '(r.right > right + 0.5 || r.left < left - 0.5)' },
  // Revision 7, Story 075: an e-mail or URL is not a name cut by a squeezed box
  { name: 'R33 (i) Story 075 undone: an e-mail wider than its box is a word split', fixture: 'email-longer-than-box', rule: 'word-split', root: 'portal:0', expect: 'fail',
    from: 'if (/@|:\\/\\/|^www\\./.test(seg)) continue;', to: '' },
  // Revision 7, Story 149: the touch area of an input in a bordered wrapper is the wrapper
  { name: 'R33 (i) Story 149 undone: the inner input of a bordered wrapper is measured on its own', fixture: 'bordered-input-wrapper', rule: 'target-small', root: 'portal:0', expect: 'fail',
    from: 'const box = label ? label.getBoundingClientRect() : asField ? wrap.getBoundingClientRect() : r;', to: 'const box = label ? label.getBoundingClientRect() : r;' },
  // Revision 7, Story 176: a scrolling rail holds the overflow of its items
  { name: 'R33 (i) Story 176 undone: only an ancestor that hides its overflow holds items past the viewport edge', fixture: 'scroll-rail-past-viewport', rule: 'viewport-overflow', root: 'portal:0', expect: 'fail',
    from: "if (/hidden|clip|auto|scroll/.test(csOf(p).overflowX)) {", to: "if (/hidden|clip/.test(csOf(p).overflowX)) {" },
  // Revision 7, Story 199: a control in an inert (covered) dialog is not an operable action
  { name: 'R33 (i) Story 199 undone: a control in an inert dialog is measured by the action rules', fixture: 'inert-dialog-covered', rule: 'target-small', root: 'portal:0', expect: 'fail',
    from: "if (a.closest('[inert]')) { skippedActions++; continue; }", to: '' },
  // Revision 7, owner D9: a registry row's exemptTargets (with its owner decision) excuses the named controls from target-small
  { name: 'D9 undone: exemptTargets is ignored, the exempted day cells fail target-small', fixture: 'day-cells-exempt', rule: 'target-small', root: 'portal:0', expect: 'fail',
    from: 'if (exempt && a.matches(exempt)) exemptedControls++;', to: 'if (false) exemptedControls++;' },
  // Revision 7, owner D10: a registry row's exemptOverflow (with its owner decision) excuses the named box from component-overflow
  { name: 'D10 undone: exemptOverflow is ignored, the exempted chart canvas fails component-overflow', fixture: 'canvas-taller-than-box-exempt', rule: 'component-overflow', root: 'portal:0', expect: 'fail',
    from: 'if (exemptOverflow && el.closest(exemptOverflow)) exemptedOverflow++;', to: 'if (false) exemptedOverflow++;' },
  // Revision 7, owner 2026-10-17: text inside an svg is measured, overlapping text is a finding
  { name: 'text-overlap undone for svg: the overlapping turned labels go green', fixture: 'svg-labels-overlap', rule: 'text-overlap', root: 'portal:0', expect: 'pass',
    from: 'if (d > 1.5) add(', to: 'if (false) add(' },
  { name: 'svg overlap judged by axis-aligned boxes: the clear turned labels fail', fixture: 'svg-labels-clear', rule: 'text-overlap', root: 'portal:0', expect: 'fail',
    from: 'const d = penetration(a.poly, b.poly);', to: 'const d = (() => { const x = aabb(a.poly), y = aabb(b.poly); return Math.min(x.r, y.r) - Math.max(x.l, y.l) > 0 && Math.min(x.b, y.b) - Math.max(x.t, y.t) > 0 ? 5 : 0; })();' },
  { name: 'svg text that is not painted is measured: the unpainted overlapping labels fail', fixture: 'svg-labels-unpainted', rule: 'text-overlap', root: 'portal:0', expect: 'fail',
    from: 'if (!label || !svgPainted(t)) continue;', to: 'if (!label) continue;' },
  { name: 'text-overlap undone for page text: the lines printed on one another go green', fixture: 'html-text-overlap', rule: 'text-overlap', root: 'portal:0', expect: 'pass',
    from: 'if (w > 2 && h > 0.35 * Math.min(a.rect.height, b.rect.height)) add(', to: 'if (false) add(' },
  { name: 'page text overlap without its height bound: the tight stacked lines fail', fixture: 'html-lines-tight', rule: 'text-overlap', root: 'portal:0', expect: 'fail',
    from: 'h > 0.35 * Math.min(a.rect.height, b.rect.height)) add(', to: 'h > 0) add(' },
  { name: 'page text under an opaque box is measured: the covered text fails', fixture: 'html-text-under-opaque', rule: 'text-overlap', root: 'portal:0', expect: 'fail',
    from: 'if (coveredAt(cx, cy, a.el) || coveredAt(cx, cy, b.el)) continue;', to: '' },
  { name: 'page text is not cut by its clipping ancestors: the clipped-away row fails', fixture: 'html-text-clipped-away', rule: 'text-overlap', root: 'portal:0', expect: 'fail',
    from: 'const seen = visibleRect(e, r);', to: 'const seen = r;' },
  { name: 'svg-text-clipped undone: the label past its svg goes green', fixture: 'svg-label-clipped', rule: 'svg-text-clipped', root: 'portal:0', expect: 'pass',
    from: 'if (svgClips && (box.l', to: 'if (false && (box.l' },
  // Revision 11 (R52, found by AC36's final full run; r10-102-gen-fixtures.mjs): three gate fixes under R33 (i)
  { name: 'R33 (i) R52 undone: a point below the fold is never covered (the page is not scrolled to it)', fixture: 'html-text-under-opaque-below-fold', rule: 'text-overlap', root: 'app', expect: 'fail',
    from: 'if (outside) { // R33 (i) R52 below-the-fold cover: bring the point into the viewport', to: 'if (outside) return false; if (false) { // R33 (i) R52 below-the-fold cover: bring the point into the viewport' },
  { name: 'R33 (i) R52 undone: the text of an inert layer is never covered by the opaque panel above it', fixture: 'html-text-under-inert-dialog', rule: 'text-overlap', root: 'portal:0', expect: 'fail',
    from: "if (p.hasAttribute('inert')) {", to: 'if (false) {' }, // R53 moved the check: the `inert` attribute of the layer is taken off for the one hit-test query
  { name: 'R33 (i) R52 undone: a transient failure of the reopen of a dismissal check is not retried', file: 'runner', fixture: 'stylesheet-fails-on-reopen', flaky: true, retry: true, rule: 'dismiss-close-control', root: 'portal:0', expect: 'fail',
    from: 'if (!/^dismiss-/.test(rule)) continue;', to: 'continue;' },
  // Revision 12 (R53, R54; r12-02-gen-fixtures.mjs). R53's anchor covers both lines of R52's old branch: the whole stack counts as lying above the text AND any opaque box is a cover (C421). With R54 in
  // place the absolute card of the planted pages is no cover by itself, so reverting only the whole stack would leave them red; the mutation therefore restores the R52 branch as it was.
  { name: "R52's whole branch restored (R53 and R54 together): the whole stack counts as lying above the text and any opaque box covers it (an opaque card below an inert dialog hides the overlap)", fixture: 'html-text-over-inert-dialog-opaque-below', alsoFixtures: ['html-text-overlap-in-inert-dialog'], rule: 'text-overlap', root: 'portal:0', expect: 'pass',
    from: 'const upto = i; // R53: only what is painted above the text\n        const covers = (s) => isCover(s, el); // R54: only a pinned or floating box',
    to: 'const upto = stack.length; // R53 undone\n        const covers = () => true; // R53 undone' },
  // Revision 13 (R57; r13-02-gen-fixture.mjs). R53's own guard alone: R54's `isCover` stays, only `upto = i` is reverted to the whole stack for an inert layer (an unlocked text). The card of the fixture is
  // PINNED, so R54 counts it as a cover and only this guard keeps it from hiding the overlap.
  { name: 'R53 guard undone (R54 untouched): for an inert layer the whole stack counts as lying above the text (a pinned card below an inert dialog hides the overlap)', fixture: 'html-text-overlap-in-inert-dialog-pinned-below', rule: 'text-overlap', root: 'portal:0', expect: 'pass',
    from: 'const upto = i; // R53: only what is painted above the text', to: 'const upto = unlocked.length ? stack.length : i; // R53 guard undone' },
  { name: 'R54 (m1) undone: any opaque box counts as a cover (a map control over a popup title hides it)', fixture: 'html-text-under-control', alsoFixtures: ['html-text-under-control-below-fold'], rule: 'text-overlap', root: 'app', expect: 'pass',
    from: 'const covers = (s) => isCover(s, el); // R54: only a pinned or floating box', to: 'const covers = () => true; // R54 (m1) undone' },
  { name: 'R54 (m2) undone: a fixed or sticky box is no cover (the header pinned over scrolled text fails)', fixture: 'html-text-under-opaque', rule: 'text-overlap', root: 'portal:0', expect: 'fail',
    from: "if (csOf(p).position === 'fixed' || csOf(p).position === 'sticky') return true; // R54 (a): pinned", to: '// R54 (a) undone' },
  { name: 'R54 (m3) undone: an overlay (menu, dialog, listbox, tooltip, portal) is no cover (the menu over page text fails)', fixture: 'html-text-under-floating-menu', rule: 'text-overlap', root: 'app', expect: 'fail',
    from: 'if (p.matches(COVER_OVERLAY)) return true; // R54 (b): floating', to: '// R54 (b) undone' },
];

const server = await startStaticServer('scripts/__fixtures__/rendered-state-census', 6048);
const browser = await chromium.launch();
const ctx = repoRunner.fixtureContext('http://127.0.0.1:6048');
let proved = 0;
for (const m0 of MUTATIONS) {
  // Revision 12 (R53): `alsoFixtures` - the same mutation must prove EVERY named fixture; the mutation counts once, when all of them behave as expected
  let okAll = true;
  for (const fixtureName of [m0.fixture, ...(m0.alsoFixtures ?? [])]) {
  const m = { ...m0, fixture: fixtureName };
  const edited = m.file === 'runner' ? runnerSource : source;
  if (edited.split(m.from).length !== 2) { console.log(`NOT PROVED ${m.name}: the mutation anchor is not exactly once in ${m.file === 'runner' ? 'runner.mjs' : 'in-page.mjs'}`); okAll = false; continue; }
  const mod = m.file === 'runner' ? await mutatedRunner(m) : repoRunner;
  const initSource = m.file === 'runner' ? source : source.replace(m.from, m.to);
  const html = readFileSync(`scripts/__fixtures__/rendered-state-census/${m.fixture}.html`, 'utf8');
  const state = JSON.parse(html.match(/<script type="application\/json" id="census-state">(.*?)<\/script>/s)[1]);
  const newPage = async () => {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await p.addInitScript(`(${initSource.slice(initSource.indexOf('function installCensus'))})()`);
    return p;
  };
  let page = await newPage();
  let loads = 0;
  const caseCtx = m.flaky ? { ...ctx, urlFor: (t) => `${ctx.urlFor(t)}?load=${++loads}` } : ctx;
  // `prior` (R33, Story 059): a page loaded on the same page just before the job, which leaves a request in flight
  const job = async (p) => { if (m.prior) await mod.loadStory(p, caseCtx, { story: m.prior, state: 'prior', locale: 'en', width: 390 }); return mod.runStateJob(p, caseCtx, state, 'en', 390); };
  let rows;
  if (m.retry) ({ rows, page } = await mod.runWithRetry(job, page, async (old) => { await old.close().catch(() => {}); return newPage(); }));
  else rows = await job(page);
  const row = rows.find((r) => r.root === m.root);
  let failed = !!row?.rules[m.rule]?.length;
  let detailNote = '';
  if (m.detailRe) {
    // proved by one specific detail: present as delivered, absent with the clause dropped (the root may stay red for another detail)
    const base = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await base.addInitScript(`(${source.slice(source.indexOf('function installCensus'))})()`);
    const baseRow = (await repoRunner.runStateJob(base, ctx, state, 'en', 390)).find((r) => r.root === m.root);
    await base.close();
    const had = (baseRow?.rules[m.rule] ?? []).filter((d) => m.detailRe.test(d));
    const has = (row?.rules[m.rule] ?? []).filter((d) => m.detailRe.test(d));
    failed = has.length > 0 || had.length === 0; // "still fails" = the detail survives, or it never existed
    detailNote = ` [detail ${m.detailRe}: as delivered ${had.length} (${had[0] ?? '-'}), with the clause dropped ${has.length}]`;
  }
  const ok = m.expect === 'fail' ? failed : !failed;
  if (!ok) okAll = false;
  const verdict = m.detailRe
    ? (failed ? `still reports the detail${detailNote}` : `no longer reports the detail${detailNote}; the root itself stays red for the other detail(s)`)
    : m.expect === 'fail'
    ? (failed ? `fails ${m.rule} on ${m.root}: ${row.rules[m.rule][0].slice(0, 110)}` : `still passes ${m.rule} on ${m.root}`)
    : (failed ? `still fails ${m.rule} on ${m.root}` : `goes green on ${m.root} (${m.rule} empty)`);
  console.log(`${ok ? 'PROVED    ' : 'NOT PROVED'} ${m.name}: with it removed, ${m.expect === 'fail' ? 'the benign' : 'the planted'} fixture ${m.fixture} ${verdict}`);
  if (!ok || m.expect === 'pass') {
    // for the record: every failing rule of the root with the mutation applied, so a case that stays red for another reason shows
    console.log(`           observed on ${m.root} with the mutation: ${row ? Object.entries(row.rules).filter(([, v]) => v.length).map(([k, v]) => `${k} [${v[0].slice(0, 100)}]`).join(' ; ') || 'green' : '(root not measured)'}`);
  }
  await page.close();
  }
  if (okAll) proved++;
}
await browser.close();
await new Promise((r) => server.close(r));
console.log(`\n${proved} of ${MUTATIONS.length} proved.`);
process.exitCode = proved === MUTATIONS.length ? 0 : 1;
