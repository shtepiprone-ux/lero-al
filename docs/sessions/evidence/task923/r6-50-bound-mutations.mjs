/**
 * r6-50-bound-mutations.mjs - proof that every bound of the overflow metrics is load-bearing (Task 923, R11, R15, R19, R22)
 *
 *   node docs/sessions/evidence/task923/r6-50-bound-mutations.mjs
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
 * 21 of 21 must be proved.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fixtureContext, runStateJob, startStaticServer } from '../../../../scripts/rendered-state-census/runner.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const source = readFileSync('scripts/rendered-state-census/in-page.mjs', 'utf8').replace('export function installCensus', 'function installCensus');

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
];

const server = await startStaticServer('scripts/__fixtures__/rendered-state-census', 6048);
const browser = await chromium.launch();
const ctx = fixtureContext('http://127.0.0.1:6048');
let proved = 0;
for (const m of MUTATIONS) {
  if (source.split(m.from).length !== 2) { console.log(`NOT PROVED ${m.name}: the mutation anchor is not exactly once in in-page.mjs`); continue; }
  const mutated = source.replace(m.from, m.to);
  const html = readFileSync(`scripts/__fixtures__/rendered-state-census/${m.fixture}.html`, 'utf8');
  const state = JSON.parse(html.match(/<script type="application\/json" id="census-state">(.*?)<\/script>/s)[1]);
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await page.addInitScript(`(${mutated.slice(mutated.indexOf('function installCensus'))})()`);
  const rows = await runStateJob(page, ctx, state, 'en', 390);
  const row = rows.find((r) => r.root === m.root);
  let failed = !!row?.rules[m.rule]?.length;
  let detailNote = '';
  if (m.detailRe) {
    // proved by one specific detail: present as delivered, absent with the clause dropped (the root may stay red for another detail)
    const base = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await base.addInitScript(`(${source.slice(source.indexOf('function installCensus'))})()`);
    const baseRow = (await runStateJob(base, ctx, state, 'en', 390)).find((r) => r.root === m.root);
    await base.close();
    const had = (baseRow?.rules[m.rule] ?? []).filter((d) => m.detailRe.test(d));
    const has = (row?.rules[m.rule] ?? []).filter((d) => m.detailRe.test(d));
    failed = has.length > 0 || had.length === 0; // "still fails" = the detail survives, or it never existed
    detailNote = ` [detail ${m.detailRe}: as delivered ${had.length} (${had[0] ?? '-'}), with the clause dropped ${has.length}]`;
  }
  const ok = m.expect === 'fail' ? failed : !failed;
  if (ok) proved++;
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
await browser.close();
await new Promise((r) => server.close(r));
console.log(`\n${proved} of ${MUTATIONS.length} proved.`);
process.exitCode = proved === MUTATIONS.length ? 0 : 1;
