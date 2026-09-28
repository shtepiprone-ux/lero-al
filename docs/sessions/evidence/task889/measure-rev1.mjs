// Task 889 Review 1 remediation (F3) — replaces measure.mjs's fabricated `getAttribute('x'/'width'/
// 'height')` reads (always null on an ApexCharts <path>, so every value was 0) with real
// `getBoundingClientRect()` geometry, and adds per-card `scrollWidth`/`clientWidth` plus the chart's
// right edge against its card's content-box right edge (card rect minus computed `padding-right`).
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:6124';
const WIDTHS = [320, 390, 768, 1024, 1440];
const HEIGHT = 1200;

const STORIES = [
  { id: 'patterns-mantine-dashboardsparkline--default', label: 'DashboardSparkline/Default' },
  { id: 'patterns-mantine-dashboardsparkline--all-zero', label: 'DashboardSparkline/AllZero' },
  { id: 'patterns-mantine-dashboardsparkline--thirty-days', label: 'DashboardSparkline/ThirtyDays' },
  { id: 'patterns-mantine-dashboardstatcard--with-chart', label: 'DashboardStatCard/WithChart' },
  { id: 'patterns-mantine-dashboardstatcard--accent', label: 'DashboardStatCard/Accent' },
  { id: 'patterns-mantine-dashboardbarchart--grouped', label: 'DashboardBarChart/Grouped' },
  { id: 'patterns-mantine-dashboardbarchart--horizontal', label: 'DashboardBarChart/Horizontal' },
];

const EVAL_FN = () => {
  const root = document.getElementById('storybook-root') || document.body;
  const cards = Array.from(root.querySelectorAll('.mantine-Card-root'));
  const chartWrappers = Array.from(root.querySelectorAll('[role="img"]'));
  const bars = Array.from(root.querySelectorAll('.apexcharts-bar-area'));
  const headings = Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6,[class*=mantine-Title]'));
  const allEls = Array.from(root.querySelectorAll('*'));
  const scrollers = allEls.filter((el) => el.scrollWidth > el.clientWidth + 1);

  const cardMeasurements = cards.map((card) => {
    const rect = card.getBoundingClientRect();
    const style = getComputedStyle(card);
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const contentRight = rect.right - paddingRight;
    const chart = card.querySelector('[role="img"], .apexcharts-canvas');
    const chartRect = chart ? chart.getBoundingClientRect() : null;
    return {
      cardRect: { left: rect.left, right: rect.right, width: Math.round(rect.width), height: Math.round(rect.height) },
      paddingRight,
      contentBoxRight: contentRight,
      scrollWidth: card.scrollWidth,
      clientWidth: card.clientWidth,
      overflowsOwnBox: card.scrollWidth > card.clientWidth + 1,
      chartRight: chartRect ? chartRect.right : null,
      chartExceedsContentBox: chartRect ? chartRect.right > contentRight + 1 : null,
    };
  });

  return {
    rootWidth: root.getBoundingClientRect().width,
    viewportWidth: document.documentElement.clientWidth,
    docScrollWidth: document.documentElement.scrollWidth,
    cardMeasurements,
    chartWrapperRects: chartWrappers.map((c) => {
      const r = c.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    }),
    barCount: bars.length,
    // Real geometry — ApexCharts draws bars as SVG <path> with no x/width/height attributes.
    barRects: bars.slice(0, 6).map((b) => {
      const r = b.getBoundingClientRect();
      return { left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) };
    }),
    headingFontSizes: headings.map((h) => getComputedStyle(h).fontSize),
    overflowElementsWholeDoc: scrollers.length,
  };
};

const browser = await chromium.launch();
const page = await browser.newPage();

const results = {};

for (const story of STORIES) {
  results[story.label] = {};
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: HEIGHT });
    await page.goto(`${BASE}/iframe.html?id=${story.id}&viewMode=story`, { waitUntil: 'networkidle' });
    // Bar count first, then let ApexCharts' grow-in animation finish before reading geometry
    // (review 1, F2 root cause) — poll up to 5s for the geometry to stop changing.
    await page.waitForTimeout(300);
    let last = null;
    for (let i = 0; i < 20; i++) {
      const snap = await page.evaluate(() => Array.from(document.querySelectorAll('.apexcharts-bar-area')).map((b) => {
        const r = b.getBoundingClientRect();
        return `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.left)}`;
      }).join(','));
      if (snap === last) break;
      last = snap;
      await page.waitForTimeout(250);
    }
    const data = await page.evaluate(EVAL_FN);
    results[story.label][width] = data;
  }
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
