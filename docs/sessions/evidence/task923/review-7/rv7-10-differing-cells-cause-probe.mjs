// Task 923 review 7 (Opus, diagnosis only). The three cells where r7-full-a and r7-full-b differ outside C118.
// A: activity-error~about-visible-listings uk 320 - is run a's row the row of a page whose same-origin stylesheet failed?
// B: share-listing en 320 - does Escape fail only when it is pressed near the 2 000ms `copied` reset of ListingShareButton?
// C: archived-listing (any state) sq 390 - does the Leaflet popup width follow the arrival time of the cross-origin leaflet.css?
//   node docs/sessions/evidence/task923/review-7/rv7-10-differing-cells-cause-probe.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startStaticServer, storybookContext, newMeasuringPage, runStateJob, loadStory, waitStable, openAction } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const registry = JSON.parse(readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states;
const byId = (id) => registry.find((s) => s.id === id);
const failing = (rows) => rows.map((r) => {
  const f = Object.entries(r.rules).filter(([, v]) => v.length).map(([k, v]) => `${k}(${v.length})`).sort().join('+') || 'green';
  return `${r.root}: ${f}`;
}).join(' | ');
console.log(`platform ${process.platform} node ${process.version} ${new Date().toISOString()}`);
const server = await startStaticServer('storybook-static', 6077);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6077');

// A
const A = byId('patterns-mantine-admindashboardview--activity-error~about-visible-listings');
for (const mode of ['normal', 'iframe-css-aborted', 'iframe-css-404']) {
  const page = await newMeasuringPage(browser);
  if (mode === 'iframe-css-aborted') await page.route('**/assets/iframe-*.css', (r) => r.abort());
  if (mode === 'iframe-css-404') await page.route('**/assets/iframe-*.css', (r) => r.fulfill({ status: 404, body: 'Not found' }));
  const rows = await runStateJob(page, ctx, A, 'uk', 320);
  const app = rows[0];
  console.log(`A ${mode}: settle ${JSON.stringify(app.settle)} | ${failing(rows)} | viewport-overflow ${app.rules['viewport-overflow'].length} | portal-count ${JSON.stringify(app.rules['portal-count'])} | target-small[0] ${JSON.stringify(app.rules['target-small'][0] ?? null)}`);
  await page.close();
}

// B
const B = byId('patterns-mantine-listingdetailview--archived-listing~share-listing');
for (const at of [500, 1500, 1900, 2000, 2100, 2600]) {
  const page = await newMeasuringPage(browser);
  await loadStory(page, ctx, { story: B.story, state: B.id, locale: 'en', width: 320 });
  await waitStable(page, null);
  const t0 = Date.now();
  await openAction(page, B);
  const n = await waitStable(page, B.portals);
  const wait = at - (Date.now() - t0);
  if (wait > 0) await sleep(wait);
  const pressedAt = Date.now() - t0;
  await page.keyboard.press('Escape');
  let closedMs = null; let reopened = false; const p0 = Date.now();
  while (Date.now() - p0 < 5000) {
    const c = await page.evaluate(() => window.__census.portals().length);
    if (c === 0 && closedMs === null) closedMs = Date.now() - p0;
    if (c > 0 && closedMs !== null) reopened = true;
    await sleep(50);
  }
  const end = await page.evaluate(() => window.__census.portals().length);
  console.log(`B escape at ${pressedAt}ms after the click (portals after open ${n}): first seen closed ${closedMs === null ? 'never' : closedMs + 'ms'} later, reopened ${reopened}, portals at 5000ms ${end}`);
  await page.close();
}

// C
const C = byId('patterns-mantine-listingdetailview--archived-listing~share-listing');
for (const mode of ['normal', 'leaflet-css-late-3000', 'leaflet-css-aborted', 'google-fonts-aborted']) {
  for (let trial = 1; trial <= 2; trial++) {
    const page = await newMeasuringPage(browser);
    if (mode === 'leaflet-css-late-3000') await page.route('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', async (r) => { await sleep(3000); await r.continue(); });
    if (mode === 'leaflet-css-aborted') await page.route('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', (r) => r.abort());
    if (mode === 'google-fonts-aborted') await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await loadStory(page, ctx, { story: C.story, state: C.id, locale: 'sq', width: 390 });
    await waitStable(page, null);
    await sleep(3500);
    const box = await page.evaluate(() => {
      const p = document.querySelector('.leaflet-popup'); const m = document.querySelector('.listing-map');
      const b = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return `${Math.round(r.left)}..${Math.round(r.right)} (${Math.round(r.width)}px)`; };
      return { popup: b(p), map: b(m), contentStyleWidth: document.querySelector('.leaflet-popup-content')?.style.width ?? null };
    });
    console.log(`C ${mode} trial ${trial}: popup ${box.popup} map ${box.map} .leaflet-popup-content style.width ${box.contentStyleWidth}`);
    await page.close();
  }
}

await browser.close();
await new Promise((res) => server.close(res));
