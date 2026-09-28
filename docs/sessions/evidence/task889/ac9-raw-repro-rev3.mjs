// Task 889 revision 3 (§19.2 AC9-R3) — drives ac9-raw-repro-rev3.html (raw ApexCharts 7.4.0, no
// React/Mantine) via Playwright, hovering all 7 bar slots of each of the four charts
// ({non-zero, all-zero} x {compact off, on}) and counting how many hovers show
// `.apexcharts-tooltip.apexcharts-active`. Expected (§19.2): non-zero > 0 active in both compact
// arms; all-zero 0 active in both compact arms. Loaded via `file://` (no server needed): the HTML's
// own relative `../../../../node_modules/apexcharts/dist/apexcharts.js` script/style tags resolve
// against the file's own directory the same way under `file://` as they would under any static
// server, and this avoids both a second throwaway http-server process and (the reason a copied
// apexcharts.js was rejected first) adding a vendored file that ESLint's project-wide lint gate
// would pick up.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

async function main() {
  const fileUrl = pathToFileURL(resolve('docs/sessions/evidence/task889/ac9-raw-repro-rev3.html')).href;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 400, height: 700 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__chartsReady === true, { timeout: 10000 });
  await page.waitForTimeout(1000);

  const arms = ['nonzero-compact-off', 'nonzero-compact-on', 'allzero-compact-off', 'allzero-compact-on'];
  const results = {};

  for (const armId of arms) {
    const barRects = await page.evaluate((armId) => {
      const box = document.querySelector('#' + armId);
      const bars = box.querySelectorAll('.apexcharts-bar-area');
      return Array.from(bars).map((b) => {
        const r = b.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height };
      });
    }, armId);

    const isAllZero = armId.startsWith('allzero');
    let activeCount = 0;
    const hovers = [];

    for (let i = 0; i < barRects.length; i++) {
      const r = barRects[i];
      const points = isAllZero
        ? [{ tag: 'zero-slot-above-bottom', x: r.x + r.width / 2, y: r.y - 2 }]
        : [
            { tag: 'mid', x: r.x + r.width / 2, y: r.y + r.height / 2 },
            { tag: 'top+2', x: r.x + r.width / 2, y: r.y + 2 },
          ];
      for (const p of points) {
        // eslint-disable-next-line no-await-in-loop
        await page.mouse.move(5, 5);
        // eslint-disable-next-line no-await-in-loop
        await page.waitForTimeout(80);
        // eslint-disable-next-line no-await-in-loop
        await page.mouse.move(p.x, p.y, { steps: 5 });
        // eslint-disable-next-line no-await-in-loop
        await page.waitForTimeout(450);
        // eslint-disable-next-line no-await-in-loop
        const active = await page.evaluate(() => !!document.querySelector('.apexcharts-tooltip.apexcharts-active'));
        if (active) activeCount++;
        hovers.push({ barIndex: i, hover: p.tag, active });
      }
    }

    results[armId] = { totalHovers: hovers.length, activeCount, hovers };
    console.log(`${armId}: ${hovers.length} hovers, ${activeCount} active`);
  }

  console.log(`PAGE_ERRORS=${pageErrors.length}`);
  await browser.close();

  writeFileSync('docs/sessions/evidence/task889/ac9-raw-repro-results-rev3.json', JSON.stringify({ results, pageErrors }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
