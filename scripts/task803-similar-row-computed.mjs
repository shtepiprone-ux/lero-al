#!/usr/bin/env node
/**
 * task803-similar-row-computed.mjs — Task 803 kickoff §16.4 computed-style probe.
 *
 * AC7 requires the similar-listings card row's COMPUTED `display`/`overflow-x` at every tested
 * width, not a source-code reading or a screenshot. This script measures it against a running
 * `npm run start` server.
 *
 * Modelled on `scripts/task775-listings-frame-route-probe.mjs` (BASE_URL env, `git hash-object`/
 * `git rev-parse` identity via `child_process` with no shell, one immutable run directory per
 * invocation via `writeFile(..., { flag: 'wx' })`).
 *
 * EVIDENCE TOOLING, not a gate: no `package.json` script entry, nothing in CI depends on it.
 *
 * Usage:
 *   node scripts/task803-similar-row-computed.mjs <slug> <runId>
 * Output:
 *   docs/sessions/evidence/task803/runs/<runId>/similar-row-computed.json
 *
 * Contract (kickoff §16.4c/§16.4d):
 *   - Locale `uk` only (§13's mandatory locale, longest heading). Widths 320/390/768/1024/1440
 *     (AC7's exact set).
 *   - Per cell: httpStatus/ok/fallbackMarkerPresent from the response + a body check for
 *     `NEXT_HTTP_ERROR_FALLBACK`; rowDisplay/rowOverflowX via getComputedStyle of the row node;
 *     rowScrollWidth/rowClientWidth/rowOverflows from the row node's scrollWidth/clientWidth;
 *     cardCount (element children of the row node); cardFlexBasis/cardFlexShrink/cardRectWidth
 *     from the first card node; docScrollWidth/docClientWidth/pageOverflows from
 *     document.documentElement.
 *   - Class names are hash-suffixed per build, so both lookups are substring attribute selectors:
 *     `.similar-listings [class*="SimilarListingsView_row"]` and, within it,
 *     `[class*="SimilarListingsView_card"]`.
 *   - Fails closed (cell + run, exit 1) on: non-OK response; NEXT_HTTP_ERROR_FALLBACK present;
 *     `.similar-listings` absent; the row node absent; a zero-area row bounding rect;
 *     rowDisplay !== 'flex'; rowOverflowX not one of auto/scroll; rowDisplay === 'grid' at any
 *     width; pageOverflows === true at 320 or 390.
 *   - `cardCount < 2` is NOT a failure (dev DB can be sparse) — records
 *     `overflowAssertionApplicable: cardCount >= 2` and skips the overflow judgement when false.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task803');
const RUNS_DIR = join(EVIDENCE_DIR, 'runs');
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';

const WIDTHS = [320, 390, 768, 1024, 1440];
const LOCALE = 'uk';

const slug = process.argv[2];
const runId = process.argv[3];
if (!slug || !runId || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(runId)) {
  console.error('Usage: node scripts/task803-similar-row-computed.mjs <slug> <runId>');
  process.exit(2);
}

function computeProbeHash() {
  return execFileSync('git', ['hash-object', 'scripts/task803-similar-row-computed.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
}

function computeGitCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
}

function evalCell() {
  const wrapper = document.querySelector('.similar-listings');
  const row = wrapper ? wrapper.querySelector('[class*="SimilarListingsView_row"]') : null;
  const card = row ? row.querySelector('[class*="SimilarListingsView_card"]') : null;

  const docEl = document.documentElement;
  const docScrollWidth = docEl.scrollWidth;
  const docClientWidth = docEl.clientWidth;
  const pageOverflows = docScrollWidth > docClientWidth + 2;

  let rowDisplay = null;
  let rowOverflowX = null;
  let rowScrollWidth = null;
  let rowClientWidth = null;
  let rowOverflows = null;
  let rowRectZeroArea = null;
  let cardCount = null;
  let cardFlexBasis = null;
  let cardFlexShrink = null;
  let cardRectWidth = null;

  if (row) {
    const rcs = getComputedStyle(row);
    rowDisplay = rcs.display;
    rowOverflowX = rcs.overflowX;
    rowScrollWidth = row.scrollWidth;
    rowClientWidth = row.clientWidth;
    rowOverflows = rowScrollWidth > rowClientWidth + 2;
    const rowRect = row.getBoundingClientRect();
    rowRectZeroArea = rowRect.width <= 0 || rowRect.height <= 0;
    cardCount = row.children.length;
  }

  if (card) {
    const ccs = getComputedStyle(card);
    cardFlexBasis = ccs.flexBasis;
    cardFlexShrink = ccs.flexShrink;
    cardRectWidth = card.getBoundingClientRect().width;
  }

  return {
    wrapperFound: !!wrapper,
    rowFound: !!row,
    cardFound: !!card,
    rowDisplay,
    rowOverflowX,
    rowScrollWidth,
    rowClientWidth,
    rowOverflows,
    rowRectZeroArea,
    cardCount,
    cardFlexBasis,
    cardFlexShrink,
    cardRectWidth,
    docScrollWidth,
    docClientWidth,
    pageOverflows,
  };
}

async function main() {
  let probeHash;
  let gitCommit;
  try {
    probeHash = computeProbeHash();
    if (!probeHash) throw new Error('empty git hash-object output');
    gitCommit = computeGitCommit();
    if (!/^[0-9a-f]{40}$/i.test(gitCommit)) throw new Error('invalid git rev-parse HEAD output');
  } catch (err) {
    console.error(
      `\n❌ task803-similar-row-computed: unable to identify the current Git tree (${
        err instanceof Error ? err.message : String(err)
      }). Refusing to write evidence without a reproducible commit.`
    );
    process.exit(1);
    return;
  }

  await mkdir(RUNS_DIR, { recursive: true });
  const runDir = join(RUNS_DIR, runId);
  await mkdir(runDir);

  const browser = await chromium.launch({ headless: true });
  const result = {
    slug,
    runId,
    locale: LOCALE,
    baseUrl: BASE_URL,
    capturedAt: new Date().toISOString(),
    probeHash,
    gitCommit,
    cells: [],
  };
  let hardFail = false;

  try {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const cell = { width };

      try {
        const response = await page.goto(`${BASE_URL}/${LOCALE}/listings/${slug}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        cell.httpStatus = response ? response.status() : null;
        cell.ok = response ? response.ok() : false;

        const bodyText = await page.content();
        cell.fallbackMarkerPresent = bodyText.includes('NEXT_HTTP_ERROR_FALLBACK');

        if (!cell.ok) {
          cell.failReason = `non-OK response status ${cell.httpStatus}`;
          hardFail = true;
        } else if (cell.fallbackMarkerPresent) {
          cell.failReason = 'NEXT_HTTP_ERROR_FALLBACK present in response body';
          hardFail = true;
        } else {
          const measured = await page.evaluate(evalCell);
          Object.assign(cell, measured);

          cell.overflowAssertionApplicable = typeof measured.cardCount === 'number' && measured.cardCount >= 2;

          const reasons = [];
          if (!measured.wrapperFound) reasons.push('.similar-listings not found');
          if (!measured.rowFound) reasons.push('row node not found');
          if (measured.rowFound) {
            if (measured.rowRectZeroArea) reasons.push('row bounding rect has zero area');
            if (measured.rowDisplay !== 'flex') reasons.push(`rowDisplay: ${measured.rowDisplay}`);
            if (!['auto', 'scroll'].includes(measured.rowOverflowX)) {
              reasons.push(`rowOverflowX not auto/scroll: ${measured.rowOverflowX}`);
            }
          }
          if ((width === 320 || width === 390) && measured.pageOverflows) {
            reasons.push(`pageOverflows at ${width}`);
          }

          if (reasons.length > 0) {
            cell.failReason = reasons.join('; ');
            hardFail = true;
          }
        }
      } catch (err) {
        cell.failReason = `navigation/evaluation error: ${err instanceof Error ? err.message : String(err)}`;
        hardFail = true;
      } finally {
        await context.close();
      }

      result.cells.push(cell);
    }
  } finally {
    await browser.close();
  }

  const outPath = join(runDir, 'similar-row-computed.json');
  await writeFile(outPath, JSON.stringify(result, null, 2), { encoding: 'utf8', flag: 'wx' });
  console.log(`Wrote ${outPath}`);

  if (hardFail) {
    console.error('\n❌ task803-similar-row-computed: one or more cells failed closed (see failReason above).');
    process.exit(1);
  }
  console.log('\n✅ task803-similar-row-computed: all cells captured cleanly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
