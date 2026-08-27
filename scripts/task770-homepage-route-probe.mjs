#!/usr/bin/env node
/**
 * task770-homepage-route-probe.mjs — Task 770 §13.3 real-route evidence (AC9).
 *
 * Modelled on `scripts/task767-homepage-runtime-probe.mjs` (per-label retained JSON evidence under
 * `docs/sessions/evidence/task<N>/`, `BASE_URL` env, `<nextjs-portal>` dev-server preflight refusal,
 * per-cell PNG).
 *
 * WHY THIS SCRIPT EXISTS: `page.tsx` and `layout.tsx` have no story (route pages, not components)
 * and none may be created (kickoff §3.11 — "reuse (nothing to create)"), so the hero-wrapper
 * `py`/`pb` claim (AC9) has no proof path except a real `next start` route capture. This is
 * EVIDENCE TOOLING, not a gate: no CI wiring, exactly like `scripts/task767-homepage-runtime-probe.mjs`.
 *
 * Usage:
 *   node scripts/task770-homepage-route-probe.mjs <label>
 * <label> is typically 'pre-edit' or 'post-edit'; output is written per-label (never overwritten)
 * to docs/sessions/evidence/task770/homepage-route.<label>.json, plus one PNG per viewport cell in
 * the same folder, so both runs are retained.
 *
 * Contract (kickoff §13.3):
 *   - Reads BASE_URL from the environment, defaulting to http://127.0.0.1:3000.
 *   - Navigates to `${BASE_URL}/en` at 320x812, 768x1024, 1440x900 — 320 for the bottom-nav gutter,
 *     768 for the Mantine `md` step, 1440 for the `xxl` step `MantineHomeSection` reads.
 *   - Per cell records: computed `padding-bottom` of `main`; computed `padding-top`/`padding-bottom`
 *     of the first `main section`; the resolved value of `--homepage-runtime-space-14`,
 *     `--homepage-runtime-space-16/24` and `--homepage-runtime-section-py-base/md/lg` read off the
 *     document element; a full-page screenshot.
 *   - Fails closed: a non-OK response, a missing selector, a `<nextjs-portal>` element (next dev
 *     used by mistake), or a viewport it could not set, writes what it measured and exits non-zero.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task770');
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';

const VIEWPORTS = [
  { name: '320x812', width: 320, height: 812 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1440x900', width: 1440, height: 900 },
];

const RUNTIME_PROPS = [
  '--homepage-runtime-space-14',
  '--homepage-runtime-space-16',
  '--homepage-runtime-space-24',
  '--homepage-runtime-section-py-base',
  '--homepage-runtime-section-py-md',
  '--homepage-runtime-section-py-lg',
];

const label = process.argv[2];
if (!label) {
  console.error('Usage: node scripts/task770-homepage-route-probe.mjs <label>');
  process.exit(2);
}

async function main() {
  await mkdir(EVIDENCE_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const result = {
    label,
    baseUrl: BASE_URL,
    route: '/en',
    capturedAt: new Date().toISOString(),
    cells: [],
  };
  let hardFail = false;

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const cell = { viewport: viewport.name, width: viewport.width, height: viewport.height };

    try {
      const response = await page.goto(`${BASE_URL}/en`, { waitUntil: 'networkidle', timeout: 30000 });
      cell.httpStatus = response ? response.status() : null;
      cell.ok = response ? response.ok() : false;

      const devServerDetected = await page.evaluate(() => !!document.querySelector('nextjs-portal'));
      cell.devServerDetected = devServerDetected;

      const mainCount = await page.evaluate(() => document.querySelectorAll('main').length);
      cell.mainCount = mainCount;
      const firstSectionCount = await page.evaluate(() => document.querySelectorAll('main section').length);
      cell.firstSectionCount = firstSectionCount;

      if (!cell.ok || devServerDetected || mainCount !== 1 || firstSectionCount < 1) {
        cell.failReason = !cell.ok
          ? `non-OK response status ${cell.httpStatus}`
          : devServerDetected
            ? 'nextjs-portal present — next dev server detected, refusing to treat as production evidence'
            : mainCount !== 1
              ? `document.querySelectorAll('main') expected exactly 1, found ${mainCount}`
              : `document.querySelectorAll('main section') expected at least 1, found ${firstSectionCount}`;
        hardFail = true;
      } else {
        const computed = await page.evaluate((propNames) => {
          const main = document.querySelector('main');
          const firstSection = document.querySelector('main section');
          const mainCs = getComputedStyle(main);
          const sectionCs = getComputedStyle(firstSection);
          const rootCs = getComputedStyle(document.documentElement);
          const runtimeTokens = {};
          for (const name of propNames) runtimeTokens[name] = rootCs.getPropertyValue(name).trim();
          return {
            main: { paddingBottom: mainCs.paddingBottom },
            firstSection: { paddingTop: sectionCs.paddingTop, paddingBottom: sectionCs.paddingBottom },
            runtimeTokens,
          };
        }, RUNTIME_PROPS);

        cell.main = computed.main;
        cell.firstSection = computed.firstSection;
        cell.runtimeTokens = computed.runtimeTokens;
      }
    } catch (err) {
      cell.failReason = `navigation/evaluation error: ${err instanceof Error ? err.message : String(err)}`;
      hardFail = true;
    } finally {
      await context.close();
    }

    if (!cell.failReason) {
      await captureScreenshot(browser, viewport, label);
    }
    result.cells.push(cell);
  }

  await browser.close();

  const outPath = join(EVIDENCE_DIR, `homepage-route.${label}.json`);
  await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(JSON.stringify(result, null, 2));

  if (hardFail) {
    console.error('\n❌ task770-homepage-route-probe: one or more cells failed closed (see failReason above).');
    process.exit(1);
  }
  console.log('\n✅ task770-homepage-route-probe: all cells captured cleanly.');
}

async function captureScreenshot(browser, viewport, label) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  try {
    await page.goto(`${BASE_URL}/en`, { waitUntil: 'networkidle', timeout: 30000 });
    const outPath = join(EVIDENCE_DIR, `homepage-route.${label}.${viewport.name}.png`);
    await page.screenshot({ path: outPath, fullPage: true });
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
