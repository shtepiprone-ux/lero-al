#!/usr/bin/env node
// compare-rev1b-rendered-assert.mjs — Task 764 Revision 1 (amended), D63-I / D63-K / §10.7.
//
// AC23 substitutes a differential comparator for the raw `screenshots:assert -- --mantine-only`
// exit code, which fails on a standing repository condition unrelated to ListingCard (80 FAIL /
// 27 AMBIGUOUS in AuthSheet/AdminUsersTable/Combobox/PopularLocationsView — F14). This script
// keys every rendered-assert manifest cell by `storyId × locale × viewport` and reports:
//   1. non-pass cells present in --current and absent from --baseline ("added")
//   2. non-pass cells present in --baseline and absent from --current ("removed")
//   3. the status of every cell whose storyId contains "listingcard"
// Exits non-zero if `added` or `removed` is non-empty, or if any listingcard cell is not `pass`.
//
// Usage:
//   node docs/sessions/evidence/task764/compare-rev1b-rendered-assert.mjs --baseline <path> --current <path> [--out <path>]
import { readFileSync, writeFileSync } from 'node:fs';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--baseline') out.baseline = argv[++i];
    else if (argv[i] === '--current') out.current = argv[++i];
    else if (argv[i] === '--out') out.out = argv[++i];
  }
  if (!out.baseline || !out.current) {
    console.error('Usage: node compare-rev1b-rendered-assert.mjs --baseline <path> --current <path> [--out <path>]');
    process.exit(2);
  }
  return out;
}

function loadManifest(path) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const matrix = raw.matrix || raw.cells || raw.results;
  if (!Array.isArray(matrix)) {
    console.error(`Manifest at ${path} has no matrix/cells/results array`);
    process.exit(2);
  }
  return { raw, matrix };
}

function cellKey(cell) {
  return `${cell.storyId} ${cell.locale} ${cell.viewport}`;
}

function cellVerdict(cell) {
  // Normalizes to 'pass' | 'fail' | 'ambiguous' | whatever the manifest itself records.
  return cell.verdict ?? (cell.pass ? 'pass' : 'fail');
}

function isNonPass(cell) {
  return cellVerdict(cell) !== 'pass';
}

function main() {
  const { baseline: baselinePath, current: currentPath, out: outPath } = parseArgs(process.argv.slice(2));

  const { matrix: baselineMatrix } = loadManifest(baselinePath);
  const { matrix: currentMatrix } = loadManifest(currentPath);

  const baselineByKey = new Map(baselineMatrix.map((c) => [cellKey(c), c]));
  const currentByKey = new Map(currentMatrix.map((c) => [cellKey(c), c]));

  const baselineNonPassKeys = new Set(baselineMatrix.filter(isNonPass).map(cellKey));
  const currentNonPassKeys = new Set(currentMatrix.filter(isNonPass).map(cellKey));

  const added = [...currentNonPassKeys].filter((k) => !baselineNonPassKeys.has(k));
  const removed = [...baselineNonPassKeys].filter((k) => !currentNonPassKeys.has(k));

  const listingcardCells = currentMatrix
    .filter((c) => c.storyId.includes('listingcard'))
    .map((c) => ({ storyId: c.storyId, locale: c.locale, viewport: c.viewport, verdict: cellVerdict(c) }));
  const listingcardAllPass = listingcardCells.length > 0 && listingcardCells.every((c) => c.verdict === 'pass');

  const result = {
    baselinePath,
    currentPath,
    baselineSummary: { total: baselineMatrix.length, nonPass: baselineNonPassKeys.size },
    currentSummary: { total: currentMatrix.length, nonPass: currentNonPassKeys.size },
    added: added.map((k) => {
      const [storyId, locale, viewport] = k.split(' ');
      const cell = currentByKey.get(k);
      return { storyId, locale, viewport, verdict: cellVerdict(cell) };
    }),
    removed: removed.map((k) => {
      const [storyId, locale, viewport] = k.split(' ');
      const cell = baselineByKey.get(k);
      return { storyId, locale, viewport, verdict: cellVerdict(cell) };
    }),
    listingcardCells,
    listingcardAllPass,
  };

  const pass = added.length === 0 && removed.length === 0 && listingcardAllPass;
  result.pass = pass;

  console.log('Baseline:', baselinePath, `(${baselineMatrix.length} cells, ${baselineNonPassKeys.size} non-pass)`);
  console.log('Current: ', currentPath, `(${currentMatrix.length} cells, ${currentNonPassKeys.size} non-pass)`);
  console.log('added:', added.length);
  console.log('removed:', removed.length);
  console.log('listingcard cells:', listingcardCells.length, '- all pass:', listingcardAllPass);
  if (added.length) console.log('ADDED cells:', JSON.stringify(result.added, null, 2));
  if (removed.length) console.log('REMOVED cells:', JSON.stringify(result.removed, null, 2));
  if (!listingcardAllPass) console.log('listingcard cells (not all pass):', JSON.stringify(listingcardCells, null, 2));
  console.log(pass ? 'PASS — 0 added, 0 removed, all listingcard cells pass' : 'FAIL — see above');

  if (outPath) {
    writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log('WROTE', outPath);
  }

  process.exit(pass ? 0 : 1);
}

main();
