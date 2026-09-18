// Task 844 Revision 2, review 2 — K1 + K2 rendered proof. Successor to 51-worklist-probe.mjs
// (K1's required correction: "Re-run 50/51 as 60-…/61-…"). Same AC1/AC2/AC5 coverage as 51, PLUS:
//   K1 — every WorkList row's RelativeTime must render PAST-TENSE text ("тому" in uk), now that
//        DashboardWorkList.stories.tsx's FIXTURE_ANCHOR equals the frozen Storybook clock.
//   K2 — hovering a row's RelativeTime (focusable={false}, nested inside the row's own <a>) must
//        still show the Tooltip. Before the fix, `focusable={false}` also suppressed the Tooltip
//        entirely, so a mouse user in a dashboard row could never see the absolute time.

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch();
const page = await browser.newPage();

// ── WorkList: AC1 (row-link DOM excerpt) + AC2 (touch target heights at 320px) + K1 (past tense) ──
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

  // K1 — every row's RelativeTime <time> text, past tense expected (uk "тому").
  const rowTimeTexts = links
    .map((a) => a.querySelector('time'))
    .filter(Boolean)
    .map((t) => (t.textContent || '').trim());

  return {
    scrollWidth: document.documentElement.scrollWidth,
    touchTargetPx,
    linkCount: links.length,
    linkHeights,
    allLinksMeetTouchTarget: linkHeights.every((h) => h >= touchTargetPx - 1),
    row1ExcerptTruncated: row1ExcerptFull.slice(0, 2000),
    retryButtonCount: buttons.length,
    retryClosestAIsNullForAll: retryClosestA.every(Boolean),
    footer: footerLink ? {
      linkRight: footerRect.right,
      containerRight: footerContainerRect.right,
      rightAligned: Math.abs(footerRect.right - footerContainerRect.right) < 2,
    } : null,
    rowTimeTexts,
    rowTimesAllPastTense: rowTimeTexts.length > 0 && rowTimeTexts.every((t) => t.includes('тому')),
  };
});

// K2 — hover the first row's <time> (focusable={false}) and confirm the Tooltip still opens.
// MUST run at a desktop viewport: MantineTooltip's mobile path (<640, the AC1/AC2 320px probe
// above) renders a tap-to-open bottom sheet instead of a hover Tooltip (useResponsiveDropdown),
// so hover has no effect there by design — that is not the K2 regression.
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:6006/iframe.html?id=patterns-mantine-dashboardworklist--default&globals=locale:uk', { waitUntil: 'networkidle' });
// Rows render a responsive dual layout (a `mantine-hidden-from-sm` stack plus its desktop
// sibling), each with its own <time> — only one is actually visible per viewport. `:visible`
// is required so Playwright targets the one rendered at this desktop width, not the CSS-hidden
// mobile copy that happens to come first in DOM order.
const firstRowTimeDesktop = await page.$('#storybook-root a time:visible, body a time:visible');
let hoverTooltipVisible = false;
if (firstRowTimeDesktop) {
  await firstRowTimeDesktop.hover();
  await page.waitForTimeout(300);
  hoverTooltipVisible = await page.evaluate(() => {
    const tip = document.querySelector('[role="tooltip"]');
    if (!tip) return false;
    const rect = tip.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && getComputedStyle(tip).visibility !== 'hidden';
  });
  await page.mouse.move(0, 0);
}

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
await page.waitForTimeout(300);
const tooltipVisible = await page.evaluate(() => {
  const tip = document.querySelector('[role="tooltip"]');
  if (!tip) return false;
  const rect = tip.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && getComputedStyle(tip).visibility !== 'hidden';
});

const result = {
  workList: workListResult,
  workListHoverTooltip: { hoverTooltipVisible },
  relativeTime: { ...relativeTimeResult, tooltipVisible },
};

console.log(JSON.stringify(result, null, 2));

const pass =
  workListResult.scrollWidth <= 320 &&
  workListResult.allLinksMeetTouchTarget &&
  workListResult.retryClosestAIsNullForAll &&
  workListResult.footer?.rightAligned &&
  workListResult.rowTimesAllPastTense &&
  hoverTooltipVisible &&
  relativeTimeResult.focused &&
  (relativeTimeResult.ariaLabel ?? '').length > 0 &&
  tooltipVisible;

writeFileSync(new URL('./61-worklist-probe.json', import.meta.url), JSON.stringify(result, null, 2));
await browser.close();
process.exit(pass ? 0 : 1);
