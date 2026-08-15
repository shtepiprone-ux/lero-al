#!/usr/bin/env node
/**
 * 691R round 3 (F-R, AC5) — per-property diff of the 240-tuple BEFORE/AFTER capture (2 stories x
 * 4 locales x 5 viewports x 3 states x 2 phases). Each tuple's `_resolved`-only keys (class-name
 * hashes, expected to change) are excluded from comparison, only `.data` is diffed.
 *
 * Unlike diff-computed-styles-160.mjs (which always exits 0 and treats its JSON, not its exit
 * status, as the assertion), this script EXITS NON-ZERO on any moved property, any errored
 * tuple, any missing tuple relative to the other phase, or either phase short of the required
 * 120-tuple count. The exit status is itself the assertion here.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPECTED_PER_PHASE = 120;

function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path, out);
    else out[path] = v;
  }
}

async function main() {
  const before = JSON.parse(await readFile(join(__dirname, 'computed-before-240.json'), 'utf8'));
  const after = JSON.parse(await readFile(join(__dirname, 'computed-after-240.json'), 'utf8'));

  const beforeKeys = Object.keys(before.tuples);
  const afterKeys = Object.keys(after.tuples);
  const commonKeys = beforeKeys.filter(k => afterKeys.includes(k));

  const perTupleDiffs = {};
  let totalDiffCount = 0;
  const movedProperties = new Set();
  const erroredTuples = [];

  for (const key of commonKeys) {
    const b = before.tuples[key];
    const a = after.tuples[key];
    if (b.error || a.error) {
      perTupleDiffs[key] = { error: b.error || a.error };
      erroredTuples.push(key);
      continue;
    }

    const bFlat = {}; flatten(b.data, '', bFlat);
    const aFlat = {}; flatten(a.data, '', aFlat);

    const diffs = [];
    const allProps = new Set([...Object.keys(bFlat), ...Object.keys(aFlat)]);
    for (const prop of allProps) {
      // syntheticClass legitimately differs (literal Tailwind string vs resolved module class) —
      // that's the locator changing, not a computed-style regression; excluded from the diff.
      if (prop.endsWith('syntheticClass')) continue;
      const bv = bFlat[prop];
      const av = aFlat[prop];
      if (bv !== av) {
        diffs.push({ prop, before: bv, after: av });
        movedProperties.add(prop.replace(/^.*\./, ''));
      }
    }
    if (diffs.length) { perTupleDiffs[key] = diffs; totalDiffCount += diffs.length; }
  }

  const missingFromBefore = afterKeys.filter(k => !beforeKeys.includes(k));
  const missingFromAfter = beforeKeys.filter(k => !afterKeys.includes(k));
  const beforeShort = beforeKeys.length < EXPECTED_PER_PHASE;
  const afterShort = afterKeys.length < EXPECTED_PER_PHASE;

  const result = {
    expectedPerPhase: EXPECTED_PER_PHASE,
    beforeTupleCount: beforeKeys.length,
    afterTupleCount: afterKeys.length,
    commonTupleCount: commonKeys.length,
    missingFromBefore,
    missingFromAfter,
    erroredTuples,
    totalDiffCount,
    // Non-error diff entries only; errors are counted separately in erroredTuples.
    tuplesWithDiffs: Object.keys(perTupleDiffs).filter(k => !erroredTuples.includes(k)).length,
    movedPropertyNames: [...movedProperties].sort(),
    perTupleDiffs,
  };

  const failed = totalDiffCount > 0 || erroredTuples.length > 0
    || missingFromBefore.length > 0 || missingFromAfter.length > 0
    || beforeShort || afterShort;
  result.assertionPassed = !failed;

  const outPath = join(__dirname, 'diff-240-result.json');
  await writeFile(outPath, JSON.stringify(result, null, 2));
  console.log(`expectedPerPhase=${EXPECTED_PER_PHASE} beforeTupleCount=${result.beforeTupleCount} afterTupleCount=${result.afterTupleCount} commonTupleCount=${result.commonTupleCount}`);
  console.log(`totalDiffCount=${result.totalDiffCount} tuplesWithDiffs=${result.tuplesWithDiffs} erroredTuples=${erroredTuples.length}`);
  console.log(`missingFromBefore=${JSON.stringify(missingFromBefore)} missingFromAfter=${JSON.stringify(missingFromAfter)}`);
  console.log(`movedPropertyNames=${JSON.stringify(result.movedPropertyNames)}`);
  console.log(`assertionPassed=${result.assertionPassed}`);
  console.log(`Wrote ${outPath}`);

  if (failed) {
    console.error('diff-computed-styles-240.mjs: FAILED — moved property, errored tuple, missing tuple, or short capture. See diff-240-result.json.');
    process.exitCode = 1;
  }
}
main().catch(e => { console.error(e); process.exit(1); });
