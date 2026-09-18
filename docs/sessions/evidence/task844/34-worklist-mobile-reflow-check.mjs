import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 320, height: 900 });
await page.goto('http://localhost:6006/iframe.html?id=patterns-mantine-dashboardworklist--default&globals=locale:uk', { waitUntil: 'networkidle' });

const result = await page.evaluate(() => {
  const root = document.querySelector('#storybook-root') || document.body;
  const firstLink = root.querySelector('a');
  if (!firstLink) return { error: 'no link found' };
  const children = [...firstLink.children[0].children]; // first visible child stack
  const lines = children.map((el) => ({
    tag: el.tagName,
    text: (el.textContent || '').trim().slice(0, 60),
    visible: getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0,
  }));
  return { lines, linkOuterHTML: firstLink.outerHTML.slice(0, 400) };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
