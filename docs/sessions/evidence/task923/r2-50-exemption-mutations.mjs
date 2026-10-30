/**
 * r2-50-exemption-mutations.mjs - proof that every benign fixture passes BECAUSE of its exemption (Task 923, R11)
 *
 *   node docs/sessions/evidence/task923/r2-50-exemption-mutations.mjs
 * For each exemption of the component-overflow / viewport-overflow / action-covered / text-hidden metrics, a copy of the
 * in-page measuring code is mutated so that the exemption no longer applies, and the benign fixture of its pair is run
 * through it. The benign fixture must then FAIL the named rule: if it still passed, the fixture would not prove the
 * exemption. Nothing under the repository is written.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fixtureContext, runStateJob, startStaticServer } from '../../../../scripts/rendered-state-census/runner.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const source = readFileSync('scripts/rendered-state-census/in-page.mjs', 'utf8').replace('export function installCensus', 'function installCensus');

const MUTATIONS = [
  { name: 'negative margin exempts only its own size', fixture: 'neg-margin-fullbleed', rule: 'component-overflow', root: 'portal:0',
    from: 'const overBeyond = (over, margin) => over > 0.5 && !(margin < 0 && over <= -margin + 0.5);', to: 'const overBeyond = (over) => over > 0.5;' },
  { name: 'table box parent (the table algorithm places its own rows)', fixture: 'table-rowspan', rule: 'component-overflow', root: 'portal:0',
    from: 'const tableExempt = tableBox && !(pcs.display', to: 'const tableExempt = false && !(pcs.display' },
  { name: 'slide clipped away by design', fixture: 'slide-carousel', rule: 'component-overflow', root: 'portal:0',
    from: 'clippedAway = wholly && (/auto|scroll/.test(csOf(clipper).overflowX) || transformedBetween(e, clipper));', to: 'clippedAway = false;' },
  { name: 'text-hidden: text really outside the padding box', fixture: 'text-inner-box', rule: 'text-hidden', root: 'portal:0',
    from: '&& textPastBox(e)) {', to: ') {' },
  { name: 'viewport: hidden away by an ancestor inside the viewport', fixture: 'hidden-away-clipped', rule: 'viewport-overflow', root: 'portal:0',
    from: 'if (offCanvas(e, r) || hiddenAwayFrom(e, root)) continue;', to: 'if (offCanvas(e, r)) continue;' },
  { name: 'viewport: closed off-canvas fixed panel', fixture: 'offcanvas-closed-panel', rule: 'viewport-overflow', root: 'app',
    from: 'if (offCanvas(e, r) || hiddenAwayFrom(e, root)) continue;', to: 'if (hiddenAwayFrom(e, root)) continue;' },
  { name: 'action covered by a dialog in another portal root', fixture: 'stacked-dialogs', rule: 'action-covered', root: 'portal:0',
    from: 'const stacked = !!aPortal && !!hitPortal && aPortal !== hitPortal;', to: 'const stacked = false;' },
];

const server = await startStaticServer('scripts/__fixtures__/rendered-state-census', 6048);
const browser = await chromium.launch();
const ctx = fixtureContext('http://127.0.0.1:6048');
let allProved = true;
for (const m of MUTATIONS) {
  if (!source.includes(m.from)) { console.log(`FAIL ${m.name}: the mutation anchor is not in in-page.mjs`); allProved = false; continue; }
  const mutated = source.replace(m.from, m.to);
  const html = readFileSync(`scripts/__fixtures__/rendered-state-census/${m.fixture}.html`, 'utf8');
  const state = JSON.parse(html.match(/<script type="application\/json" id="census-state">(.*?)<\/script>/s)[1]);
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await page.addInitScript(`(${mutated.slice(mutated.indexOf('function installCensus'))})()`);
  const rows = await runStateJob(page, ctx, state, 'en', 390);
  const row = rows.find((r) => r.root === m.root);
  const failed = !!row?.rules[m.rule]?.length;
  if (!failed) allProved = false;
  console.log(`${failed ? 'PROVED ' : 'NOT PROVED'} ${m.name}: with the exemption removed, ${m.fixture} ${failed ? `fails ${m.rule} on ${m.root}: ${row.rules[m.rule][0].slice(0, 110)}` : `still passes ${m.rule} on ${m.root}`}`);
  await page.close();
}
await browser.close();
await new Promise((r) => server.close(r));
console.log(allProved ? '\nevery exemption is load-bearing for its benign fixture.' : '\nAT LEAST ONE EXEMPTION IS NOT PROVED BY ITS FIXTURE.');
process.exitCode = allProved ? 0 : 1;
