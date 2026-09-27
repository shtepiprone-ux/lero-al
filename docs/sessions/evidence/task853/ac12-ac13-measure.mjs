import { chromium } from 'playwright';

const BASE = 'http://localhost:6101';
const browser = await chromium.launch();

// AC12 — Empty story, en and uk: empty text visible, no row button.
for (const locale of ['en', 'uk']) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  await page.goto(`${BASE}/iframe.html?id=patterns-mantine-admindashboardrecentlistings--empty&globals=locale:${locale}&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  const data = await page.evaluate(() => ({
    text: document.body.innerText.trim(),
    buttonCount: document.querySelectorAll('button[type="button"]').length,
  }));
  console.log(`AC12 [${locale}]: bodyText="${data.text}" rowButtons=${data.buttonCount}`);
  await page.close();
}

// AC13 — Default story, 1440, en: no anchor/button text contains "→".
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
  await page.goto(`${BASE}/iframe.html?id=patterns-mantine-admindashboardview--default&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(400);
  const data = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('a, button'));
    const withArrow = nodes.filter((n) => (n.textContent || '').includes('→')).map((n) => n.textContent);
    return { total: nodes.length, withArrow };
  });
  console.log(`AC13: total a/button=${data.total} withArrow=${JSON.stringify(data.withArrow)}`);
  await page.close();
}

await browser.close();
