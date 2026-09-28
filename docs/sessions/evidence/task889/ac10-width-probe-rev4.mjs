// Task 889 revision 4 (§21.4, AC10) — width-contract probe against the rebuilt `storybook-static`.
// Verifies the sparkline fills its container (154px floor) instead of a fixed 154px box, per O889-1
// row 1's owner return. Covers DashboardSparkline (Default/AllZero/ThirtyDays) and
// DashboardStatCard/WithChart, en and uk, at 320/390/768/1024/1440, plus the §21.4 resize arm.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:6130';
const WIDTHS = [320, 390, 768, 1024, 1440];
const LOCALES = ['en', 'uk'];
const HEIGHT = 1200;

const SPARKLINE_STORIES = [
  { id: 'patterns-mantine-dashboardsparkline--default', label: 'DashboardSparkline/Default' },
  { id: 'patterns-mantine-dashboardsparkline--all-zero', label: 'DashboardSparkline/AllZero' },
  { id: 'patterns-mantine-dashboardsparkline--thirty-days', label: 'DashboardSparkline/ThirtyDays' },
];

const SPARKLINE_EVAL = () => {
  const wrapper = document.querySelector('[role="img"]');
  const svg = wrapper ? wrapper.querySelector('svg.apexcharts-svg') : null;
  const grid = wrapper ? wrapper.closest('.mantine-SimpleGrid-root') : null;
  const trackWidths = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').map((v) => parseFloat(v)) : [];
  const cellWidth = trackWidths.length ? trackWidths[0] : null;
  const wrapperRect = wrapper ? wrapper.getBoundingClientRect() : null;
  const svgRect = svg ? svg.getBoundingClientRect() : null;
  return {
    cellWidth: cellWidth !== null ? Math.round(cellWidth) : null,
    wrapperWidth: wrapperRect ? Math.round(wrapperRect.width) : null,
    wrapperHeight: wrapperRect ? Math.round(wrapperRect.height) : null,
    svgWidth: svgRect ? Math.round(svgRect.width) : null,
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
  };
};

const STATCARD_EVAL = () => {
  const card = document.querySelector('.mantine-Card-root');
  const cardRect = card.getBoundingClientRect();
  const style = getComputedStyle(card);
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const contentBoxRight = cardRect.right - paddingRight;
  const contentBoxWidth = cardRect.width - paddingRight - (parseFloat(style.paddingLeft) || 0);
  const flex = card.querySelector('.mantine-Flex-root');
  // Mantine injects a sibling <style> tag for responsive props between the real children — filter
  // it out before indexing (found via debug dump: flex.children = [Stack, <style>, chart Box]).
  const flexElementChildren = flex ? Array.from(flex.children).filter((el) => el.tagName !== 'STYLE') : [];
  const textStack = flexElementChildren[0] || null;
  const chartBox = flexElementChildren[1] || null;
  const chartImg = chartBox ? chartBox.querySelector('[role="img"]') : null;
  const textRect = textStack ? textStack.getBoundingClientRect() : null;
  const chartRect = chartImg ? chartImg.getBoundingClientRect() : null;
  const gap = flex ? parseFloat(getComputedStyle(flex).rowGap || getComputedStyle(flex).gap) || 0 : null;
  const isBeside = textRect && chartRect ? Math.abs(textRect.bottom - chartRect.bottom) < 20 || chartRect.top < textRect.bottom - 10 : null;
  return {
    cardWidth: Math.round(cardRect.width),
    contentBoxWidth: Math.round(contentBoxWidth),
    contentBoxRight: Math.round(contentBoxRight),
    textRect: textRect ? { left: Math.round(textRect.left), right: Math.round(textRect.right), top: Math.round(textRect.top), bottom: Math.round(textRect.bottom) } : null,
    chartRect: chartRect ? { left: Math.round(chartRect.left), right: Math.round(chartRect.right), top: Math.round(chartRect.top), bottom: Math.round(chartRect.bottom), width: Math.round(chartRect.width) } : null,
    gap,
    placement: isBeside ? 'beside' : 'under',
    docScrollWidth: document.documentElement.scrollWidth,
    docClientWidth: document.documentElement.clientWidth,
  };
};

async function settle(page) {
  await page.waitForTimeout(300);
  let last = null;
  for (let i = 0; i < 20; i++) {
    const snap = await page.evaluate(() => {
      const el = document.querySelector('[role="img"]');
      if (!el) return 'none';
      const r = el.getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)}`;
    });
    if (snap === last) break;
    last = snap;
    await page.waitForTimeout(250);
  }
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = { sparkline: {}, statcard: {}, resizeArm: null };

  for (const story of SPARKLINE_STORIES) {
    results.sparkline[story.label] = {};
    for (const locale of LOCALES) {
      results.sparkline[story.label][locale] = {};
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: HEIGHT });
        await page.goto(`${BASE}/iframe.html?id=${story.id}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' });
        await settle(page);
        results.sparkline[story.label][locale][width] = await page.evaluate(SPARKLINE_EVAL);
      }
    }
  }

  results.statcard['WithChart'] = {};
  for (const locale of LOCALES) {
    results.statcard['WithChart'][locale] = {};
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto(`${BASE}/iframe.html?id=patterns-mantine-dashboardstatcard--with-chart&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' });
      await settle(page);
      results.statcard['WithChart'][locale][width] = await page.evaluate(STATCARD_EVAL);
    }
  }

  // §21.4 resize arm: load WithChart en at 1440, resize to 390 without reloading, wait 1000ms.
  await page.setViewportSize({ width: 1440, height: HEIGHT });
  await page.goto(`${BASE}/iframe.html?id=patterns-mantine-dashboardstatcard--with-chart&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' });
  await settle(page);
  const before = await page.evaluate(STATCARD_EVAL);
  await page.setViewportSize({ width: 390, height: HEIGHT });
  await page.waitForTimeout(1000);
  const after = await page.evaluate(STATCARD_EVAL);
  results.resizeArm = { before1440: before, afterResizeTo390NoReload: after };

  await browser.close();
  writeFileSync('docs/sessions/evidence/task889/ac10-width-probe-rev4.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
