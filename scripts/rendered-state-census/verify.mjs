/**
 * verify.mjs — `--verify-gate` self-test of the rendered state census (Task 923, R6, R10–R13).
 *
 * Runs the SAME measuring code as the real gate on the fixture pages in
 * `scripts/__fixtures__/rendered-state-census/` served locally (no Storybook build, no repository file written).
 * Each fixture carries its own registry state in `<script id="census-state">`. The planted violations live only
 * inside the portal root while the app root stays green (and the reverse for the app-root cases), so a gate that
 * read the app root alone would pass them. Every exemption of a metric has a pair: the benign layout passes, and the
 * same shape with a real violation fails.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateRegistry } from './registry.mjs';
import { fixtureContext, loadStory, runClosedJob, runRangeJob, runStateJob, runWithRetry, summarize } from './runner.mjs';

const WIDTH = 390;
const LOCALE = 'en';

/**
 * `fail`: root -> rules that MUST be non-empty on that root. `green`: roots that must have no violation at all.
 * `detail`: root -> rule -> regex the rule's detail must match. `na`: root -> rules that must carry a notApplicable
 * reason. `closedOnly`: the closed sweep. `range`: { width, inRangeWidth } - the out-of-range widths job. `noPointer`:
 * the summary must list the case as having no pointer dismissal. Every PASS case asserts every rule of every root (`green`
 * lists the roots; a root in `green` has no violation of any rule). `flaky`: the page is served with `?load=<n>` (n counts
 * the loads of this case, reset per case) so a fixture can fail its first load only. `retry`: every row must carry `retry`
 * (R16), and `retryDetail` (default: an open timeout) is the pattern its first failure must match (R32: `resource failed: ...`); a case
 * without it must carry no `retry` key at all. `prior`: a fixture page loaded on the same page just before the case (it leaves a request in flight). `skipped`: root -> the least `skippedActions` it must record (R30);
 * `naAbsent`: root -> action rules that must NOT be in its `notApplicable`; `dismissMsAtLeast`: root -> dismissal mechanism -> the
 * least measured close time in ms (R28). `exempted`: root -> the least `exemptedControls` it must record (Task 923 R33, owner D9: controls a row's `exemptTargets` excuses from target-small). `exemptedText`: root -> the least `exemptedText` it must record (Task 923 R136, owner D84: text a row's `exemptText` excuses from text-ellipsis). Every row of every case must carry `skippedActions`, `dismissMs` and a `settle` that did
 * not hit its bound.
 */
export const CASES = [
  { name: 'clean', fail: {}, green: ['app', 'portal:0'] },
  { name: 'portal-overflow-only', fail: { 'portal:0': ['component-overflow', 'viewport-overflow'] }, green: ['app'] },
  { name: 'portal-clamp-only', fail: { 'portal:0': ['text-clamp'] }, green: ['app'] },
  { name: 'portal-word-split-only', fail: { 'portal:0': ['word-split'] }, green: ['app'] },
  { name: 'app-root-only', fail: { app: ['component-overflow', 'viewport-overflow'] }, green: ['portal:0'] },
  { name: 'unregistered-portal', closedOnly: true, fail: { app: ['unregistered-portal'] }, green: [] },
  { name: 'registered-opens-nothing', fail: { app: ['portal-count'] }, green: [] },
  { name: 'focus-escapes-trap', fail: { 'portal:0': ['focus-trap'] }, green: ['app'] },
  { name: 'escape-does-not-close', fail: { 'portal:0': ['dismiss-escape'] }, green: ['app'] },
  // R10 - the page's own scroll and the root's own box
  { name: 'page-scroll-only', fail: { app: ['viewport-overflow'] }, green: ['portal:0'], detail: { app: { 'viewport-overflow': /page scrolls sideways: scrollWidth \d+ > clientWidth \d+; deepest cause: .*pushed text/ } } },
  { name: 'root-box-past-viewport', fail: { app: ['viewport-overflow'] }, green: ['portal:0'], detail: { app: { 'viewport-overflow': /^div .* x 0\.\.\d+ outside 0\.\.390$/ } } },
  // R11 - negative margin, bounded by its own size
  { name: 'neg-margin-overflow', fail: { 'portal:0': ['component-overflow'] }, green: ['app'] },
  { name: 'neg-margin-fullbleed', fail: {}, green: ['app', 'portal:0'] },
  // R11 - table box parent
  { name: 'table-cell-overflow', fail: { 'portal:0': ['component-overflow'] }, green: ['app'] },
  { name: 'table-rowspan', fail: {}, green: ['app', 'portal:0'] },
  // R11 - clipped-away slide
  { name: 'slide-carousel', fail: {}, green: ['app', 'portal:0'] },
  { name: 'slide-hidden-content', fail: { 'portal:0': ['component-overflow'] }, green: ['app'] },
  // R11 - text-hidden inner box
  { name: 'text-inner-box', fail: {}, green: ['app', 'portal:0'] },
  { name: 'text-cut', fail: { 'portal:0': ['text-hidden'] }, green: ['app'] },
  // Revision 7 (Story 018): text that is not painted (a loading button's label slid out under its spinner) is not hidden text
  { name: 'loading-label-invisible', fail: {}, green: ['app', 'portal:0'] },
  // Revision 7 (owner D9, RangeDatePicker day cells): a registry row's exemptTargets + ownerDecision excuses the named controls from target-small, counted in the row; the same buttons without it fail
  { name: 'day-cells-exempt', fail: {}, green: ['app', 'portal:0'], exempted: { 'portal:0': 3 } },
  { name: 'day-cells-unexempt', fail: { 'portal:0': ['target-small'] }, green: ['app'] },
  // Revision 7 (owner D10, semi-donut canvas): a registry row's exemptOverflow + ownerDecision excuses the named box (and what lies inside it) from component-overflow, counted in the row;
  // the same canvas without it fails
  { name: 'canvas-taller-than-box-exempt', fail: {}, green: ['app', 'portal:0'], exemptedOverflow: { 'portal:0': 1 } },
  // Revision 7 (owner 2026-10-17): text inside an svg is measured; overlapping text is a finding in the page and in an svg
  { name: 'svg-labels-overlap', fail: { 'portal:0': ['text-overlap'] }, green: ['app'] },
  { name: 'svg-labels-clear', fail: {}, green: ['app', 'portal:0'] },
  { name: 'svg-labels-unpainted', fail: {}, green: ['app', 'portal:0'] },
  { name: 'svg-label-clipped', fail: { 'portal:0': ['svg-text-clipped'] }, green: ['app'] },
  { name: 'html-text-overlap', fail: { 'portal:0': ['text-overlap'] }, green: ['app'] },
  { name: 'html-lines-tight', fail: {}, green: ['app', 'portal:0'] },
  { name: 'html-text-under-opaque', fail: {}, green: ['app', 'portal:0'] },
  { name: 'html-text-clipped-away', fail: {}, green: ['app', 'portal:0'] },
  { name: 'canvas-taller-than-box-unexempt', fail: { 'portal:0': ['component-overflow'] }, green: ['app'] },
  // Revision 40 (owner D84, a vendor's own sign-in button): a registry row's exemptText + ownerDecision excuses the label's ellipsis CSS from text-ellipsis, counted in the row;
  // the same button without it fails
  { name: 'vendor-label-exempt', fail: {}, green: ['app', 'portal:0'], exemptedText: { 'portal:0': 1 } },
  { name: 'vendor-label-unexempt', fail: { 'portal:0': ['text-ellipsis'] }, green: ['app'] },
  // Revision 7 (Story 059): a closed Drawer kept mounted in the shared portal root does not make a popover modal
  { name: 'hidden-drawer-popover', fail: {}, green: ['app', 'portal:0'] },
  // Revision 7 (Story 059): a link under a fixed page header is reached by scrolling the page
  { name: 'sticky-header-covers-link', fail: {}, green: ['app', 'portal:0'] },
  // Revision 7 (Story 073): a ScrollArea shape - the row is reached by scrolling the viewport, through a wrapper with visible overflow
  { name: 'scroll-viewport-wrapper', fail: {}, green: ['app', 'portal:0'] },
  // Revision 7 (Story 075): an e-mail wider than its box breaks inside the word by design (GR-3i, Task 859 R85)
  { name: 'email-longer-than-box', fail: {}, green: ['app', 'portal:0'] },
  // Revision 7 (Story 149): the touch area of an input in a bordered wrapper is the wrapper
  { name: 'bordered-input-wrapper', fail: {}, green: ['app', 'portal:0'] },
  // Revision 7 (Story 176): the items of a horizontally scrolling rail lie past the viewport edge by design
  { name: 'scroll-rail-past-viewport', fail: {}, green: ['app', 'portal:0'] },
  // Revision 7 (Story 199): an inert (covered) dialog's controls are skipped by the action rules and counted
  { name: 'inert-dialog-covered', fail: {}, green: ['app', 'portal:0'], skipped: { 'portal:0': 1 } },
  // Revision 7 (Story 021): a wide row inside a parent that scrolls horizontally is reached by scrolling
  { name: 'scroll-row-in-dialog', fail: {}, green: ['app', 'portal:0'] },
  // R11 - hidden away from the viewport
  { name: 'hidden-away-clipped', fail: {}, green: ['app', 'portal:0'] },
  { name: 'hidden-away-wide-clipper', fail: { 'portal:0': ['viewport-overflow'] }, green: ['app'] },
  // R11 - off-canvas panel
  { name: 'offcanvas-closed-panel', fail: {}, green: ['app', 'portal:0'] },
  { name: 'offcanvas-open-overflow', fail: { app: ['viewport-overflow'] }, green: ['portal:0'] },
  // R11 - stacked dialog
  { name: 'stacked-dialogs', fail: {}, green: ['app', 'portal:0', 'portal:1'] },
  { name: 'covered-action', fail: { 'portal:0': ['action-covered'] }, green: ['app'] },
  // R12 - widths
  { name: 'widths-contradicted', range: { width: 390, inRangeWidth: 640 }, fail: { app: ['widths-mismatch'] }, green: [] },
  { name: 'widths-honoured', range: { width: 390, inRangeWidth: 640 }, fail: {}, green: ['app'] },
  // a sibling row of the same Story whose trigger IS the element that opens excuses it; a sibling with another trigger does not
  { name: 'widths-sibling-covers', fixture: 'widths-contradicted', range: { width: 390, inRangeWidth: 640, siblings: [{ id: 'twin-row', story: 'fixture-story', open: { kind: 'click', selector: '#open' }, portals: 1, focus: 'trap', dismiss: ['escape'], trigger: '#open' }] }, fail: {}, green: ['app'], na: { app: ['widths-mismatch'] } },
  { name: 'widths-sibling-other-element', fixture: 'widths-contradicted', range: { width: 390, inRangeWidth: 640, siblings: [{ id: 'other-row', story: 'fixture-story', open: { kind: 'click', selector: '#nothing' }, portals: 1, focus: 'trap', dismiss: ['escape'], trigger: '#nothing' }] }, fail: { app: ['widths-mismatch'] }, green: [] },
  // R13 - not applicable is evidence
  { name: 'sheet-no-pointer-dismissal', fail: {}, green: ['app', 'portal:0'], noPointer: true, na: { app: ['action-hidden', 'action-covered', 'target-small'], 'portal:0': ['dismiss-close-control', 'dismiss-outside'] } },
  // R15 - positioned and transformed content is bounded by its clipping ancestor or its overlay panel
  { name: 'abs-past-panel', fail: { 'portal:0': ['component-overflow'] }, green: ['app'], detail: { 'portal:0': { 'component-overflow': /\(absolute\) x [\d.]+\.\.[\d.]+ past div\.dialog/ } } },
  { name: 'abs-badge-inside', fail: {}, green: ['app', 'portal:0'] },
  { name: 'transform-past-panel', fail: { 'portal:0': ['component-overflow'] }, green: ['app'], detail: { 'portal:0': { 'component-overflow': /\(transformed\) x [\d.]+\.\.[\d.]+ past div\.dialog/ } } },
  { name: 'transform-inside', fail: {}, green: ['app', 'portal:0'] },
  { name: 'abs-past-clipper', fail: { 'portal:0': ['component-overflow'] }, green: ['app'], detail: { 'portal:0': { 'component-overflow': /\(absolute\) x [\d.]+\.\.[\d.]+ past div/ } } },
  { name: 'abs-inside-clipper', fail: {}, green: ['app', 'portal:0'] },
  // R19 - two bounded exemptions for positioned / transformed content: a media-only slide clipped away on a transformed
  // track, and an image that covers its clipping frame. Each has a planted twin that is not exempt.
  { name: 'positioned-slide-away', fail: {}, green: ['app', 'portal:0'] },
  { name: 'positioned-slide-away-control', fail: { 'portal:0': ['component-overflow'] }, green: ['app'], detail: { 'portal:0': { 'component-overflow': /^div .* \(transformed\) x [\d.]+\.\.[\d.]+ past div [\d.]+\.\.[\d.]+/ } } },
  { name: 'media-cover-zoom', fail: {}, green: ['app', 'portal:0'] },
  { name: 'media-shifted-past-frame', fail: { 'portal:0': ['component-overflow'] }, green: ['app'], detail: { 'portal:0': { 'component-overflow': /^img "" \(absolute\+transformed\) x [\d.]+\.\.[\d.]+ past div/ } } },
  { name: 'text-scaled-past-frame', fail: { 'portal:0': ['component-overflow'] }, green: ['app'], detail: { 'portal:0': { 'component-overflow': /^div "Scaled text block" \(absolute\+transformed\) x [\d.]+\.\.[\d.]+ past div/ } } },
  // R22 - a clipped-away track is judged on what lies outside its frame only: an off-screen slide must be out of the tab
  // order AND hidden from assistive technology; a slide inside the frame is visible content with its own paths.
  // R24 - the off-screen slide buttons of the benign shape are clipped away, hidden from AT and out of the tab order, so the
  // action rules skip them: the PASS case is green on every rule of every root. An off-screen button that is only
  // aria-hidden (still tabbable) is a real action covered by the dialog: it fails `action-covered` as well.
  { name: 'track-active-slide-inside', fail: {}, green: ['app', 'portal:0'] },
  { name: 'track-offscreen-slide-tabbable', fail: { 'portal:0': ['component-overflow'] }, green: ['app'], detail: { 'portal:0': { 'component-overflow': /^div "" \(transformed\) x [\d.]+\.\.[\d.]+ past div [\d.]+\.\.[\d.]+ holds button "Slide one"/ } } },
  { name: 'track-offscreen-slide-aria-only', fail: { 'portal:0': ['component-overflow', 'action-covered'] }, green: ['app'], detail: { 'portal:0': { 'component-overflow': /^div "" \(transformed\) x [\d.]+\.\.[\d.]+ past div [\d.]+\.\.[\d.]+ holds button ""/ } } },
  // R24 - the skip needs BOTH halves: a hidden, untabbable control that lies inside its frame is measured
  { name: 'visible-hidden-control-covered', fail: { 'portal:0': ['action-covered'] }, green: ['app'] },
  // R25 - an in-flow slide of a transformed track is judged against the frame, not against the displaced track box
  // R30 - the skip count is its own key: `skippedActions` >= 1 on the portal root, and no action rule is "not applicable" there
  { name: 'track-flex-synced', fail: {}, green: ['app', 'portal:0'], skipped: { 'portal:0': 1 }, naAbsent: { 'portal:0': ['action-hidden', 'action-covered', 'target-small'] } },
  { name: 'track-flex-slide-straddles', fail: { 'portal:0': ['component-overflow'] }, green: ['app'] },
  { name: 'inflow-past-untransformed-parent', fail: { 'portal:0': ['component-overflow'] }, green: ['app'], detail: { 'portal:0': { 'component-overflow': /^div "Wide text block" x [\d.]+\.\.[\d.]+ past div [\d.]+\.\.[\d.]+/ } } },
  // R26 - the settled state: an infinite animation never holds the census back; a focus that is on body for 80ms is no leak
  { name: 'infinite-spinner-toast', fail: {}, green: ['app', 'portal:0'] },
  { name: 'trap-transient-body-focus', fail: {}, green: ['app', 'portal:0'] },
  // R16 - one recorded retry for a transient; a second failure is the violation. `flaky`: the page URL carries ?load=<n>.
  { name: 'open-flaky-once', flaky: true, retry: true, fail: {}, green: ['app', 'portal:0'] },
  { name: 'open-never', retry: true, fail: { app: ['open-failed'] }, green: [] },
  // R28 - a dismissal is judged on whether the overlay closes, not how fast: each mechanism closes it 1500ms late
  { name: 'slow-close', fail: {}, green: ['app', 'portal:0'], dismissMsAtLeast: { 'portal:0': { escape: 1500, 'close-control': 1500, outside: 1500 } } },
  // R29 - a retry replaces the first attempt: its closed-page violation on the app root is not carried into the result
  { name: 'open-flaky-once-closed-violation', flaky: true, retry: true, fail: {}, green: ['app', 'portal:0'] },
  // R31 - a page that loads late is measured once settled: (c) a request in flight, (d) a layout that is still changing
  { name: 'late-fetch-overflow', fail: { 'portal:0': ['component-overflow'] }, green: ['app'], detail: { 'portal:0': { 'component-overflow': /^div "Late text block" x [\d.]+\.\.[\d.]+ past div [\d.]+\.\.[\d.]+/ } } },
  { name: 'late-fetch-inside', fail: {}, green: ['app', 'portal:0'] },
  { name: 'raf-grow-overflow', fail: { 'portal:0': ['component-overflow'] }, green: ['app'], detail: { 'portal:0': { 'component-overflow': /^div "Growing text block" x [\d.]+\.\.[\d.]+ past div [\d.]+\.\.[\d.]+/ } } },
  { name: 'raf-grow-inside', fail: {}, green: ['app', 'portal:0'] },
  // R32 - a same-origin document / script / stylesheet that fails is a load failure, retried once; a fetch that answers 404 is not one
  { name: 'stylesheet-fails-once', flaky: true, retry: true, retryDetail: /^resource failed: stylesheet \/census-target\.css\?__census_status=503 \(status 503, CENSUS_STATUS\)$/, fail: {}, green: ['app', 'portal:0'] },
  { name: 'stylesheet-missing', retry: true, retryDetail: /^resource failed: stylesheet \/census-missing\.css \(status 404\)/, fail: { app: ['error-screen'] }, green: [], detail: { app: { 'error-screen': /^resource failed: stylesheet \/census-missing\.css \(status 404\)/ } } },
  { name: 'fetch-404-benign', fail: {}, green: ['app', 'portal:0'] },
  // R33 (Story 059) - the navigation that leaves a page aborts the requests that page still had in flight; that abort is the old page's, not the new one's
  { name: 'stale-abort-benign', fixture: 'clean', prior: 'stale-script-pending', fail: {}, green: ['app', 'portal:0'] },
  // R52 / R33 (i) - found by AC36's final full run. `coveredAt` answered only for a point inside the viewport: text covered by an opaque box below the fold failed
  // while the same pair inside the viewport passed; the twin (two lines on one another, nothing over them) must still fail below the fold
  { name: 'html-text-under-opaque-below-fold', fail: {}, green: ['app', 'portal:0'] },
  { name: 'html-text-overlap-below-fold', fail: { app: ['text-overlap'] }, green: ['portal:0'] },
  // R52 / R33 (i) - the text of an inert layer under a modal is not hit-testable, so the opaque panel above it was never found; the twin with a transparent panel above must fail
  { name: 'html-text-under-inert-dialog', fail: {}, green: ['app', 'portal:0'] },
  { name: 'html-text-over-inert-dialog', fail: { 'portal:0': ['text-overlap'] }, green: ['app'] },
  // R52 / R33 (i) - the reopen of a dismissal check is an open: a transient resource failure on that load is retried once like any other load failure (the stylesheet is answered 503 on the SECOND load)
  { name: 'stylesheet-fails-on-reopen', flaky: true, retry: true, retryDetail: /^resource failed: stylesheet \/census-target\.css\?__census_status=503 \(status 503, CENSUS_STATUS\)$/, fail: {}, green: ['app', 'portal:0'] },
  // R53 (review 12 finding 1) - the text of an inert layer is covered only by what is painted ABOVE it: an opaque card of the page below the dialog hides nothing (the two titles are seen), and two lines
  // overlapping inside the inert dialog, with nothing above them, fail whatever the page holds below
  { name: 'html-text-over-inert-dialog-opaque-below', fail: { 'portal:0': ['text-overlap'] }, green: ['app'] },
  { name: 'html-text-overlap-in-inert-dialog', fail: { 'portal:0': ['text-overlap'] }, green: ['app'] },
  // R57 (review 13 finding 1) - R53's own guard: the same two lines inside the inert dialog with one card PINNED (`position: fixed`) in the app root below the portal; the card passes R54's test, so only
  // "only what is painted above the text counts" keeps it from hiding the overlap
  { name: 'html-text-overlap-in-inert-dialog-pinned-below', fail: { 'portal:0': ['text-overlap'] }, green: ['app'] },
  // R54 (review 12 finding 2) - an opaque box hides text only when it is pinned (fixed / sticky) or floating (dialog, menu, listbox, tooltip, portal) over it; a map control over a popup's title is neither
  { name: 'html-text-under-floating-menu', fail: {}, green: ['app', 'portal:0'] },
  { name: 'html-text-under-control', fail: { app: ['text-overlap'] }, green: ['portal:0'] },
  { name: 'html-text-under-control-below-fold', fail: { app: ['text-overlap'] }, green: ['portal:0'] },
];

function readFixtureState(fixtureDir, name) {
  const html = readFileSync(join(fixtureDir, `${name}.html`), 'utf8');
  const m = html.match(/<script type="application\/json" id="census-state">(.*?)<\/script>/s);
  if (!m) throw new Error(`fixture ${name}.html has no inline census-state registry`);
  return JSON.parse(m[1]);
}

const failingRules = (row) => Object.entries(row.rules).filter(([, v]) => v.length).map(([k]) => k);

export async function verifyGate({ fixtureDir, baseUrl, newPage, breakpoints, log }) {
  const ctx = fixtureContext(baseUrl);
  let page = await newPage();
  const freshPage = async (old) => {
    await old.close().catch(() => {});
    return newPage();
  };
  // the load counter of a `flaky` case: a fresh context per case is the reset
  const flakyContext = () => {
    let loads = 0;
    return { ...ctx, urlFor: (target) => `${ctx.urlFor(target)}?load=${++loads}` };
  };
  let behaves = true;
  log('check-rendered-state-census.mjs --verify-gate (fixtures served locally, no Storybook build)\n');
  try {
    for (const c of CASES) {
      let rows;
      let state = null;
      const caseCtx = c.flaky ? flakyContext() : ctx;
      let run;
      if (c.closedOnly) {
        run = (p) => runClosedJob(p, caseCtx, c.name, false);
      } else {
        state = readFixtureState(fixtureDir, c.fixture ?? c.name);
        const check = validateRegistry({ version: 1, states: [{ ...state, story: 'fixture-story' }] }, { breakpoints });
        if (!check.ok) {
          behaves = false;
          log(`FAIL ${c.name}: its inline registry state is invalid: ${check.errors.join('; ')}`);
          continue;
        }
        run = c.range
          ? (p) => runRangeJob(p, caseCtx, state, LOCALE, c.range.width, { inRangeWidth: c.range.inRangeWidth, siblings: c.range.siblings ?? [] })
          : (p) => runStateJob(p, caseCtx, state, LOCALE, WIDTH);
      }
      // `prior`: a page loaded on the SAME measuring page just before the case, which leaves a request in flight (R33, Story 059)
      if (c.prior) await loadStory(page, caseCtx, { story: c.prior, state: 'prior', locale: LOCALE, width: WIDTH });
      // the same retry wrapper as the real pool: one fresh-page retry for a transient load / open failure (R16)
      ({ rows, page } = await runWithRetry(run, page, freshPage));
      const byRoot = Object.fromEntries(rows.map((r) => [r.root, r]));
      const problems = [];
      if (rows.length === 0) problems.push('the case measured no root at all');
      for (const row of rows) {
        if (!row.notApplicable || typeof row.notApplicable !== 'object') problems.push(`row ${row.root} has no notApplicable map`);
        if (typeof row.skippedActions !== 'number') problems.push(`row ${row.root} has no numeric skippedActions (R30)`);
        if (!row.dismissMs || typeof row.dismissMs !== 'object') problems.push(`row ${row.root} has no dismissMs map (R28)`);
        if (!row.settle || typeof row.settle.ms !== 'number' || typeof row.settle.bounded !== 'boolean') problems.push(`row ${row.root} has no settle { ms, bounded } (R31)`);
        else if (row.settle.bounded && !JSON.stringify(c.fail).includes('portal-count')) problems.push(`row ${row.root} hit the settle bound (${row.settle.ms}ms): the fixture page never settled`);
      }
      for (const row of rows) {
        if (c.retry && !(c.retryDetail ?? /Timeout \d+ms exceeded/).test(row.retry ?? '')) problems.push(`row ${row.root} should record the retry (the first failure), has ${JSON.stringify(row.retry)}`);
        if (!c.retry && 'retry' in row) problems.push(`row ${row.root} carries a retry key although the job was not retried`);
      }
      for (const root of c.green) {
        const r = byRoot[root];
        if (!r) problems.push(`root ${root} was not measured`);
        else if (!r.pass) problems.push(`root ${root} should be green but fails: ${failingRules(r).join(', ')}`);
      }
      for (const [root, rules] of Object.entries(c.fail)) {
        const r = byRoot[root];
        if (!r) { problems.push(`root ${root} was not measured`); continue; }
        for (const rule of rules) if (!r.rules[rule]?.length) problems.push(`root ${root} should fail "${rule}" but does not`);
      }
      for (const [root, byRule] of Object.entries(c.detail ?? {})) {
        for (const [rule, re] of Object.entries(byRule)) {
          const text = (byRoot[root]?.rules[rule] ?? []).join(' | ');
          if (!re.test(text)) problems.push(`root ${root} "${rule}" detail does not name the cause (${re}): ${text || '(empty)'}`);
        }
      }
      for (const [root, rules] of Object.entries(c.na ?? {})) {
        for (const rule of rules) if (!byRoot[root]?.notApplicable?.[rule]) problems.push(`root ${root} should record "${rule}" as not applicable, with a reason`);
      }
      for (const [root, min] of Object.entries(c.skipped ?? {})) {
        if (!(byRoot[root]?.skippedActions >= min)) problems.push(`root ${root} should record skippedActions >= ${min}, has ${byRoot[root]?.skippedActions}`);
      }
      for (const [root, min] of Object.entries(c.exemptedOverflow ?? {})) {
        if (!(byRoot[root]?.exemptedOverflow >= min)) problems.push(`root ${root} should record exemptedOverflow >= ${min}, has ${byRoot[root]?.exemptedOverflow}`);
      }
      for (const [root, min] of Object.entries(c.exemptedText ?? {})) {
        if (!(byRoot[root]?.exemptedText >= min)) problems.push(`root ${root} should record exemptedText >= ${min}, has ${byRoot[root]?.exemptedText}`);
      }
      for (const [root, min] of Object.entries(c.exempted ?? {})) {
        if (!(byRoot[root]?.exemptedControls >= min)) problems.push(`root ${root} should record exemptedControls >= ${min}, has ${byRoot[root]?.exemptedControls}`);
      }
      for (const [root, rules] of Object.entries(c.naAbsent ?? {})) {
        for (const rule of rules) if (byRoot[root]?.notApplicable?.[rule]) problems.push(`root ${root} should not carry "${rule}" in notApplicable (the skip count is skippedActions): ${byRoot[root].notApplicable[rule]}`);
        for (const key of Object.keys(byRoot[root]?.notApplicable ?? {})) if (key.startsWith('action-')) problems.push(`root ${root} carries "${key}" in notApplicable`);
      }
      for (const [root, byMechanism] of Object.entries(c.dismissMsAtLeast ?? {})) {
        for (const [mechanism, min] of Object.entries(byMechanism)) {
          const ms = byRoot[root]?.dismissMs?.[mechanism];
          if (!(typeof ms === 'number' && ms >= min)) problems.push(`root ${root} dismissMs.${mechanism} should be a close time >= ${min}ms, is ${JSON.stringify(ms)}`);
        }
      }
      if (c.noPointer) {
        const s = summarize(rows, {}, state ? [{ ...state, story: rows[0]?.story }] : []);
        if (s.noPointerDismissal.length !== 1) problems.push(`the summary should list the case once as having no pointer dismissal, lists ${s.noPointerDismissal.length}`);
      }
      const expectedFail = Object.entries(c.fail).map(([root, rules]) => `${root}: ${rules.join(' + ')}`).join('; ');
      const observed = rows.map((r) => `${r.root} ${r.pass ? 'green' : failingRules(r).join('+')}`).join(' | ');
      // The label is the GATE's verdict on the fixture (every rule of every root); "as stated" says whether that is the
      // verdict the case requires.
      const gateVerdict = rows.length > 0 && rows.every((r) => r.pass) ? 'PASS' : 'FAIL';
      const retryNote = c.retry ? `; retry recorded (${(rows[0].retry ?? '').slice(0, 60)}...)` : '';
      const naNote = retryNote + (c.na ? `; not applicable recorded: ${Object.entries(c.na).map(([root, rules]) => `${root}: ${rules.join(' + ')}`).join('; ')}${c.noPointer ? '; listed with no pointer dismissal' : ''}` : '');
      if (problems.length === 0) {
        log(`${gateVerdict} ${c.name.padEnd(28)} as stated: ${expectedFail ? expectedFail : 'every root green'}${naNote}   [observed: ${observed}]`);
      } else {
        behaves = false;
        log(`${gateVerdict} ${c.name.padEnd(28)} NOT as stated: ${problems.join('; ')}   [observed: ${observed}]`);
      }
    }
  } finally {
    await page.close();
  }
  log(behaves ? '\nverify-gate: every case behaves as stated.' : '\nverify-gate: AT LEAST ONE CASE DOES NOT BEHAVE AS STATED.');
  return behaves;
}
