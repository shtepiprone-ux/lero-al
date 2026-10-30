/**
 * r5-50-bound-mutations.mjs - proof that every bound of the overflow metrics is load-bearing (Task 923, R11, R15, R19, R22)
 *
 *   node docs/sessions/evidence/task923/r5-50-bound-mutations.mjs
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
 * 15 of 15 must be proved.
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
  const failed = !!row?.rules[m.rule]?.length;
  const ok = m.expect === 'fail' ? failed : !failed;
  if (ok) proved++;
  const verdict = m.expect === 'fail'
    ? (failed ? `fails ${m.rule} on ${m.root}: ${row.rules[m.rule][0].slice(0, 110)}` : `still passes ${m.rule} on ${m.root}`)
    : (failed ? `still fails ${m.rule} on ${m.root}` : `goes green on ${m.root} (${m.rule} empty)`);
  console.log(`${ok ? 'PROVED    ' : 'NOT PROVED'} ${m.name}: with it removed, ${m.expect === 'fail' ? 'the benign' : 'the planted'} fixture ${m.fixture} ${verdict}`);
  await page.close();
}
await browser.close();
await new Promise((r) => server.close(r));
console.log(`\n${proved} of ${MUTATIONS.length} proved.`);
process.exitCode = proved === MUTATIONS.length ? 0 : 1;
