// Task 889 — re-runs the literal assertions from each story's `play` function against the rebuilt
// storybook-static (http://127.0.0.1:6124), since no `test-storybook`/Storybook-vitest runner exists
// in this repo to execute `play` headlessly (checked: package.json has no such script).
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:6124';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 1200 });

async function go(id) {
  await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
}

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail });
}

// AC1 — Sparkline Default: 7 bars, role="img" wrapper with aria-label.
await go('patterns-mantine-dashboardsparkline--default');
{
  const r = await page.evaluate(() => {
    const wrapper = document.querySelector('[role="img"]');
    const bars = document.querySelectorAll('.apexcharts-bar-area');
    return { hasWrapper: !!wrapper, ariaLabel: wrapper?.getAttribute('aria-label'), barCount: bars.length };
  });
  check('AC1 Default: role=img wrapper present', r.hasWrapper, JSON.stringify(r));
  check('AC1 Default: aria-label = "Trend chart"', r.ariaLabel === 'Trend chart', JSON.stringify(r));
  check('AC1 Default: 7 bars', r.barCount === 7, JSON.stringify(r));
}

// AC1 — Sparkline AllZero: every bar's rendered height is 0.
await go('patterns-mantine-dashboardsparkline--all-zero');
{
  const r = await page.evaluate(() => {
    const bars = Array.from(document.querySelectorAll('.apexcharts-bar-area'));
    return { count: bars.length, heights: bars.map((b) => b.getBoundingClientRect().height) };
  });
  check('AC1 AllZero: 7 bars', r.count === 7, JSON.stringify(r));
  check('AC1 AllZero: every bar height 0', r.heights.every((h) => h === 0), JSON.stringify(r));
}

// AC3 — StatCard WithChart: chart right of value at >=480, chart below value at <480.
for (const width of [1440, 480, 390, 320]) {
  await page.setViewportSize({ width, height: 1200 });
  await go('patterns-mantine-dashboardstatcard--with-chart');
  const r = await page.evaluate(() => {
    const valueEl = document.querySelector('.mantine-Card-root p[class*="fz"], .mantine-Card-root [class*="Text"]');
    // Fall back: the value is the second <p>/<div> text node with the largest font-size in the card.
    const card = document.querySelector('.mantine-Card-root');
    const texts = Array.from(card.querySelectorAll('p, div')).filter((el) => el.textContent && /\d/.test(el.textContent) && el.children.length === 0);
    const value = texts.sort((a, b) => parseFloat(getComputedStyle(b).fontSize) - parseFloat(getComputedStyle(a).fontSize))[0];
    const chartWrapper = card.querySelector('[role="img"]');
    if (!value || !chartWrapper) return { ok: false, reason: 'missing value or chart element' };
    const v = value.getBoundingClientRect();
    const c = chartWrapper.getBoundingClientRect();
    return { ok: true, valueRect: v, chartRect: c, chartLeftOfValueRight: c.left >= v.right, chartTopBelowValueBottom: c.top >= v.bottom };
  });
  await page.setViewportSize({ width: 1440, height: 1200 });
  if (width >= 480) {
    check(`AC3 @${width}: chart is right of value (side-by-side)`, r.ok && r.chartLeftOfValueRight, JSON.stringify(r));
  } else {
    check(`AC3 @${width}: chart is below value (stacked)`, r.ok && r.chartTopBelowValueBottom, JSON.stringify(r));
  }
}

// AC4 — StatCard Accent: bg rgb(189,67,57); label/value/caption white; contrast >= 4.5.
await go('patterns-mantine-dashboardstatcard--accent');
{
  const r = await page.evaluate(() => {
    const card = document.querySelector('.mantine-Card-root');
    const bg = getComputedStyle(card).backgroundColor;
    const texts = Array.from(card.querySelectorAll('p, div, span')).filter((el) => el.textContent?.trim() && el.children.length === 0);
    const colors = texts.map((el) => getComputedStyle(el).color);
    return { bg, colors: [...new Set(colors)] };
  });
  check('AC4: card bg is rgb(189, 67, 57)', r.bg === 'rgb(189, 67, 57)', JSON.stringify(r));
  check('AC4: every text node is white', r.colors.every((c) => c === 'rgb(255, 255, 255)'), JSON.stringify(r));
  // WCAG contrast of white (255,255,255) on rgb(189,67,57):
  function relLum([r8, g8, b8]) {
    const conv = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * conv(r8) + 0.7152 * conv(g8) + 0.0722 * conv(b8);
  }
  const L1 = relLum([255, 255, 255]);
  const L2 = relLum([189, 67, 57]);
  const contrast = (L1 + 0.05) / (L2 + 0.05);
  check(`AC4: contrast ratio >= 4.5 (actual ${contrast.toFixed(2)})`, contrast >= 4.5, `contrast=${contrast.toFixed(3)}`);
}

// AC5 — BarChart Grouped: two series' first bars sit at different x (side by side, not stacked).
await go('patterns-mantine-dashboardbarchart--grouped');
{
  const r = await page.evaluate(() => {
    const groups = Array.from(document.querySelectorAll('.apexcharts-series'));
    const lefts = groups.map((g) => g.querySelector('.apexcharts-bar-area')?.getBoundingClientRect().left);
    return { groupCount: groups.length, lefts };
  });
  check('AC5 Grouped: 2 series groups', r.groupCount === 2, JSON.stringify(r));
  check('AC5 Grouped: first-bar x differs between series (not stacked)', r.lefts[0] !== r.lefts[1], JSON.stringify(r));
}

// AC5 — BarChart Horizontal: widths vary, heights equal.
await go('patterns-mantine-dashboardbarchart--horizontal');
{
  const r = await page.evaluate(() => {
    const bars = Array.from(document.querySelectorAll('.apexcharts-bar-area'));
    const rects = bars.map((b) => b.getBoundingClientRect());
    return {
      count: bars.length,
      widths: rects.map((x) => Math.round(x.width)),
      heights: rects.map((x) => Math.round(x.height)),
    };
  });
  check('AC5 Horizontal: 5 bars', r.count === 5, JSON.stringify(r));
  check('AC5 Horizontal: widths vary', new Set(r.widths).size > 1, JSON.stringify(r));
  check('AC5 Horizontal: heights all equal', new Set(r.heights).size === 1, JSON.stringify(r));
}

// AC5 — BarChart Default still renders stacked (R9 preserved default behaviour).
await go('patterns-mantine-dashboardbarchart--default');
{
  const r = await page.evaluate(() => {
    const groups = Array.from(document.querySelectorAll('.apexcharts-series'));
    const firstBarLefts = groups.map((g) => g.querySelector('.apexcharts-bar-area')?.getBoundingClientRect().left);
    return { groupCount: groups.length, firstBarLefts };
  });
  // Stacked bars for the same category share the same x (left) position.
  check('AC5 Default: still stacked (same x across series)', r.groupCount === 2 && r.firstBarLefts[0] === r.firstBarLefts[1], JSON.stringify(r));
}

await browser.close();

let failCount = 0;
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'} — ${r.name}${r.pass ? '' : ` :: ${r.detail}`}`);
  if (!r.pass) failCount++;
}
console.log(`\n${results.length - failCount}/${results.length} passed`);
process.exit(failCount > 0 ? 1 : 0);
