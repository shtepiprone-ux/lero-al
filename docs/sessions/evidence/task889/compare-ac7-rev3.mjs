// Task 889 revision 3 — AC7 re-check. Same normalisation as compare-ac7-rev2.mjs, plus a fix for a
// false positive the rev2 normaliser's digit-lookahead heuristic produced this run: Mantine's
// `useId()` per-mount random suffix (SegmentedControl's radio-group `name="mantine-<random>"` /
// `for="mantine-<random>-<value>"`) happened to land on an all-letters string
// ("mantine-kdxnuejap") with no digit, so `mantine-(?=[a-z0-9]*\d)[a-z0-9]{6,}` (which requires a
// digit to avoid clobbering static classes like `mantine-active`) missed it and reported a false
// DIFFERS. This version instead targets the exact two attribute contexts the random id appears in
// (`name="mantine-…"` / `for="mantine-…-…"`) rather than every lowercase-6+ class token, so it
// cannot over-match a static class name (those never appear inside `name=`/`for=`) while still
// catching the id regardless of whether it happens to contain a digit.
import { readFileSync } from 'node:fs';

function normalize(html) {
  return html
    .replace(/id="[^"]*"/g, 'id="ID"')
    .replace(/url\(#[^)]*\)/g, 'url(#ID)')
    .replace(/SvgjsSvg\d+/g, 'SvgjsSvg-ID')
    .replace(/name="mantine-[a-z0-9]+"/g, 'name="mantine-ID"')
    .replace(/for="mantine-[a-z0-9]+(-[a-zA-Z0-9]+)?"/g, 'for="mantine-ID"');
}

const pairs = [
  ['AdminDashboardView', 'before', 'after-rev3'],
  ['AgentStatisticsView', 'before', 'after-rev3'],
];

let allIdentical = true;
for (const [name, a, b] of pairs) {
  const htmlA = normalize(readFileSync(`docs/sessions/evidence/task889/ac7-before/${name}.${a}.html`, 'utf8'));
  const htmlB = normalize(readFileSync(`docs/sessions/evidence/task889/ac7-before/${name}.${b}.html`, 'utf8'));
  if (htmlA === htmlB) {
    console.log(`${name}: IDENTICAL (${a} vs ${b}, ${htmlA.length} chars)`);
  } else {
    allIdentical = false;
    console.log(`${name}: DIFFERS (${a} vs ${b})`);
    let i = 0;
    while (i < htmlA.length && i < htmlB.length && htmlA[i] === htmlB[i]) i++;
    console.log(`  first diff at char ${i}`);
    console.log(`  A: …${htmlA.slice(Math.max(0, i - 80), i + 120)}…`);
    console.log(`  B: …${htmlB.slice(Math.max(0, i - 80), i + 120)}…`);
  }
}
console.log(allIdentical ? 'ALL_IDENTICAL' : 'DIFFERENCES_FOUND');
