// Task 889 Review 1 remediation — AC3 (F1) rendered evidence: for `WithChart` at the 7 named
// widths, record the card rect, its computed padding-right, scrollWidth/clientWidth, the chart rect
// and the value rect.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:6124';
const WIDTHS = [320, 390, 480, 768, 1024, 1280, 1440];
const STORY_ID = 'patterns-mantine-dashboardstatcard--with-chart';

const browser = await chromium.launch();
const page = await browser.newPage();

const rows = {};
for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 1200 });
  await page.goto(`${BASE}/iframe.html?id=${STORY_ID}&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  // Settle the chart's grow-in animation before reading geometry (same technique as measure-rev1.mjs).
  let last = null;
  for (let i = 0; i < 20; i++) {
    const snap = await page.evaluate(() => {
      const w = document.querySelector('[role="img"]');
      return w ? Math.round(w.getBoundingClientRect().width) : 0;
    });
    if (snap === last) break;
    last = snap;
    await page.waitForTimeout(200);
  }
  const data = await page.evaluate(() => {
    const card = document.querySelector('.mantine-Card-root');
    const cardRect = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    const chart = card.querySelector('[role="img"]');
    const chartRect = chart.getBoundingClientRect();
    // Value: the leaf text node in the card with the largest computed font-size that contains a digit.
    const candidates = Array.from(card.querySelectorAll('p, div, span')).filter(
      (el) => el.children.length === 0 && el.textContent && /\d/.test(el.textContent),
    );
    const value = candidates.sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize))[0];
    const valueRect = value ? value.getBoundingClientRect() : null;
    return {
      cardRect: { left: cardRect.left, right: cardRect.right, width: Math.round(cardRect.width), height: Math.round(cardRect.height) },
      paddingRight: parseFloat(style.paddingRight) || 0,
      contentBoxRight: cardRect.right - (parseFloat(style.paddingRight) || 0),
      scrollWidth: card.scrollWidth,
      clientWidth: card.clientWidth,
      chartRect: { left: chartRect.left, right: chartRect.right, top: chartRect.top, bottom: chartRect.bottom, width: Math.round(chartRect.width), height: Math.round(chartRect.height) },
      valueRect: valueRect ? { left: valueRect.left, right: valueRect.right, top: valueRect.top, bottom: valueRect.bottom } : null,
      valueText: value ? value.textContent : null,
    };
  });
  rows[width] = data;
}

await browser.close();
console.log(JSON.stringify(rows, null, 2));
