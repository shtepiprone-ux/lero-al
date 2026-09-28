import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:6130';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on('console', (msg) => console.log('CONSOLE:', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
await page.goto(`${BASE}/iframe.html?id=patterns-mantine-dashboardsparkline--all-zero&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Inspect apexcharts internal globals via the window instance registry if exposed.
const globalsInfo = await page.evaluate(() => {
  const w = window;
  const keys = Object.keys(w).filter(k => k.startsWith('Apex') || k === 'ApexCharts');
  let seriesYRange = null;
  try {
    // ApexCharts keeps instances in a static registry sometimes; try common globals.
    if (w.ApexCharts && w.ApexCharts.instances) {
      seriesYRange = w.ApexCharts.instances.map(i => ({ minY: i.w?.globals?.minY, maxY: i.w?.globals?.maxY, yValueDecimal: i.w?.globals?.yValueDecimal }));
    }
  } catch (e) { seriesYRange = String(e); }
  return { keys, seriesYRange };
});
console.log('globalsInfo', JSON.stringify(globalsInfo));

const bar0 = await page.evaluate(() => {
  const wrapper = document.querySelector('[role="img"]');
  const b = wrapper.querySelector('.apexcharts-bar-area');
  const r = b.getBoundingClientRect();
  return { x: r.x + r.width/2, y: r.y };
});
await page.mouse.move(bar0.x, bar0.y, { steps: 5 });
await page.waitForTimeout(600);
await browser.close();
