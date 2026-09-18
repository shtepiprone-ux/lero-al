// Task 843 Revision 1, §16.3 item 3 — AC6 rendered reading.
// Runs against a running `npm run storybook` (localhost:6006). Opens the DashboardStatCard and
// DashboardStatRows Default stories at 320x800, locale uk, and measures:
//   - every <a>'s getBoundingClientRect().height (must be >= the resolved touchTarget)
//   - document.documentElement.scrollWidth <= 320 (no horizontal overflow)
//   - the resolved touchTarget in px (read from the page's own CSS var)
//   - for every <button>, closest('a') === null
// Exits non-zero if any link is shorter than touchTarget, if the page overflows, or if any
// button is inside a link.

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = 'http://localhost:6006';
const VIEWPORT = { width: 320, height: 800 };
const TARGETS = [
  { name: 'DashboardStatCard', id: 'patterns-mantine-dashboardstatcard--default' },
  { name: 'DashboardStatRows', id: 'patterns-mantine-dashboardstatrows--default' },
];

async function probe(page, target) {
  const url = `${BASE}/iframe.html?id=${target.id}&globals=locale:uk`;
  await page.goto(url, { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    // Scope to the story's own render root, not the whole iframe document — Storybook injects
    // its own dev-mode chrome (onboarding/error-boundary links like "Decorators documentation")
    // into the document outside the story root, which are zero-height when hidden and would
    // otherwise be miscounted as component links.
    const root = document.querySelector('#storybook-root') || document.body;
    // Mantine's touchTarget CSS var is per-component, not global, so resolve the theme's literal
    // value against the live root font-size instead (2.75rem = 44px at a 16px root, confirmed
    // against theme.ts's `touchTarget: '2.75rem'`).
    const rootFontSizePx = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const resolvedTouchTargetPx = 2.75 * rootFontSizePx;

    const links = [...root.querySelectorAll('a')].map((a) => {
      const rect = a.getBoundingClientRect();
      return { height: rect.height, width: rect.width, text: (a.textContent || '').slice(0, 40), cls: a.className };
    });
    const buttons = [...root.querySelectorAll('button')].map((b) => ({
      closestAIsNull: b.closest('a') === null,
    }));

    return {
      resolvedTouchTargetPx,
      scrollWidth: document.documentElement.scrollWidth,
      links,
      buttons,
    };
  });

  return { target: target.name, url, ...result };
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize(VIEWPORT);

  const results = [];
  let exitCode = 0;

  for (const target of TARGETS) {
    const r = await probe(page, target);
    results.push(r);

    if (r.scrollWidth > VIEWPORT.width) {
      console.error(`FAIL ${r.target}: scrollWidth ${r.scrollWidth} > ${VIEWPORT.width}`);
      exitCode = 1;
    }
    for (const link of r.links) {
      if (link.height < r.resolvedTouchTargetPx - 1) {
        console.error(`FAIL ${r.target}: link height ${link.height} < touchTarget ${r.resolvedTouchTargetPx} text="${link.text}" cls="${link.cls}"`);
        exitCode = 1;
      }
    }
    for (const button of r.buttons) {
      if (!button.closestAIsNull) {
        console.error(`FAIL ${r.target}: a <button> is nested inside an <a>`);
        exitCode = 1;
      }
    }
    console.log(`${r.target}: ${r.links.length} link(s), ${r.buttons.length} button(s), scrollWidth=${r.scrollWidth}, touchTarget=${r.resolvedTouchTargetPx}px`);
  }

  await browser.close();

  writeFileSync(
    new URL('./30-ac6-probe.json', import.meta.url),
    JSON.stringify({ viewport: VIEWPORT, results }, null, 2),
  );

  process.exit(exitCode);
}

main();
