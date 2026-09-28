// Task 889 revision 4 (§21.4 AC9-R4) — re-run of the tooltip probe against the rebuilt
// storybook-static, because the chart geometry changed (fluid width instead of a fixed 154px box).
// Same rules as §18.4/rev3: the native ApexCharts tooltip must never overlap the hovered bar, never
// cover the cursor point, and never be clipped, with `.apexcharts-tooltip.apexcharts-active` required
// before every read. `AllZero` keeps rev3's re-specified rule (§19.2): 0 activations expected.
// Tuples per §21.4: Default/ThirtyDays at 390 and 1440 (en/uk); AllZero at 1440 (en); WithChart at
// 320/390/768/1024/1440 (en/uk) — WithChart now also covers 768, where the chart now renders beside
// the text after the rev4 width-contract fix.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:6130';
const SETTLE_MS = 2500;
const HOVER_WAIT_MS = 450;

function intersectArea(a, b) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  if (right <= left || bottom <= top) return 0;
  return (right - left) * (bottom - top);
}
function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height;
}

async function readTooltipState(page) {
  return page.evaluate(() => {
    const tt = document.querySelector('.apexcharts-tooltip.apexcharts-active');
    if (!tt) return { active: false };
    const ttRect = tt.getBoundingClientRect();
    let clip = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
    let node = tt.parentElement;
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const r = node.getBoundingClientRect();
        const left = Math.max(clip.x, r.left);
        const top = Math.max(clip.y, r.top);
        const right = Math.min(clip.x + clip.width, r.right);
        const bottom = Math.min(clip.y + clip.height, r.bottom);
        clip = { x: left, y: top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
      }
      node = node.parentElement;
    }
    return {
      active: true,
      tooltipRect: { x: ttRect.left, y: ttRect.top, width: ttRect.width, height: ttRect.height },
      clip,
    };
  });
}

function fullyInside(inner, outer) {
  return inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 && inner.x + inner.width <= outer.x + outer.width + 0.5 && inner.y + inner.height <= outer.y + outer.height + 0.5;
}

async function probeTuple(browser, { label, storyId, width, locale, scopeSelector, barIndices, isAllZero }) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`${BASE}/iframe.html?id=${storyId}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(SETTLE_MS);

  const rows = [];

  for (const barIndex of barIndices) {
    const barRect = await page.evaluate(({ scopeSelector, barIndex }) => {
      const scope = scopeSelector ? document.querySelector(scopeSelector) : document;
      const bars = scope.querySelectorAll('.apexcharts-bar-area');
      const bar = bars[barIndex];
      if (!bar) return null;
      const r = bar.getBoundingClientRect();
      return { x: r.left, y: r.top, width: r.width, height: r.height };
    }, { scopeSelector, barIndex });

    if (!barRect) {
      rows.push({ barIndex, error: 'BAR_NOT_FOUND' });
      continue;
    }

    const hoverPoints = isAllZero
      ? [{ tag: 'zero-slot-above-bottom', x: barRect.x + barRect.width / 2, y: barRect.y - 2 }]
      : [
          { tag: 'mid', x: barRect.x + barRect.width / 2, y: barRect.y + barRect.height / 2 },
          { tag: 'top+2', x: barRect.x + barRect.width / 2, y: barRect.y + 2 },
        ];

    for (const hp of hoverPoints) {
      await page.mouse.move(5, 5);
      await page.waitForTimeout(80);
      await page.mouse.move(hp.x, hp.y, { steps: 5 });
      await page.waitForTimeout(HOVER_WAIT_MS);

      const state = await readTooltipState(page);

      if (isAllZero) {
        rows.push({ barIndex, hover: hp.tag, point: { x: Math.round(hp.x), y: Math.round(hp.y) }, active: state.active, violation: state.active ? 'UNEXPECTED_TOOLTIP_ACTIVE' : null });
        continue;
      }

      if (!state.active) {
        rows.push({ barIndex, hover: hp.tag, point: { x: hp.x, y: hp.y }, active: false, violation: 'NO_TOOLTIP' });
        continue;
      }

      const overlapArea = intersectArea(state.tooltipRect, barRect);
      const violA = overlapArea > 0;
      const violB = pointInRect(hp.x, hp.y, state.tooltipRect);
      const violC = !fullyInside(state.tooltipRect, state.clip);

      rows.push({
        barIndex,
        hover: hp.tag,
        point: { x: Math.round(hp.x), y: Math.round(hp.y) },
        active: true,
        tooltipRect: state.tooltipRect,
        barRect,
        clip: state.clip,
        violA,
        violB,
        violC,
      });
    }
  }

  await page.close();
  return { label, storyId, width, locale, rows, pageErrors: errs };
}

async function main() {
  const browser = await chromium.launch();
  const tuples = [];

  for (const locale of ['en', 'uk']) {
    for (const width of [390, 1440]) {
      tuples.push({ label: `DashboardSparkline/Default@${width}/${locale}`, storyId: 'patterns-mantine-dashboardsparkline--default', width, locale, scopeSelector: null, barIndices: [0, 1, 2, 3, 4, 5, 6], isAllZero: false });
      tuples.push({ label: `DashboardSparkline/ThirtyDays@${width}/${locale}`, storyId: 'patterns-mantine-dashboardsparkline--thirty-days', width, locale, scopeSelector: null, barIndices: [0, 4, 9, 14, 19, 24, 29], isAllZero: false });
    }
  }
  tuples.push({ label: 'DashboardSparkline/AllZero@1440/en', storyId: 'patterns-mantine-dashboardsparkline--all-zero', width: 1440, locale: 'en', scopeSelector: null, barIndices: [0, 1, 2, 3, 4, 5, 6], isAllZero: true });

  for (const locale of ['en', 'uk']) {
    for (const width of [320, 390, 768, 1024, 1440]) {
      tuples.push({ label: `DashboardStatCard/WithChart@${width}/${locale}`, storyId: 'patterns-mantine-dashboardstatcard--with-chart', width, locale, scopeSelector: '.mantine-Card-root', barIndices: [0, 1, 2, 3, 4, 5, 6], isAllZero: false });
    }
  }

  const results = [];
  for (const t of tuples) {
    // eslint-disable-next-line no-await-in-loop
    const r = await probeTuple(browser, t);
    results.push(r);
    const violations = r.rows.filter((row) => row.violA || row.violB || row.violC || row.violation).length;
    console.log(`${t.label}: ${r.rows.length} hovers, ${violations} violations, pageErrors=${r.pageErrors.length}`);
  }

  await browser.close();
  writeFileSync('docs/sessions/evidence/task889/ac9-tooltip-results-rev4.json', JSON.stringify(results, null, 2));

  const totalViolations = results.reduce((sum, r) => sum + r.rows.filter((row) => row.violA || row.violB || row.violC || row.violation).length, 0);
  const totalPageErrors = results.reduce((sum, r) => sum + r.pageErrors.length, 0);
  console.log(`TOTAL_VIOLATIONS=${totalViolations}`);
  console.log(`TOTAL_PAGE_ERRORS=${totalPageErrors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
