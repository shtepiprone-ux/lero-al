import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 1200 });
await page.goto('http://127.0.0.1:6124/iframe.html?id=patterns-mantine-dashboardbarchart--grouped&viewMode=story', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const info = await page.evaluate(() => {
  const el = document.querySelector('.apexcharts-bar-area');
  if (!el) return { found: false };
  return {
    found: true,
    tag: el.tagName,
    attrs: Array.from(el.attributes).map((a) => `${a.name}=${a.value}`),
    outerHTMLStart: el.outerHTML.slice(0, 300),
    rect: el.getBoundingClientRect().toJSON ? el.getBoundingClientRect() : null,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
