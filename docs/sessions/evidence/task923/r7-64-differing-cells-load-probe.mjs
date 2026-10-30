// Task 923 Revision 6, AC32 (diagnosis only). The conditions of the full run, which the throttle probe (r7-63) does not
// reproduce: ten pages running the same state job at once (the full run's --jobs 10), 3 rounds per cell, so 30 jobs per
// cell. Prints the verdict distribution per cell: how many jobs per failing-rule set (per root), how many settle bounds hit.
//   node docs/sessions/evidence/task923/r7-64-differing-cells-load-probe.mjs
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
const PARALLEL = 10;
const ROUNDS = 3;
console.log(`platform ${process.platform} node ${process.version}; ${PARALLEL} parallel pages x ${ROUNDS} rounds per cell`);
const server = await startStaticServer('storybook-static', 6064);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6064');
for (const [id, locale, width] of cells) {
  const state = registry.find((s) => s.id === id);
  if (!state) throw new Error(`no registry row ${id}`);
  const dist = new Map();
  let bounded = 0;
  for (let round = 0; round < ROUNDS; round++) {
    await Promise.all(Array.from({ length: PARALLEL }, async () => {
      const page = await newMeasuringPage(browser);
      try {
        const rows = await runStateJob(page, ctx, state, locale, width);
        const key = rows.map((r) => `${r.root}: ${Object.entries(r.rules).filter(([, v]) => v.length).map(([k]) => k).sort().join('+') || 'green'}`).join(' | ');
        dist.set(key, (dist.get(key) ?? 0) + 1);
        if (rows[0].settle.bounded) bounded++;
      } finally {
        await page.close();
      }
    }));
  }
  console.log(`\n${id} ${locale} ${width}: ${PARALLEL * ROUNDS} jobs, settle bound hit in ${bounded}`);
  for (const [k, n] of [...dist].sort((a, b) => b[1] - a[1])) console.log(`  ${n} x ${k}`);
}
await browser.close();
await new Promise((res) => server.close(res));
