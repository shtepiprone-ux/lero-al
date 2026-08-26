#!/usr/bin/env node
/**
 * task767-homepage-runtime-probe.mjs — Task 767 §13.1 AC7 rendered evidence.
 *
 * Modelled on `scripts/task766-route-shell-probe.mjs` (per-label retained JSON evidence under
 * `docs/sessions/evidence/task<N>/`, `BASE_URL` env, `<nextjs-portal>` dev-server preflight
 * refusal) and `scripts/task764-pointer-probe.mjs` (retained per-label PNG + JSON pairs).
 *
 * WHY THIS SCRIPT EXISTS: `page.tsx` has no story (a route page, not a component) and none may be
 * created (kickoff §3.9 — "reuse (nothing to create)"), so the hero title/subtitle/search-bar
 * geometry claim (AC7) has no proof path except a real `next start` route capture. This is
 * EVIDENCE TOOLING, not a gate: no CI wiring, exactly like `scripts/task764-pointer-probe.mjs` and
 * `scripts/task766-route-shell-probe.mjs`.
 *
 * Usage:
 *   node scripts/task767-homepage-runtime-probe.mjs <label>
 * <label> is typically 'pre-edit' or 'post-edit'; output is written per-label (never overwritten)
 * to docs/sessions/evidence/task767/homepage-runtime.<label>.json, plus one PNG per viewport cell
 * in the same folder, so both runs are retained.
 *
 * Contract (kickoff §13.1):
 *   - Reads BASE_URL from the environment, defaulting to http://127.0.0.1:3000.
 *   - Navigates to `${BASE_URL}/en` in four contexts with PINNED viewports: 320x812, 640x900,
 *     768x1024, 1024x900. 640 is mandatory — it is the only sampled width in the Mantine `sm`
 *     tier (kickoff §3.7; the candidate draft's 320/768/1024 set could never observe it).
 *   - Per cell, resolves the hero `h1` (`main h1`, the first one) and its SIBLING subtitle by DOM
 *     relationship (nextElementSibling), never by a class name this task does not control.
 *     Records computed fontSize/lineHeight/fontWeight for both text nodes; computed maxWidth,
 *     width and getBoundingClientRect() for the `.hero-search` container.
 *   - Also records, per cell, the resolved custom-property value behind each measured font size
 *     (`getComputedStyle(el).getPropertyValue('--homepage-runtime-font-size-*')`) and the raw
 *     `style` attribute Mantine emitted, so the post-edit run positively shows a project-owned
 *     source rather than a Tailwind-emitted one. Pre-edit, these custom-property reads legitimately
 *     return '' (the token does not exist yet) — that is the expected pre-edit reading, not a probe
 *     defect.
 *   - Fails closed: a non-OK response, a missing selector, a `<nextjs-portal>` element (next dev
 *     used by mistake), or a viewport it could not set, writes what it measured and exits non-zero.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task767');
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';

const VIEWPORTS = [
  { name: '320x812', width: 320, height: 812 },
  { name: '640x900', width: 640, height: 900 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x900', width: 1024, height: 900 },
];

const RUNTIME_PROPS = [
  '--homepage-runtime-font-size-xl',
  '--homepage-runtime-font-size-2xl',
  '--homepage-runtime-font-size-3xl',
  '--homepage-runtime-font-size-4xl',
  '--homepage-runtime-font-size-5xl',
  '--homepage-runtime-search-max-width',
];

const label = process.argv[2];
if (!label) {
  console.error('Usage: node scripts/task767-homepage-runtime-probe.mjs <label>');
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

      const heroTitleCount = await page.evaluate(() => document.querySelectorAll('main h1').length);
      cell.heroTitleCount = heroTitleCount;

      const heroSearchCount = await page.evaluate(() => document.querySelectorAll('.hero-search').length);
      cell.heroSearchCount = heroSearchCount;

      if (!cell.ok || devServerDetected || heroTitleCount !== 1 || heroSearchCount !== 1) {
        cell.failReason = !cell.ok
          ? `non-OK response status ${cell.httpStatus}`
          : devServerDetected
            ? 'nextjs-portal present — next dev server detected, refusing to treat as production evidence'
            : heroTitleCount !== 1
              ? `document.querySelectorAll('main h1') expected exactly 1, found ${heroTitleCount}`
              : `document.querySelectorAll('.hero-search') expected exactly 1, found ${heroSearchCount}`;
        hardFail = true;
      } else {
        const computed = await page.evaluate((propNames) => {
          const h1 = document.querySelector('main h1');
          // Mantine injects a <style> element as a DOM sibling for each styled component's
          // responsive CSS — nextElementSibling can land on that injected tag before the real
          // next content element, so walk past any number of <style> siblings to reach it.
          let subtitle = h1.nextElementSibling;
          while (subtitle && subtitle.tagName === 'STYLE') subtitle = subtitle.nextElementSibling;
          const search = document.querySelector('.hero-search');

          const h1cs = getComputedStyle(h1);
          const subCs = subtitle ? getComputedStyle(subtitle) : null;
          const searchCs = getComputedStyle(search);
          const searchRect = search.getBoundingClientRect();

          const rootCs = getComputedStyle(document.documentElement);
          const runtimeTokens = {};
          for (const name of propNames) runtimeTokens[name] = rootCs.getPropertyValue(name).trim();

          return {
            title: {
              tagName: h1.tagName,
              text: h1.textContent,
              fontSize: h1cs.fontSize,
              lineHeight: h1cs.lineHeight,
              fontWeight: h1cs.fontWeight,
              inlineStyle: h1.getAttribute('style'),
            },
            subtitle: subtitle ? {
              tagName: subtitle.tagName,
              text: subtitle.textContent,
              fontSize: subCs.fontSize,
              lineHeight: subCs.lineHeight,
              fontWeight: subCs.fontWeight,
              inlineStyle: subtitle.getAttribute('style'),
            } : null,
            heroSearch: {
              maxWidth: searchCs.maxWidth,
              width: searchCs.width,
              rect: { width: searchRect.width, height: searchRect.height },
              inlineStyle: search.getAttribute('style'),
            },
            runtimeTokens,
          };
        }, RUNTIME_PROPS);

        cell.title = computed.title;
        cell.subtitle = computed.subtitle;
        cell.heroSearch = computed.heroSearch;
        cell.runtimeTokens = computed.runtimeTokens;
      }
    } catch (err) {
      cell.failReason = `navigation/evaluation error: ${err instanceof Error ? err.message : String(err)}`;
      hardFail = true;
    } finally {
      await context.close();
    }

    if (!cell.failReason) {
      await page2Screenshot(browser, viewport, label);
    }
    result.cells.push(cell);
  }

  await browser.close();

  const outPath = join(EVIDENCE_DIR, `homepage-runtime.${label}.json`);
  await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(JSON.stringify(result, null, 2));

  if (hardFail) {
    console.error('\n❌ task767-homepage-runtime-probe: one or more cells failed closed (see failReason above).');
    process.exit(1);
  }
  console.log('\n✅ task767-homepage-runtime-probe: all cells captured cleanly.');
}

// Full-page screenshot per cell, retained alongside the JSON (kickoff §13.1: "a PNG per cell").
async function page2Screenshot(browser, viewport, label) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  const page = await context.newPage();
  try {
    await page.goto(`${BASE_URL}/en`, { waitUntil: 'networkidle', timeout: 30000 });
    const outPath = join(EVIDENCE_DIR, `homepage-runtime.${label}.${viewport.name}.png`);
    await page.screenshot({ path: outPath, fullPage: true });
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
