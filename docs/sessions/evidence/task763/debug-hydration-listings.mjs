import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
const messages = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') messages.push(msg.text());
});
page.on('pageerror', (err) => messages.push('PAGEERROR: ' + err.message));
await page.goto('http://localhost:3000/en/listings', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);
for (const m of messages) {
  console.log('----');
  console.log(m);
}
console.log('TOTAL:', messages.length);
await browser.close();
