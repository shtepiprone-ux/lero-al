// Task 844 Revision 1, review G4 — missing evidence closed: AC1 DOM excerpt, AC2 bounding boxes
// at 320px, AC5 focus + tooltip-visibility result. Real Playwright run against the live
// Storybook, output saved to 51-worklist-probe.json.

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch();
const page = await browser.newPage();

// ── WorkList: AC1 (row-link DOM excerpt) + AC2 (touch target heights at 320px) ──────────────
await page.setViewportSize({ width: 320, height: 800 });
await page.goto('http://localhost:6006/iframe.html?id=patterns-mantine-dashboardworklist--default&globals=locale:uk', { waitUntil: 'networkidle' });

const workListResult = await page.evaluate(() => {
  const root = document.querySelector('#storybook-root') || document.body;
  const rootFontSizePx = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const touchTargetPx = 2.75 * rootFontSizePx;

  const links = [...root.querySelectorAll('a')];
  const linkHeights = links.map((a) => a.getBoundingClientRect().height);
  const row1 = links[0];
  const row1ExcerptFull = row1 ? row1.outerHTML : '';

  const buttons = [...root.querySelectorAll('button')];
  const retryClosestA = buttons.map((b) => b.closest('a') === null);

  const footerLink = [...root.querySelectorAll('a')].find((a) => (a.textContent || '').includes('Уся черга'));
  const footerRect = footerLink ? footerLink.getBoundingClientRect() : null;
  const footerContainerRect = footerLink ? footerLink.parentElement.getBoundingClientRect() : null;

  return {
    scrollWidth: document.documentElement.scrollWidth,
    touchTargetPx,
    linkCount: links.length,
    linkHeights,
    allLinksMeetTouchTarget: linkHeights.every((h) => h >= touchTargetPx - 1),
    row1ExcerptTruncated: row1ExcerptFull.slice(0, 2000),
    retryButtonCount: buttons.length,
    retryClosestAIsNullForAll: retryClosestA.every(Boolean),
    footer: footerRect && footerContainerRect ? {
      linkRight: footerRect.right,
      containerRight: footerContainerRect.right,
      rightAligned: Math.abs(footerRect.right - footerContainerRect.right) < 2,
    } : null,
  };
});

// ── RelativeTime: AC5 (keyboard focus + visible tooltip bubble) ─────────────────────────────
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:6006/iframe.html?id=mantine-primitives-relativetime--default&globals=locale:uk', { waitUntil: 'networkidle' });

const relativeTimeResult = await page.evaluate(() => {
  const root = document.querySelector('#storybook-root') || document.body;
  const el = root.querySelector('time[tabindex]');
  if (!el) return { error: 'no focusable time element found' };
  el.focus();
  return {
    focused: document.activeElement === el,
    ariaLabel: el.getAttribute('aria-label'),
  };
});
// Give the Tooltip's mount/animation a moment, then check for a visible [role="tooltip"].
await page.waitForTimeout(300);
const tooltipVisible = await page.evaluate(() => {
  const tip = document.querySelector('[role="tooltip"]');
  if (!tip) return false;
  const rect = tip.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && getComputedStyle(tip).visibility !== 'hidden';
});

const result = {
  workList: workListResult,
  relativeTime: { ...relativeTimeResult, tooltipVisible },
};

console.log(JSON.stringify(result, null, 2));

const pass =
  workListResult.scrollWidth <= 320 &&
  workListResult.allLinksMeetTouchTarget &&
  workListResult.retryClosestAIsNullForAll &&
  workListResult.footer?.rightAligned &&
  relativeTimeResult.focused &&
  (relativeTimeResult.ariaLabel ?? '').length > 0 &&
  tooltipVisible;

writeFileSync(new URL('./51-worklist-probe.json', import.meta.url), JSON.stringify(result, null, 2));
await browser.close();
process.exit(pass ? 0 : 1);
