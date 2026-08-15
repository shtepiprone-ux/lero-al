#!/usr/bin/env node
/**
 * 691R (F-C, AC5) — per-property diff of the 160-tuple BEFORE/AFTER capture. Any moved property
 * is a D28 violation to explain or fix; each tuple's `_resolved`-only keys (class-name hashes,
 * expected to change) are excluded from comparison, only `.data` is diffed.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path, out);
    else out[path] = v;
  }
}

async function main() {
  const before = JSON.parse(await readFile(join(__dirname, 'computed-before-160.json'), 'utf8'));
  const after = JSON.parse(await readFile(join(__dirname, 'computed-after-160.json'), 'utf8'));

  const beforeKeys = Object.keys(before.tuples);
  const afterKeys = Object.keys(after.tuples);
  const commonKeys = beforeKeys.filter(k => afterKeys.includes(k));

  const perTupleDiffs = {};
  let totalDiffCount = 0;
  const movedProperties = new Set();

  for (const key of commonKeys) {
    const b = before.tuples[key];
    const a = after.tuples[key];
    if (b.error || a.error) { perTupleDiffs[key] = { error: b.error || a.error }; continue; }

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

  const result = {
    beforeTupleCount: beforeKeys.length,
    afterTupleCount: afterKeys.length,
    commonTupleCount: commonKeys.length,
    missingFromBefore: afterKeys.filter(k => !beforeKeys.includes(k)),
    missingFromAfter: beforeKeys.filter(k => !afterKeys.includes(k)),
    totalDiffCount,
    tuplesWithDiffs: Object.keys(perTupleDiffs).length,
    movedPropertyNames: [...movedProperties].sort(),
    perTupleDiffs,
  };

  const outPath = join(__dirname, 'diff-160-result.json');
  await writeFile(outPath, JSON.stringify(result, null, 2));
  console.log(`beforeTupleCount=${result.beforeTupleCount} afterTupleCount=${result.afterTupleCount} commonTupleCount=${result.commonTupleCount}`);
  console.log(`totalDiffCount=${result.totalDiffCount} tuplesWithDiffs=${result.tuplesWithDiffs}`);
  console.log(`movedPropertyNames=${JSON.stringify(result.movedPropertyNames)}`);
  console.log(`Wrote ${outPath}`);
}
main().catch(e => { console.error(e); process.exit(1); });
