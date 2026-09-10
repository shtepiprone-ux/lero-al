#!/usr/bin/env node
/**
 * task808-key-warning-probe.mjs — Playwright-based regression guard for Task 808's key warning
 * (`Each child in a list should have a unique "key" prop` on the listing detail route).
 *
 * WHY THIS IS A LIVE-BROWSER SCRIPT, NOT A VITEST TEST (recorded for Opus review):
 * R1 established (session log, Phase 1) that the warning fires ONLY on a Next.js App Router
 * CLIENT-SIDE (soft) navigation into `/[locale]/listings/[slug]` — never on a hard reload/SSR
 * hydration, and never in a vitest+jsdom render (tried: plain mount, mount+rerender with fresh
 * unkeyed elements, StrictMode+startTransition, and a Suspense fallback->resolved swap inside a
 * transition — none reproduced it). The mechanism requires the real Next.js Router/RSC Flight
 * client-navigation pipeline, which does not exist in a jsdom unit test. This is the SAME reason
 * `check-hydration-console.mjs` (Epic RS Slice 1, Task 436) exists as a Playwright script instead
 * of a vitest test: dev-only React console warnings tied to a specific runtime reconciliation path
 * do not appear in tsc / lint / build / jsdom — only in a running browser doing the real navigation.
 *
 * WHAT THIS SCRIPT DOES:
 *   1. Loads INDEX_PATH (default /uk/listings) — a hard navigation, establishing the hydrated app.
 *   2. Clicks a real rendered `<Link>` to a listing detail page (LINK_HREF) — a Next.js
 *      CLIENT-SIDE (soft) navigation, the exact trigger R1 identified.
 *   3. Captures the complete browser console output during that transition.
 *   4. FAILs (exit 1) if the key-warning text is present; PASSes (exit 0) otherwise.
 *   5. Persists the full transcript to OUT_DIR for the session evidence record.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 \
 *   INDEX_PATH=/uk/listings \
 *   LINK_HREF=/uk/listings/<slug> \
 *   OUT_DIR=docs/sessions/evidence/task808 \
 *   OUT_FILE=console-soft-nav-before.txt \
 *   node scripts/task808-key-warning-probe.mjs
 *
 * DEV-ONLY, same rule as check-hydration-console.mjs: run against `next dev`, never `next start` —
 * React strips dev-mode key warnings from production builds by design.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const INDEX_PATH = process.env.INDEX_PATH ?? '/uk/listings';
const LINK_HREF = process.env.LINK_HREF;
const OUT_DIR = process.env.OUT_DIR ?? 'docs/sessions/evidence/task808';
const OUT_FILE = process.env.OUT_FILE ?? 'console-soft-nav.txt';

const KEY_WARNING_PATTERN = /Each child in a list should have a unique "key" prop/;

async function main() {
  if (!LINK_HREF) {
    console.error('LINK_HREF env var is required (e.g. /uk/listings/<slug>)');
    process.exit(2);
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const messages = [];
  page.on('console', msg => messages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => messages.push({ type: 'pageerror', text: String(err.message ?? err) }));

  const indexUrl = `${BASE_URL}${INDEX_PATH}`;
  console.log(`[1/3] Hard navigation to ${indexUrl}`);
  await page.goto(indexUrl, { waitUntil: 'load', timeout: 30_000 });
  await page.waitForTimeout(1500);

  // Clear pre-navigation noise (LCP/perf/devtools logs from the index page itself) — only the
  // transition triggered by the click below is under test.
  messages.length = 0;

  const linkCount = await page.locator(`a[href="${LINK_HREF}"]`).count();
  if (linkCount === 0) {
    console.error(`No <a href="${LINK_HREF}"> found on ${indexUrl} — cannot perform the soft navigation.`);
    await browser.close();
    process.exit(2);
  }

  console.log(`[2/3] Client-side (soft) navigation via click on a[href="${LINK_HREF}"]`);
  await page.locator(`a[href="${LINK_HREF}"]`).first().click();
  await page.waitForTimeout(6000);

  console.log(`[3/3] Captured ${messages.length} console message(s) during the transition.`);

  const transcript = messages.map((m, i) => `[${i}] (${m.type}) ${m.text}`).join('\n');
  const outPath = `${OUT_DIR}/${OUT_FILE}`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, transcript + '\n', 'utf8');
  console.log(`Transcript written to ${outPath}`);

  await browser.close();

  const hit = messages.find(m => KEY_WARNING_PATTERN.test(m.text));
  if (hit) {
    console.error(`\nFAIL — key warning present: ${hit.text.slice(0, 200)}`);
    process.exit(1);
  }
  console.log('\nPASS — no key warning during the transition.');
  process.exit(0);
}

main().catch(err => {
  console.error('task808-key-warning-probe.mjs: fatal error\n', err);
  process.exit(1);
});
