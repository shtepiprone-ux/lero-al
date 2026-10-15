// Review 6 (diagnosis only). The full run's workers reuse one page (one browser context) for every job they take
// (runner.mjs runPool). Does the job that ran before change the chart detail of the `~en-english` row? One reused page
// runs the gate's own runStateJob for every registry state of the Story at <locale> / <width>, in a shuffled order,
// 3 rounds; after each job it prints whether the app row of the target state holds a chart component-overflow detail,
// and the storage keys the page holds.
//   node docs/sessions/evidence/task923/review-6/rv6-55-reused-page-probe.mjs <story-id> <target-state-id> <locale> <width>
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { startStaticServer, storybookContext, newMeasuringPage, runStateJob } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [story, target, locale, width] = [process.argv[2], process.argv[3], process.argv[4], Number(process.argv[5])];
const states = JSON.parse(readFileSync('scripts/rendered-interaction-states.json', 'utf8')).states.filter((s) => s.story === story);
console.log(`platform ${process.platform} node ${process.version}; ${states.length} states of ${story} @ ${locale} ${width}; target ${target}`);
const server = await startStaticServer('storybook-static', 6064);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6064');
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let round = 1; round <= 3; round++) {
  const page = await newMeasuringPage(browser);
  const order = [...states].sort(() => rand() - 0.5);
  const seen = [];
  for (const s of order) {
    const rows = await runStateJob(page, ctx, s, locale, width);
    seen.push(s.id.split('~')[1]);
    if (s.id === target) {
      const app = rows.find((r) => r.root === 'app');
      const chart = (app.rules['component-overflow'] ?? []).filter((d) => /apexcharts|m_6d731127/.test(d)).length;
      const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
      console.log(`round ${round}: target after [${seen.slice(0, -1).join(', ') || 'nothing'}] -> chart details ${chart}; failing ${Object.entries(app.rules).filter(([, v]) => v.length).map(([k]) => k).join('+') || 'green'}; localStorage [${storage.local.join(', ')}]; sessionStorage [${storage.session.join(', ')}]`);
    }
  }
  await page.close();
}
await browser.close();
await new Promise((res) => server.close(res));
