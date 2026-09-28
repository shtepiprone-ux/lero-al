// Task 889 — GR-3b/GR-3c live-rendered measurement against the built storybook-static (served at
// http://127.0.0.1:6124). Uses the project's own Playwright dependency (1.60.0), the same tool
// scripts/check-locale-leak.mjs and the responsive-screenshots scripts already use.
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

const browser = await chromium.launch();
const page = await browser.newPage();

const results = {};

for (const story of STORIES) {
  results[story.label] = {};
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: HEIGHT });
    await page.goto(`${BASE}/iframe.html?id=${story.id}&viewMode=story`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400); // ApexCharts draw/animation settle
    const data = await page.evaluate(() => {
      const root = document.getElementById('storybook-root') || document.body;
      const cards = Array.from(root.querySelectorAll('.mantine-Card-root'));
      const sparklineBoxes = Array.from(root.querySelectorAll('[role="img"]'));
      const bars = Array.from(root.querySelectorAll('.apexcharts-bar-area'));
      const headings = Array.from(root.querySelectorAll('h1,h2,h3,h4,h5,h6,[class*=mantine-Title]'));
      const scrollers = Array.from(root.querySelectorAll('*')).filter((el) => el.scrollWidth > el.clientWidth + 1);
      return {
        rootWidth: root.getBoundingClientRect().width,
        viewportWidth: document.documentElement.clientWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        cardRects: cards.map((c) => {
          const r = c.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height) };
        }),
        sparklineRects: sparklineBoxes.map((c) => {
          const r = c.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height) };
        }),
        barCount: bars.length,
        barRects: bars.slice(0, 6).map((b) => ({
          x: Number(b.getAttribute('x')),
          w: Number(b.getAttribute('width')),
          h: Number(b.getAttribute('height')),
        })),
        fontSizes: [...new Set(root.querySelectorAll('*'))].length ? undefined : undefined,
        headingFontSizes: headings.map((h) => getComputedStyle(h).fontSize),
        overflowElements: scrollers.length,
      };
    });
    results[story.label][width] = data;
  }
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
