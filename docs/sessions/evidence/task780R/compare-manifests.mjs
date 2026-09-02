// Task 780R — retained B/P manifest comparator.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const B_PATH = join(DIR, 'B-manifest.json');
const P_PATH = join(DIR, 'P-manifest.json');
const OUT_PATH = join(DIR, 'differential-comparison.json');

const B = JSON.parse(readFileSync(B_PATH, 'utf-8'));
const P = JSON.parse(readFileSync(P_PATH, 'utf-8'));

function identity(cell) {
  return `${cell.story} × ${cell.locale} × ${cell.viewport}`;
}

function byIdentity(manifest) {
  const map = new Map();
  for (const cell of manifest.matrix) map.set(identity(cell), cell.verdict);
  return map;
}

const bMap = byIdentity(B);
const pMap = byIdentity(P);

const bFailed = new Set([...bMap.entries()].filter(([, v]) => v === 'fail').map(([k]) => k));
const bAmbiguous = new Set([...bMap.entries()].filter(([, v]) => v === 'ambiguous').map(([k]) => k));
const pFailed = new Set([...pMap.entries()].filter(([, v]) => v === 'fail').map(([k]) => k));
const pAmbiguous = new Set([...pMap.entries()].filter(([, v]) => v === 'ambiguous').map(([k]) => k));

const newFailed = [...pFailed].filter(id => !bFailed.has(id));
const newAmbiguous = [...pAmbiguous].filter(id => !bAmbiguous.has(id));

const listingsFilterBarCells = [...pMap.entries()].filter(([id]) => id.startsWith('Patterns/Mantine/ListingsFilterBar/'));
const listingsFilterBarNonPass = listingsFilterBarCells.filter(([, v]) => v !== 'pass');

// noHorizontalOverflow per ListingsFilterBar cell, from the full P matrix rows.
const lfbRows = P.matrix.filter(c => c.story === 'Patterns/Mantine/ListingsFilterBar/Default');
const lfbOverflow = lfbRows.map(c => ({
  locale: c.locale, viewport: c.viewport, verdict: c.verdict,
  noHorizontalOverflow: c.assertions?.noHorizontalOverflow ?? null,
}));

const result = {
  generatedAt: new Date().toISOString(),
  B: { path: B_PATH, summary: B.summary, timestamp: B.timestamp },
  P: { path: P_PATH, summary: P.summary, timestamp: P.timestamp },
  arithmetic: {
    totalDiff: P.summary.total - B.summary.total,
    passDiff: P.summary.passed - B.summary.passed,
    failDiff: P.summary.failed - B.summary.failed,
    ambiguousDiff: P.summary.ambiguousOnly - B.summary.ambiguousOnly,
    expectedTotalDiff: 16,
    expectedPassDiff: 16,
    expectedFailDiff: 0,
    expectedAmbiguousDiff: 0,
  },
  arithmeticPass:
    (P.summary.total - B.summary.total === 16) &&
    (P.summary.passed - B.summary.passed === 16) &&
    (P.summary.failed - B.summary.failed === 0) &&
    (P.summary.ambiguousOnly - B.summary.ambiguousOnly === 0),
  newFailedIdentities: newFailed,
  newAmbiguousIdentities: newAmbiguous,
  pMinusBEmpty: newFailed.length === 0 && newAmbiguous.length === 0,
  listingsFilterBarCellCount: listingsFilterBarCells.length,
  listingsFilterBarAllPass: listingsFilterBarCells.length === 16 && listingsFilterBarNonPass.length === 0,
  listingsFilterBarNonPassCells: listingsFilterBarNonPass.map(([id, v]) => ({ id, verdict: v })),
  listingsFilterBarCellsDetail: lfbOverflow,
};

writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
console.log(JSON.stringify({
  arithmeticPass: result.arithmeticPass,
  pMinusBEmpty: result.pMinusBEmpty,
  listingsFilterBarCellCount: result.listingsFilterBarCellCount,
  listingsFilterBarAllPass: result.listingsFilterBarAllPass,
  newFailedCount: newFailed.length,
  newAmbiguousCount: newAmbiguous.length,
}, null, 2));
console.log('\nPer-cell noHorizontalOverflow:');
for (const c of lfbOverflow) console.log(`  ${c.locale} × ${c.viewport}: verdict=${c.verdict} noHorizontalOverflow=${c.noHorizontalOverflow}`);
