// Task 889 revision 4 — AC7-R4 comparator. Same normalisation as compare-ac7-rev3.mjs, comparing the
// retained `*.before.html` baseline against the freshly captured `*.after-rev4.html`.
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
  ['AdminDashboardView', 'before', 'after-rev4'],
  ['AgentStatisticsView', 'before', 'after-rev4'],
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
