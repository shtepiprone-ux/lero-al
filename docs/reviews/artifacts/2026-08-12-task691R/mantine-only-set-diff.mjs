#!/usr/bin/env node
/**
 * 691R (F-K) — identity-level set diff of the current --mantine-only fail set against
 * Task 733's standing comparator, per D37 (a set diff, not an aggregate count match).
 */
import { readFile, writeFile } from 'node:fs/promises';

const COMPARATOR_MANIFEST = '.screenshots/rendered-assert/2026-08-09T15-13/manifest.json';
const CURRENT_MANIFEST = process.argv[2];
if (!CURRENT_MANIFEST) { console.error('usage: node mantine-only-set-diff.mjs <current-manifest-path>'); process.exit(2); }

function failIdentities(manifest) {
  const set = new Set();
  for (const key of Object.keys(manifest.matrix)) {
    const cell = manifest.matrix[key];
    if (cell.verdict === 'fail') {
      set.add(`${cell.story}|${cell.locale}|${cell.viewport}`);
    }
  }
  return set;
}

async function main() {
  const comparator = JSON.parse(await readFile(COMPARATOR_MANIFEST, 'utf8'));
  const current = JSON.parse(await readFile(CURRENT_MANIFEST, 'utf8'));

  const comparatorFails = failIdentities(comparator);
  const currentFails = failIdentities(current);

  const added = [...currentFails].filter(k => !comparatorFails.has(k)).sort();
  const removed = [...comparatorFails].filter(k => !currentFails.has(k)).sort();

  const result = {
    comparatorManifest: COMPARATOR_MANIFEST,
    comparatorSummary: comparator.summary,
    currentManifest: CURRENT_MANIFEST,
    currentSummary: current.summary,
    comparatorFailCount: comparatorFails.size,
    currentFailCount: currentFails.size,
    added,
    removed,
    setIdentical: added.length === 0 && removed.length === 0,
  };

  const outPath = '.screenshots/task691-delta/mantine-only-set-diff-result.json';
  await writeFile(outPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  console.log(`\nWrote ${outPath}`);
}
main().catch(e => { console.error(e); process.exit(1); });
