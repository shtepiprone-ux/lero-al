import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 1 });
await page.goto('file:///C:/Users/Nox/AppData/Local/Temp/claude/C--Claude-Code-Projects-lero-al/abcd9c0d-4c23-42a6-a4aa-1e7b1d0b15a4/scratchpad/allzero-raw.html');
await page.waitForTimeout(800);
const bars = await page.evaluate(() => Array.from(document.querySelectorAll('.apexcharts-bar-area')).map(b => { const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
console.log('bars', JSON.stringify(bars));
const chartRect = await page.evaluate(() => document.querySelector('#chart').getBoundingClientRect());
console.log('chartRect', JSON.stringify(chartRect));
for (const frac of [0, 0.25, 0.5, 0.75, 1.0]) {
  const x = bars[3].x + bars[3].w/2;
  const y = chartRect.y + frac * chartRect.height;
  await page.mouse.move(1,1);
  await page.waitForTimeout(50);
  await page.mouse.move(x, y, { steps: 3 });
  await page.waitForTimeout(400);
  const active = await page.evaluate(() => !!document.querySelector('.apexcharts-tooltip.apexcharts-active'));
  console.log(`frac=${frac} active=${active}`);
}
await browser.close();
