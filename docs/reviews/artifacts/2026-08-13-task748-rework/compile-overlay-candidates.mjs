#!/usr/bin/env node
/**
 * Task 748 — compiled before-side for all 12 distinct overlay utilities in the live census
 * (§3.1/§10.2). Same technique as Task 691R's `compile-opacity-candidates.mjs`: compile each
 * candidate class against globals.css AT THE TASK'S OWN BASE REVISION (HEAD at filing time, before
 * any edit this task makes), via @tailwindcss/node, same as scripts/check-review-ledger.mjs's
 * SELF_TEST_TAILWIND_RULE technique.
 */
import { compile } from '@tailwindcss/node';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const BASE_REV = 'd3ffd6d6c51d9e968a47aabaaff46dcd69055a0f';

const CANDIDATES = [
  { class: 'text-overlay-foreground/70', site: 'PerfDevOverlay.tsx:31,56,59,74,79' },
  { class: 'text-overlay-foreground', site: 'PerfDevOverlay.tsx:46 · ListingGallery.tsx:107,120 · ImageUpload.tsx:164 · MantineListingGalleryPattern.tsx:57' },
  { class: 'bg-overlay/60', site: 'ListingGallery.tsx:120 · ImageUpload.tsx:164 · MantineListingGalleryPattern.tsx:57,80' },
  { class: 'bg-overlay/50', site: 'ListingGallery.tsx:107 · ImageUpload.tsx:114' },
  { class: 'bg-overlay/85', site: 'PerfDevOverlay.tsx:46' },
  { class: 'bg-overlay/70', site: 'ListingGallery.tsx:120' },
  { class: 'bg-overlay/30', site: 'AdminUserAvatar.tsx:169' },
  { class: 'text-overlay-foreground/80', site: 'LightboxView.tsx:87' },
  { class: 'text-overlay-foreground/60', site: 'PerfDevOverlay.tsx:86' },
  { class: 'text-overlay-foreground/50', site: 'PerfDevOverlay.tsx:50' },
  { class: 'text-overlay-foreground/40', site: 'PerfDevOverlay.tsx:81' },
  { class: 'border-overlay-foreground/20', site: 'PerfDevOverlay.tsx:64' },
];

async function main() {
  const css = execFileSync('git', ['show', `${BASE_REV}:src/app/globals.css`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const out = { baseRevision: BASE_REV, compilerInput: 'src/app/globals.css', compiler: 'tailwindcss (via @tailwindcss/node compile)', candidates: [] };

  for (const c of CANDIDATES) {
    const compiler = await compile(css, { base: ROOT, from: join(ROOT, 'src/app/globals.css'), onDependency() {} });
    const built = compiler.build([c.class]);
    out.candidates.push({ class: c.class, site: c.site, compiled: built });
  }

  const outPath = join(__dirname, 'compiled-before-overlay-candidates.json');
  await writeFile(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${outPath}`);
  for (const c of out.candidates) {
    console.log(`\n=== ${c.class} (${c.site}) ===`);
    console.log(c.compiled);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
