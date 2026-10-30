// Task 923 Revision 6, AC32 (diagnosis only; a copy in spirit of review-6/rv6-53-chart-settle-probe.mjs, extended to the whole
// state job). The three cells that differ between r7-full-a and r7-full-b outside C118. For each: CPU throttle 1x and 4x, 5
// trials each. Every trial is one fresh page and one runStateJob exactly as the gate runs it (load, settle, open, measure,
// dismiss). Prints, per trial, the failing rules of each row, the settle {ms,bounded} and the dismissMs.
//   node docs/sessions/evidence/task923/r7-63-differing-cells-probe.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startStaticServer, storybookContext, newMeasuringPage, runStateJob } from '../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const registry = JSON.parse(readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states;
const cells = [
  ['patterns-mantine-admindashboardview--activity-error~about-visible-listings', 'uk', 320],
  ['patterns-mantine-listingdetailview--archived-listing~all-photos', 'sq', 390],
  ['patterns-mantine-listingdetailview--archived-listing~share-listing', 'en', 320],
];
console.log(`platform ${process.platform} node ${process.version}`);
const server = await startStaticServer('storybook-static', 6063);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6063');
for (const [id, locale, width] of cells) {
  const state = registry.find((s) => s.id === id);
  if (!state) throw new Error(`no registry row ${id}`);
  for (const rate of [1, 4]) {
    for (let trial = 1; trial <= 5; trial++) {
      const page = await newMeasuringPage(browser);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      const rows = await runStateJob(page, ctx, state, locale, width);
      const out = rows.map((r) => {
        const failing = Object.entries(r.rules).filter(([, v]) => v.length).map(([k]) => k).sort().join('+') || 'green';
        return `${r.root}: ${failing}`;
      });
      console.log(`${id} ${locale} ${width} throttle ${rate}x trial ${trial}: settle ${JSON.stringify(rows[0].settle)} dismissMs ${JSON.stringify(rows.find((r) => r.root !== 'app')?.dismissMs ?? {})} | ${out.join(' | ')}`);
      await page.close();
    }
  }
}
await browser.close();
await new Promise((res) => server.close(res));
