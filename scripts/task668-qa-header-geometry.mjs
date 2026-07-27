#!/usr/bin/env node
/**
 * task668-qa-header-geometry.mjs — Task 668 revision 7 (F1) header-row proof.
 *
 * Proves the Featured header row's Tailwind `<div className="flex … mb-6">` -> Mantine
 * `<Group justify="space-between" align="center" wrap="nowrap" mb="xl">` migration does not
 * change rendered layout, despite the undeclared computed `column-gap: normal -> 16px` that the
 * `Group` default (`gap="md"`) introduces (kickoff §10.14/F1).
 *
 * There is no rendered pre-change baseline for this row and none can be reconstructed (both
 * target Views are untracked — see kickoff §10.14). Instead this script measures the LIVE
 * post-change row, then sets the exact CSS custom property Mantine's `Group` writes for `gap`
 * (`--group-gap`) to `0px` on the SAME element inside the SAME `page.evaluate` call, re-measures,
 * and restores the original inline state in a `finally` block. Both passes run on one page
 * instance — no second `goto`, no clone, no hidden subtree.
 *
 * Matrix: exactly one story ID (`system-featuredlistings--default` — the populated branch, so
 * `ViewAllLink` is present) x 3 widths x 4 locales = 12 deterministic cells.
 *
 * Usage:
 *   node scripts/task668-qa-header-geometry.mjs
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const STORY_ID = 'system-featuredlistings--default';
const WIDTHS = [320, 640, 1440];
const LOCALES = ['sq', 'en', 'uk', 'it'];
const RECT_EPSILON_PX = 0.5;

const EXPECTED_RULES = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'nowrap',
  marginBottom: '24px',
  columnGap: '16px',
};

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function startStaticServer(staticDir, port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);
      try {
        const data = await readFile(filePath);
        const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(staticDir, 'index.html'));
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

// In-page evaluation — runs AFTER the render-failure guard has already cleared the page.
// Locates the Group (first #storybook-root descendant with computed display:flex containing an
// h2 descendant — mechanism-agnostic, no Mantine class dependency), the Title (`h2` inside it),
// and the ViewAllLink (the Group's last element child, asserted distinct from the Title). Then
// measures live geometry, flips `--group-gap` to `0px` on the SAME element, re-measures inside
// the SAME evaluate call, and restores the exact original inline state in a `finally` block.
/* eslint-disable no-undef */
async function evalHeaderGeometry() {
  const root = document.querySelector('#storybook-root');
  if (!root) return { infra: false, reason: 'no-storybook-root' };

  const all = root.querySelectorAll('*');
  const candidates = [];
  for (const el of all) {
    if (getComputedStyle(el).display === 'flex' && el.querySelector('h2')) {
      candidates.push(el);
    }
  }
  if (candidates.length !== 1) {
    return {
      infra: false,
      reason: candidates.length === 0 ? 'no-group-match' : 'multiple-group-matches',
      count: candidates.length,
    };
  }
  const group = candidates[0];
  const title = group.querySelector('h2');
  if (!title) return { infra: false, reason: 'no-title' };
  const viewAllLink = group.lastElementChild;
  if (!viewAllLink || viewAllLink === title) {
    return { infra: false, reason: 'no-viewalllink-distinct' };
  }

  function rectOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, left: r.left, right: r.right, bottom: r.bottom };
  }

  function measure() {
    const cs = getComputedStyle(group);
    return {
      group: rectOf(group),
      title: rectOf(title),
      viewAllLink: rectOf(viewAllLink),
      clientWidth: group.clientWidth,
      scrollWidth: group.scrollWidth,
      computed: {
        display: cs.display,
        flexDirection: cs.flexDirection,
        justifyContent: cs.justifyContent,
        alignItems: cs.alignItems,
        flexWrap: cs.flexWrap,
        marginBottom: cs.marginBottom,
        columnGap: cs.columnGap,
      },
    };
  }

  const live = measure();

  const savedValue = group.style.getPropertyValue('--group-gap');
  const savedPriority = group.style.getPropertyPriority('--group-gap');
  const wasAbsent = savedValue === '';

  let synthetic;
  try {
    group.style.setProperty('--group-gap', '0px');
    await new Promise((r) => requestAnimationFrame(r));
    synthetic = measure();
  } finally {
    if (wasAbsent) group.style.removeProperty('--group-gap');
    else group.style.setProperty('--group-gap', savedValue, savedPriority);
  }

  return { infra: true, live, synthetic };
}
/* eslint-enable no-undef */

function rectDelta(a, b) {
  return {
    x: Math.abs(a.x - b.x),
    y: Math.abs(a.y - b.y),
    width: Math.abs(a.width - b.width),
    height: Math.abs(a.height - b.height),
  };
}

function maxOf(delta) {
  return Math.max(delta.x, delta.y, delta.width, delta.height);
}

async function captureMatrix(browser, baseUrl) {
  const matrix = [];
  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      const storyUrl = `${baseUrl}/iframe.html?id=${STORY_ID}&globals=locale:${locale}&viewMode=story`;
      const cell = { storyId: STORY_ID, locale, width, infraOk: false, error: null };

      try {
        const page = await browser.newPage();
        const pageErrors = [];
        page.on('pageerror', (err) => { pageErrors.push(err.message.slice(0, 200)); });

        await page.setViewportSize({ width, height: 900 });
        await page.goto(storyUrl, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(400);

        // Render-failure guard — reused verbatim from task668-qa-grid-1440.mjs.
        const renderResult = await page.evaluate(() => {
          if (document.body.classList.contains('sb-show-errordisplay')) {
            const errEl = document.querySelector('#error-message') || document.body;
            return { failed: true, reason: 'sb-show-errordisplay', detail: (errEl.textContent ?? '').slice(0, 200) };
          }
          const root = document.querySelector('#storybook-root');
          if (root && root.children.length === 0) return { failed: true, reason: 'blank-canvas', detail: '' };
          return { failed: false, reason: null, detail: '' };
        });

        const renderFailed = renderResult.failed || pageErrors.length > 0;

        if (renderFailed) {
          cell.error = `render: ${renderResult.reason ?? pageErrors[0] ?? 'unknown'}`;
        } else {
          const geometry = await page.evaluate(evalHeaderGeometry);
          if (!geometry.infra) {
            cell.error = `locator: ${geometry.reason}`;
          } else {
            cell.infraOk = true;
            cell.live = geometry.live;
            cell.synthetic = geometry.synthetic;
          }
        }

        await page.close();
      } catch (err) {
        cell.error = String(err).slice(0, 300);
      }

      matrix.push(cell);
      process.stdout.write(cell.infraOk ? '.' : 'E');
    }
  }
  process.stdout.write('\n');
  return matrix;
}

function evaluateCell(cell) {
  const row = {
    storyId: cell.storyId,
    locale: cell.locale,
    width: cell.width,
    pass: true,
    escalate: false,
    reasons: [],
  };

  if (!cell.infraOk) {
    row.pass = false;
    row.reasons.push(`infra: ${cell.error}`);
    return row;
  }

  const { live, synthetic } = cell;

  // (a) Computed rules — necessary but NOT sufficient (revision-7 F1: clause (a) alone must not
  // be reported as AC5 satisfied).
  for (const [prop, expected] of Object.entries(EXPECTED_RULES)) {
    if (live.computed[prop] !== expected) {
      row.pass = false;
      row.reasons.push(`computed ${prop}=${live.computed[prop]} expected=${expected}`);
    }
  }

  // (b) Measured geometry — live vs synthetic gap:0, epsilon 0.5px.
  const groupDelta = rectDelta(live.group, synthetic.group);
  const titleDelta = rectDelta(live.title, synthetic.title);
  const linkDelta = rectDelta(live.viewAllLink, synthetic.viewAllLink);
  row.groupDeltaMax = maxOf(groupDelta);
  row.titleDeltaMax = maxOf(titleDelta);
  row.linkDeltaMax = maxOf(linkDelta);

  const liveOverflow = Math.max(0, live.scrollWidth - live.clientWidth);
  const syntheticOverflow = Math.max(0, synthetic.scrollWidth - synthetic.clientWidth);
  row.liveOverflowPx = liveOverflow;
  row.syntheticOverflowPx = syntheticOverflow;

  // Diagnostic only — never a pass condition (§10.14 decision rule).
  const colGapPx = parseFloat(live.computed.columnGap) || 0;
  row.freeSpacePx = live.clientWidth - (live.title.width + live.viewAllLink.width) - colGapPx;

  if (row.groupDeltaMax > RECT_EPSILON_PX) {
    row.escalate = true;
    row.reasons.push(`Group rect delta ${row.groupDeltaMax.toFixed(2)}px > ${RECT_EPSILON_PX}px`);
  }
  if (row.titleDeltaMax > RECT_EPSILON_PX) {
    row.escalate = true;
    row.reasons.push(`Title rect delta ${row.titleDeltaMax.toFixed(2)}px > ${RECT_EPSILON_PX}px`);
  }
  if (row.linkDeltaMax > RECT_EPSILON_PX) {
    row.escalate = true;
    row.reasons.push(`ViewAllLink rect delta ${row.linkDeltaMax.toFixed(2)}px > ${RECT_EPSILON_PX}px`);
  }
  if (liveOverflow > syntheticOverflow + RECT_EPSILON_PX) {
    row.escalate = true;
    row.reasons.push(`worse overflow with real gap:16px (${liveOverflow.toFixed(2)}px) than synthetic gap:0 (${syntheticOverflow.toFixed(2)}px)`);
  }

  if (row.escalate) {
    row.pass = false;
    row.label = 'CHANGE — escalate to owner';
  } else {
    row.label = 'PRESERVE (rendered layout) — MEASURED';
  }

  return row;
}

async function main() {
  const storybookStaticDir = join(ROOT, 'storybook-static');
  if (!existsSync(storybookStaticDir)) {
    console.error('storybook-static/ not found. Build first: npm run build-storybook');
    process.exit(1);
  }

  const { chromium } = await import('playwright');

  const PORT = 6016;
  const baseUrl = `http://127.0.0.1:${PORT}`;

  console.log('Task 668 §10.14 header-geometry QA capture (revision 7, F1/R17/AC5)');
  console.log(`    Story: ${STORY_ID} | Widths: ${WIDTHS.join(', ')} | Locales: ${LOCALES.join(', ')} = ${WIDTHS.length * LOCALES.length} cells`);
  console.log('');

  const server = await startStaticServer(storybookStaticDir, PORT);
  const browser = await chromium.launch();

  const matrix = await captureMatrix(browser, baseUrl);

  await browser.close();
  await new Promise((r) => server.close(r));

  const rows = matrix.map(evaluateCell);
  const failCount = rows.filter((r) => !r.pass).length;
  const escalateCount = rows.filter((r) => r.escalate).length;

  const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  const outputDir = join(ROOT, '.screenshots', 'task668', `header-geometry-${timestamp}`);
  mkdirSync(outputDir, { recursive: true });
  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({ timestamp, rows }, null, 2));

  console.log('');
  console.log(`Header geometry: ${rows.length} cells, ${rows.length - failCount} PASS, ${failCount} FAIL (${escalateCount} escalation(s))`);
  console.log(`Manifest: ${manifestPath}`);
  console.log('');

  for (const r of rows) {
    if (!r.infraOk && r.reasons.length) {
      console.log(`  ${r.locale}@${r.width}: ${r.reasons.join('; ')}`);
      continue;
    }
    console.log(
      `  ${r.locale}@${r.width}: groupΔ=${r.groupDeltaMax?.toFixed(2)}px titleΔ=${r.titleDeltaMax?.toFixed(2)}px ` +
      `linkΔ=${r.linkDeltaMax?.toFixed(2)}px liveOverflow=${r.liveOverflowPx?.toFixed(2)}px syntheticOverflow=${r.syntheticOverflowPx?.toFixed(2)}px ` +
      `freeSpace(diag)=${r.freeSpacePx?.toFixed(2)}px [${r.label}]`
    );
  }

  if (failCount > 0) {
    console.log('');
    console.log('Escalations / failures — name the element, width, and locale for the owner decision:');
    for (const r of rows.filter((x) => !x.pass)) {
      console.log(`  ${r.storyId} @ ${r.locale}@${r.width} - ${r.reasons.join('; ')}`);
    }
  }

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
