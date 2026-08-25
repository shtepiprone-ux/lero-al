#!/usr/bin/env node
/**
 * task766-route-shell-probe.mjs — Task 766 §13.1 AC5 rendered evidence.
 *
 * Modelled on `scripts/task764-pointer-probe.mjs` (per-label retained JSON evidence under
 * `docs/sessions/evidence/task<N>/`) and `scripts/check-click-shield.mjs` (`BASE_URL` env,
 * `<nextjs-portal>` dev-server preflight refusal — kickoff §13.1/§3.4).
 *
 * WHY THIS SCRIPT EXISTS: no existing command renders `/[locale]` — `responsive-screenshots.mjs`
 * captures only built Storybook stories by its own header, `check-stories-rendered.mjs` opens
 * only the story iframe, and `playwright/` is empty. AC5 (route shell `<main>` min-height) has no
 * other proof path, so this task-owned probe drives a real `next start` production server.
 *
 * It is EVIDENCE TOOLING, not a gate: no `package.json` script entry, nothing in CI depends on
 * it, exactly like `scripts/task764-pointer-probe.mjs`.
 *
 * Usage:
 *   node scripts/task766-route-shell-probe.mjs <label>
 * <label> is typically 'pre-edit' or 'post-edit'; output is written per-label (never overwritten)
 * to docs/sessions/evidence/task766/route-shell.<label>.json, so both runs are retained.
 *
 * Contract (kickoff §13.1):
 *   - Reads BASE_URL from the environment, defaulting to http://127.0.0.1:3000 (check-click-shield.mjs:58).
 *   - Navigates to `${BASE_URL}/en` in two Playwright contexts with PINNED viewports — 320x812 and
 *     1440x900 — because `min-height: calc(100vh - 4rem)` resolves against viewport height.
 *   - For each cell, resolves `document.querySelector('main')` and records `minHeight`,
 *     `paddingBottom`, `display`, `getBoundingClientRect()` from `getComputedStyle`, plus
 *     `main.className` and a `resolvedFrom` field naming which stylesheet rule or inline style
 *     supplies `min-height`.
 *
 *   CAVEAT (Task 766-R1, R14.3): `resolveMinHeightSourceInPage()` below returns the LAST matching
 *   rule in document order (plus an inline-style short-circuit) — it is a document-order
 *   heuristic, not a cascade resolver. It computes no specificity, no cascade-layer order, and no
 *   `!important`. Treat `resolvedFrom` as informative provenance for a single-rule-set case, not
 *   as proof of which rule the browser's own cascade algorithm would pick in a multi-rule-set case.
 *   - Fails closed: if `main` is absent, the response status is not OK, or a `<nextjs-portal>`
 *     element is present (a `next dev` server was used by mistake), it writes what it measured
 *     and exits non-zero.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task766');
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';

const VIEWPORTS = [
  { name: '320x812', width: 320, height: 812 },
  { name: '1440x900', width: 1440, height: 900 },
];

const label = process.argv[2];
if (!label) {
  console.error('Usage: node scripts/task766-route-shell-probe.mjs <label>');
  process.exit(2);
}

// Resolves which stylesheet rule (or inline style) is actually supplying `min-height` on the
// given element, by walking the CSSOM (recursing into @layer/@media grouping rules, the same
// technique task764-pointer-probe.mjs uses) rather than assuming a hardcoded selector.
function resolveMinHeightSourceInPage() {
  const el = document.querySelector('main');
  if (!el) return null;

  if (el.style && el.style.minHeight) {
    return `inline style: min-height: ${el.style.minHeight}`;
  }

  function walkRules(rules, out) {
    for (const rule of rules) {
      // Chromium's native CSS Nesting support means every CSSStyleRule now exposes a `.cssRules`
      // property (an empty CSSRuleList when it has no nested children) — it is NOT exclusive with
      // being a leaf style rule with its own `selectorText`/`style`. Check both, and only recurse
      // when there is actually something to recurse into (never `continue`/skip the leaf check).
      if (rule.selectorText && rule.style && rule.style.minHeight) {
        try {
          if (el.matches(rule.selectorText)) {
            out.push(`${rule.selectorText} { min-height: ${rule.style.minHeight} }`);
          }
        } catch {
          // Invalid/unsupported selector for `matches()` — skip, not a match.
        }
      }
      if (rule.cssRules && rule.cssRules.length > 0) {
        walkRules(rule.cssRules, out);
      }
    }
  }

  const matches = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin stylesheet, cannot introspect
    }
    if (rules) walkRules(rules, matches);
  }
  return matches.length > 0 ? matches[matches.length - 1] : 'unresolved (no matching CSSOM rule, no inline style)';
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

      if (!cell.ok || devServerDetected || mainCount !== 1) {
        cell.failReason = !cell.ok
          ? `non-OK response status ${cell.httpStatus}`
          : devServerDetected
            ? 'nextjs-portal present — next dev server detected, refusing to treat as production evidence'
            : `document.querySelector('main') expected exactly 1, found ${mainCount}`;
        hardFail = true;
      } else {
        const computed = await page.evaluate(() => {
          const el = document.querySelector('main');
          const cs = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            className: el.className,
            minHeight: cs.minHeight,
            paddingBottom: cs.paddingBottom,
            display: cs.display,
            rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
          };
        });
        cell.className = computed.className;
        cell.minHeight = computed.minHeight;
        cell.paddingBottom = computed.paddingBottom;
        cell.display = computed.display;
        cell.rect = computed.rect;
        cell.resolvedFrom = await page.evaluate(resolveMinHeightSourceInPage);
      }
    } catch (err) {
      cell.failReason = `navigation/evaluation error: ${err instanceof Error ? err.message : String(err)}`;
      hardFail = true;
    } finally {
      await context.close();
    }

    result.cells.push(cell);
  }

  await browser.close();

  const outPath = join(EVIDENCE_DIR, `route-shell.${label}.json`);
  await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(JSON.stringify(result, null, 2));

  if (hardFail) {
    console.error('\n❌ task766-route-shell-probe: one or more cells failed closed (see failReason above).');
    process.exit(1);
  }
  console.log('\n✅ task766-route-shell-probe: all cells captured cleanly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
