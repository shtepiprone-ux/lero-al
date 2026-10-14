// Review 2 probe (Opus, diagnosis only): planted overflow past the dialog box inside a portal root, by an
// absolutely positioned element and by a transformed in-flow element. Same measuring code as the gate.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { fixtureContext, newMeasuringPage, runStateJob, startStaticServer } from '../../../../../scripts/rendered-state-census/runner.mjs';
const DIR = 'docs/sessions/evidence/task923/review-2/fixtures';
const server = await startStaticServer(DIR, 6092);
const browser = await chromium.launch();
const page = await newMeasuringPage(browser);
const ctx = fixtureContext('http://127.0.0.1:6092');
for (const name of ['rv2-control-benign', 'rv2-abs-past-dialog', 'rv2-transform-past-dialog']) {
  const state = JSON.parse(readFileSync(`${DIR}/${name}.html`, 'utf8').match(/<script type="application\/json" id="census-state">(.*?)<\/script>/)[1]);
  const rows = await runStateJob(page, ctx, state, 'en', 390);
  const geo = await page.evaluate(() => null);
  for (const r of rows) {
    const bad = Object.entries(r.rules).filter(([, v]) => v.length).map(([k, v]) => `${k}: ${v[0]}`);
    console.log(`${name} ${r.root} ${r.pass ? 'GREEN' : 'FAIL'} ${bad.join(' | ')}`);
  }
  // where the planted text is painted, relative to the dialog box and the viewport
  const { rows: _ } = { rows };
}
// geometry witness: reopen each planted case and print the planted box vs the dialog box
for (const name of ['rv2-abs-past-dialog', 'rv2-transform-past-dialog']) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`http://127.0.0.1:6092/${name}.html`);
  await page.click('#open');
  const g = await page.evaluate(() => {
    const d = document.querySelector('[data-portal] .dialog').getBoundingClientRect();
    const p = [...document.querySelectorAll('[data-portal] .dialog p')].pop().getBoundingClientRect();
    return `dialog x ${d.left}..${d.right}; planted text x ${Math.round(p.left)}..${Math.round(p.right)}; viewport 0..${document.documentElement.clientWidth}`;
  });
  console.log(`${name} geometry: ${g}`);
}
await browser.close(); server.close();
