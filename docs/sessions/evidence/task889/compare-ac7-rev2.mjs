// Task 889 revision 2 — AC7 re-check. Normalises every per-mount random id (any `id="..."` value,
// any `url(#...)` clip-path reference, and ApexCharts' `SvgjsSvg<n>` marker) to a fixed placeholder,
// then compares the untouched pre-Task-889 baseline against the freshly captured rev2 render.
import { readFileSync } from 'node:fs';

function normalize(html) {
  return html
    .replace(/id="[^"]*"/g, 'id="ID"')
    .replace(/url\(#[^)]*\)/g, 'url(#ID)')
    .replace(/SvgjsSvg\d+/g, 'SvgjsSvg-ID')
    // Mantine `useId()` per-mount random suffix, e.g. a SegmentedControl's radio-group
    // `name="mantine-<random>"` / `for="mantine-<random>-<value>"` — fresh every render, not code.
    // Requires at least one digit so real static classes like `mantine-active` are untouched.
    .replace(/mantine-(?=[a-z0-9]*\d)[a-z0-9]{6,}/g, 'mantine-ID');
}

const pairs = [
  ['AdminDashboardView', 'before', 'after-rev2'],
  ['AgentStatisticsView', 'before', 'after-rev2'],
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
    // Print first diverging index and a window around it.
    let i = 0;
    while (i < htmlA.length && i < htmlB.length && htmlA[i] === htmlB[i]) i++;
    console.log(`  first diff at char ${i}`);
    console.log(`  A: …${htmlA.slice(Math.max(0, i - 80), i + 120)}…`);
    console.log(`  B: …${htmlB.slice(Math.max(0, i - 80), i + 120)}…`);
  }
}
console.log(allIdentical ? 'ALL_IDENTICAL' : 'DIFFERENCES_FOUND');
