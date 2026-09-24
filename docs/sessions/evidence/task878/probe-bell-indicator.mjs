// Task 878 Revision 2, §17.3 AC9 — evidence-only two-armed probe. Measures, for six story×width
// tuples, the distance between the centre of `.mantine-Indicator-indicator` (the unread-count
// badge) and the top-right corner of the bell `<svg>` glyph inside the same `.mantine-Indicator-root`.
// Before the R6 fix, `offset` is the stale `notificationPopoverOffset` (4), leaving the badge
// floating dx +8 / dy -8 from the glyph corner (D81-8, owner screenshot). After the fix,
// `iconButtonIndicatorOffset` (12, derived: (touchTarget 44 - iconSize.roomy 20) / 2) places the
// badge centre exactly on the glyph corner.
//
// Revision 3, §18.3 AC10 (D81-9, owner screenshot: the badge is not round at 16px) — EXTENDED, not
// forked:
//   - Single-digit: the same six tuples above now also assert the badge is 20x20 (+/-0.5) and
//     width==height (+/-0.5) — `iconButtonIndicatorSize` (20) replacing the reused `iconSize.standard`
//     (16), the icon-token role collision D81-9's screenshot compares against Rozetka/Prom.ua.
//   - Multi-digit: two NEW `NotificationBellView` Default-story sections (unreadCount=12 and
//     unreadCount=120, which renders "99+") are measured at 1440 only, asserting height 20 (+/-0.5)
//     and width >= height (Mantine's native pill — owner: "Pill is fine on 2+ digits").
//
// Exits 1 when any tuple/section misses its geometry, OR when no indicator badge is found at all (an
// absent badge must not read as a pass).
//
// Run before the fix: exits non-zero (16x16 single-digit badges; the two multi-digit sections don't
// exist yet in the pre-fix build, so they report as a missing badge).
// Run after the fix (rebuild storybook first): exits 0, every tuple/section within tolerance.
//
// Command: node docs/sessions/evidence/task878/probe-bell-indicator.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');
const staticDir = join(ROOT, 'storybook-static');
const PORT = 6043; // distinct from every other task's static-server port used in this repo
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

function startStaticServer(dir, port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(dir, decodeURIComponent(urlPath));
      try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(dir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
    server.on('error', reject);
  });
}

// Runs in the browser context via page.evaluate.
function measure() {
  const badge = document.querySelector('[class*="Indicator-indicator"]');
  const root = badge ? badge.closest('[class*="Indicator-root"]') : null;
  const svg = root ? root.querySelector('svg') : null;
  if (!badge || !svg) return null;

  const badgeRect = badge.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();

  const badgeCentreX = badgeRect.left + badgeRect.width / 2;
  const badgeCentreY = badgeRect.top + badgeRect.height / 2;
  const glyphCornerX = svgRect.right;
  const glyphCornerY = svgRect.top;

  return {
    dx: badgeCentreX - glyphCornerX,
    dy: badgeCentreY - glyphCornerY,
    badge: { w: badgeRect.width, h: badgeRect.height },
    glyph: { w: svgRect.width, h: svgRect.height },
  };
}

// Revision 3 — measures EVERY indicator badge on the page, in document order, for the multi-digit
// sections (the NotificationBellView Default story renders several bell instances stacked in one
// canvas; the first is the pre-existing single-digit section, already covered by measure()/TUPLES).
function measureAll() {
  const badges = Array.from(document.querySelectorAll('[class*="Indicator-indicator"]'));
  return badges.map((badge) => {
    const root = badge.closest('[class*="Indicator-root"]');
    const svg = root ? root.querySelector('svg') : null;
    if (!svg) return null;
    const badgeRect = badge.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const badgeCentreX = badgeRect.left + badgeRect.width / 2;
    const badgeCentreY = badgeRect.top + badgeRect.height / 2;
    return {
      dx: badgeCentreX - svgRect.right,
      dy: badgeCentreY - svgRect.top,
      badge: { w: badgeRect.width, h: badgeRect.height },
      text: badge.textContent,
    };
  });
}

const SIZE_TOLERANCE = 0.5;
const EXPECTED_SIZE = 20; // iconButtonIndicatorSize (D81-9)

const TUPLES = [
  { storyId: 'mantine-primitives-headerview--default', label: 'HeaderView Default' },
  { storyId: 'mantine-primitives-headeractions--default', label: 'HeaderActions Default' },
  { storyId: 'mantine-primitives-notificationbellview--default', label: 'NotificationBellView Default' },
];
const WIDTHS = [320, 1440];

async function main() {
  console.log('probe-bell-indicator.mjs — Task 878 Revision 2 §17.3 AC9 + Revision 3 §18.3 AC10');
  console.log(`platform: ${process.platform}`);
  console.log(`node: ${process.version}`);

  const server = await startStaticServer(staticDir, PORT);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();

  const problems = [];

  for (const { storyId, label } of TUPLES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage();
      await page.setViewportSize({ width, height: 900 });
      const url = `${baseUrl}/iframe.html?id=${storyId}&globals=locale:en&viewMode=story`;
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('[class*="Indicator-indicator"]', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(300);
      const result = await page.evaluate(measure);
      await page.close();

      if (!result) {
        console.log(`  ${label} @${width}: NO INDICATOR FOUND`);
        problems.push(`${label}@${width}: no indicator badge found`);
        continue;
      }

      const dxStr = result.dx >= 0 ? `+${result.dx.toFixed(2)}` : result.dx.toFixed(2);
      const dyStr = result.dy >= 0 ? `+${result.dy.toFixed(2)}` : result.dy.toFixed(2);
      console.log(`  ${label} @${width}: badge=${result.badge.w}x${result.badge.h} glyph=${result.glyph.w}x${result.glyph.h} dx=${dxStr} dy=${dyStr}`);

      if (Math.abs(result.dx) > 1 || Math.abs(result.dy) > 1) {
        problems.push(`${label}@${width}: dx=${dxStr} dy=${dyStr} (expected |dx|<=1, |dy|<=1)`);
      }

      // Revision 3 (§18.3 AC10) — single-digit badge is 20x20, width==height (a circle).
      if (Math.abs(result.badge.w - EXPECTED_SIZE) > SIZE_TOLERANCE || Math.abs(result.badge.h - EXPECTED_SIZE) > SIZE_TOLERANCE) {
        problems.push(`${label}@${width}: badge=${result.badge.w}x${result.badge.h} (expected ${EXPECTED_SIZE}x${EXPECTED_SIZE} +/-${SIZE_TOLERANCE})`);
      }
      if (Math.abs(result.badge.w - result.badge.h) > SIZE_TOLERANCE) {
        problems.push(`${label}@${width}: badge=${result.badge.w}x${result.badge.h} (width must equal height for a single-digit circle)`);
      }
    }
  }

  // Revision 3 (§18.3 AC10) — multi-digit: the two NEW NotificationBellView Default-story sections
  // (unreadCount=12, unreadCount=120 -> "99+"), measured at 1440 only. They are the 2nd and 3rd
  // indicator badges in document order — the 1st is the pre-existing single-digit section already
  // covered by the TUPLES loop above.
  const MULTI_DIGIT_SECTIONS = [
    { index: 1, label: 'NotificationBellView Default — unreadCount=12' },
    { index: 2, label: 'NotificationBellView Default — unreadCount=120 (99+)' },
  ];
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 1400 });
    const url = `${baseUrl}/iframe.html?id=mantine-primitives-notificationbellview--default&globals=locale:en&viewMode=story`;
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[class*="Indicator-indicator"]', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(300);
    const results = await page.evaluate(measureAll);
    await page.close();

    for (const { index, label } of MULTI_DIGIT_SECTIONS) {
      const result = results[index];
      if (!result) {
        console.log(`  ${label}: NO INDICATOR FOUND`);
        problems.push(`${label}: no indicator badge found`);
        continue;
      }
      const dxStr = result.dx >= 0 ? `+${result.dx.toFixed(2)}` : result.dx.toFixed(2);
      const dyStr = result.dy >= 0 ? `+${result.dy.toFixed(2)}` : result.dy.toFixed(2);
      console.log(`  ${label}: text="${result.text}" badge=${result.badge.w}x${result.badge.h} dx=${dxStr} dy=${dyStr}`);

      if (Math.abs(result.dx) > 1 || Math.abs(result.dy) > 1) {
        problems.push(`${label}: dx=${dxStr} dy=${dyStr} (expected |dx|<=1, |dy|<=1)`);
      }
      if (Math.abs(result.badge.h - EXPECTED_SIZE) > SIZE_TOLERANCE) {
        problems.push(`${label}: height=${result.badge.h} (expected ${EXPECTED_SIZE} +/-${SIZE_TOLERANCE})`);
      }
      if (result.badge.w < result.badge.h - SIZE_TOLERANCE) {
        problems.push(`${label}: badge=${result.badge.w}x${result.badge.h} (width must be >= height for a pill)`);
      }
    }
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  if (problems.length > 0) {
    console.error(`\nFAIL — ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log('\nPASS — every badge centre coincides with its glyph\'s top-right corner (|dx|<=1, |dy|<=1), single-digit badges are 20x20 circles, and multi-digit badges are 20-tall pills.');
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
