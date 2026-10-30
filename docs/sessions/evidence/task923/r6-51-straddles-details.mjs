/**
 * r6-51-straddles-details.mjs - what `track-flex-slide-straddles` reports with and without the R25 clause (Task 923, R25).
 *
 *   node docs/sessions/evidence/task923/r6-51-straddles-details.mjs
 * Runs the fixture through a COPY of the in-page code, once as delivered and once with the clause "wholly inside the
 * clipper" dropped, and prints every `component-overflow` detail of the portal root. Nothing under the repository is written.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fixtureContext, runStateJob, startStaticServer } from '../../../../scripts/rendered-state-census/runner.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const source = readFileSync('scripts/rendered-state-census/in-page.mjs', 'utf8').replace('export function installCensus', 'function installCensus');
const FROM = "const trackSlideInFrame = pcs.transform !== 'none' && !!clipper && insidePaddingBox(er, clipper);";
const TO = "const trackSlideInFrame = pcs.transform !== 'none' && !!clipper;";
console.log(`platform ${process.platform} node ${process.version}`);
if (source.split(FROM).length !== 2) throw new Error('anchor not found exactly once');

const server = await startStaticServer('scripts/__fixtures__/rendered-state-census', 6049);
const browser = await chromium.launch();
const ctx = fixtureContext('http://127.0.0.1:6049');
for (const fixture of ['track-flex-slide-straddles', 'track-flex-synced']) {
  const html = readFileSync(`scripts/__fixtures__/rendered-state-census/${fixture}.html`, 'utf8');
  const state = JSON.parse(html.match(/<script type="application\/json" id="census-state">(.*?)<\/script>/s)[1]);
  for (const [label, code] of [['as delivered', source], ['clause "wholly inside the clipper" dropped', source.replace(FROM, TO)]]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    await page.addInitScript(`(${code.slice(code.indexOf('function installCensus'))})()`);
    const rows = await runStateJob(page, ctx, state, 'en', 390);
    const portal = rows.find((r) => r.root === 'portal:0');
    console.log(`\n${fixture} -- ${label}`);
    console.log(`  portal:0 component-overflow (${portal.rules['component-overflow'].length}):`);
    for (const d of portal.rules['component-overflow']) console.log(`    ${d}`);
    console.log(`  portal:0 other failing rules: ${Object.entries(portal.rules).filter(([k, v]) => k !== 'component-overflow' && v.length).map(([k, v]) => `${k} [${v[0]}]`).join(' ; ') || 'none'}`);
    await page.close();
  }
}
await browser.close();
await new Promise((r) => server.close(r));
