import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:6130';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(`${BASE}/iframe.html?id=patterns-mantine-dashboardsparkline--all-zero&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const wrapper = document.querySelector('[role="img"]');
  const wr = wrapper.getBoundingClientRect();
  const svg = wrapper.querySelector('svg');
  const sr = svg ? svg.getBoundingClientRect() : null;
  const bars = Array.from(wrapper.querySelectorAll('.apexcharts-bar-area')).map(b => {
    const r = b.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  const hoverAreas = Array.from(wrapper.querySelectorAll('rect')).map(r => {
    const rr = r.getBoundingClientRect();
    return { cls: r.getAttribute('class'), x: rr.x, y: rr.y, width: rr.width, height: rr.height };
  });
  return { wrapperRect: { x: wr.x, y: wr.y, width: wr.width, height: wr.height }, svgRect: sr, bars, hoverAreas };
});
console.log(JSON.stringify(info, null, 2));

// Try hovering at multiple y positions across the wrapper's vertical span, at bar 0's x.
const w = info.wrapperRect;
const bar0x = info.bars[0].x + info.bars[0].width / 2;
for (let frac = 0; frac <= 1; frac += 0.1) {
  const y = w.y + frac * w.height;
  await page.mouse.move(5, 5);
  await page.waitForTimeout(50);
  await page.mouse.move(bar0x, y, { steps: 3 });
  await page.waitForTimeout(400);
  const active = await page.evaluate(() => !!document.querySelector('.apexcharts-tooltip.apexcharts-active'));
  console.log(`frac=${frac.toFixed(1)} y=${y.toFixed(1)} active=${active}`);
}
await browser.close();
