import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 320, height: 900 });
await page.goto('http://localhost:6006/iframe.html?id=patterns-mantine-dashboardworklist--default&globals=locale:uk', { waitUntil: 'networkidle' });

const result = await page.evaluate(() => {
  const root = document.querySelector('#storybook-root') || document.body;
  const footerLink = [...root.querySelectorAll('a')].find((a) => (a.textContent || '').includes('Уся черга'));
  if (!footerLink) return { error: 'footer link not found' };
  const linkRect = footerLink.getBoundingClientRect();
  const groupRect = footerLink.parentElement.getBoundingClientRect();
  return {
    text: footerLink.textContent,
    linkRight: linkRect.right,
    groupRight: groupRect.right,
    rightAligned: Math.abs(linkRect.right - groupRect.right) < 2,
    linkWidth: linkRect.width,
    groupWidth: groupRect.width,
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
