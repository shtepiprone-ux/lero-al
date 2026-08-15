#!/usr/bin/env node
/**
 * 691R (F-J) — compiled before-side for every opacity-modifier Tailwind candidate the base
 * revision's MantineListingCardPattern.tsx actually used. Measured directly (not assumed): a
 * grep of `git show 2ad067bc1f845a4328f4850e02e25164d15cf0cd:.../MantineListingCardPattern.tsx`
 * finds exactly 3 distinct opacity-modifier utility strings across 5 physical usage sites —
 * `bg-overlay/60` (x2: photoCountList/photoCountGrid), `bg-overlay/30` (x1: overlayCenter),
 * `text-muted-foreground/70` (x2: originalPriceList/priceMetaRow). `text-overlay-foreground` and
 * bare `text-muted-foreground` also appear but carry no `/NN` opacity modifier and compile to a
 * single unconditional declaration, not the two-rule static-fallback + @supports(color-mix) form
 * — confirmed empirically below, not assumed.
 *
 * Compiles each against the base revision's own `src/app/globals.css`
 * (`git show <base>:src/app/globals.css`), same @tailwindcss/node technique
 * scripts/check-review-ledger.mjs uses for its SELF_TEST_TAILWIND_RULE (:56-62). This machine is
 * native win32 with @tailwindcss/oxide-win32-x64-msvc present, so — unlike the review's Linux
 * sandbox — this compiler actually runs here.
 */
import { compile } from '@tailwindcss/node';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const BASE_REV = '2ad067bc1f845a4328f4850e02e25164d15cf0cd';

const CANDIDATES = [
  { class: 'bg-overlay/60', site: 'photoCountList, photoCountGrid' },
  { class: 'bg-overlay/30', site: 'overlayCenter' },
  { class: 'text-muted-foreground/70', site: 'originalPriceList, priceMetaRow' },
  // Measured siblings with no opacity modifier — compiled for contrast/completeness, confirming
  // they do NOT take the two-rule color-mix form.
  { class: 'text-overlay-foreground', site: 'photoCountList, photoCountGrid, overlayLabel (no modifier)' },
  { class: 'text-muted-foreground', site: 'typeLabel/metaRow/metaRowBordered/locationIconGrid (no modifier)' },
];

async function main() {
  const css = execFileSync('git', ['show', `${BASE_REV}:src/app/globals.css`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const out = { baseRevision: BASE_REV, compilerInput: 'src/app/globals.css', compiler: 'tailwindcss (via @tailwindcss/node compile)', candidates: [] };

  for (const c of CANDIDATES) {
    const compiler = await compile(css, { base: ROOT, from: join(ROOT, 'src/app/globals.css'), onDependency() {} });
    const built = compiler.build([c.class]);
    out.candidates.push({ class: c.class, site: c.site, compiled: built });
  }

  const outPath = join(__dirname, 'compiled-before-opacity-candidates.json');
  await writeFile(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${outPath}`);
  for (const c of out.candidates) {
    console.log(`\n=== ${c.class} (${c.site}) ===`);
    console.log(c.compiled);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
