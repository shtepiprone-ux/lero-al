// Task 937 design probe: the three design-token findings of PR #12 (CI run 41300859846), scanned in memory with the
// gate's own scanContent before and after the planned edits; plus the gallery edit of the enrolled-tailwind finding,
// to prove that moving `overflow-clip` into a style object adds no design-token finding. Nothing is written; the
// edits exist only as strings.
// Usage (repo root): node docs/sessions/evidence/task937/design/p02-design-token-fix-probe.mjs
import { readFileSync } from 'node:fs';
import { scanContent, extractCssCustomPropertyDefinitions } from '../../../../../scripts/check-design-tokens.mjs';

const allowlist = JSON.parse(readFileSync('scripts/design-tokens-allowlist.json', 'utf8'));
const globals = extractCssCustomPropertyDefinitions(readFileSync('src/app/globals.css', 'utf8'));
const EM = '—';
const edits = [
  {
    file: 'src/components/shared/Map.module.css',
    // The marker separator must be the em dash parseInlineMarkers splits on (scripts/check-design-tokens.mjs:1045).
    from: "design-tokens-allow: line-height: 30px - restores Leaflet's stylesheet value from 640px up",
    to: `design-tokens-allow: line-height: 30px ${EM} restores Leaflet's stylesheet value from 640px up`,
  },
  {
    file: 'src/design-system/mantine/input-chrome.css',
    // inset-block: -1px is not a detected value, so any marker for it is stale; the comment keeps the reason without the marker.
    from: ' /* design-tokens-allow: inset-block: -1px - the 1px border of the field */',
    to: ' /* the 1px border of the field */',
  },
  {
    file: 'src/modules/cabinet/components/CabinetEmailChangeSectionView.tsx',
    // theme.other.iconSize.roomy is 20 (theme.ts), the static-import form of ListingStatusBanner.tsx:28.
    from: "<Info size={20} />",
    to: '<Info size={theme.other!.iconSize!.roomy} />',
    addImport: "import { theme } from '@/design-system/mantine/theme'\n",
    after: "import { MantineDetailList } from '@/design-system/mantine/patterns/MantineDetailList'\n",
  },
  {
    file: 'src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx',
    // Same computed overflow (clip, not a scroll container: Task 923 R33), without the Tailwind utility.
    from: 'className="h-full w-full overflow-clip">',
    to: "className=\"h-full w-full\" style={{ overflow: 'clip' }}>",
  },
];
const show = list => list.length ? list.map(f => `      :${f.line} [${f.cat}: ${f.label}] ${JSON.stringify(f.match)}`).join('\n') : '      (none)';
let ok = true;
for (const e of edits) {
  const before = readFileSync(e.file, 'utf8');
  if (!before.includes(e.from)) { console.log(`FAIL ${e.file}: planned source text not found`); ok = false; continue; }
  let after = before.replace(e.from, e.to);
  if (e.addImport) after = after.replace(e.after, e.after + e.addImport);
  const a = scanContent(before, e.file, allowlist, globals);
  const b = scanContent(after, e.file, allowlist, globals);
  console.log(`${b.length === 0 ? 'PASS' : 'FAIL'} ${e.file}: ${a.length} finding(s) before, ${b.length} after`);
  console.log(`   before:\n${show(a)}\n   after:\n${show(b)}`);
  ok = ok && b.length === 0;
}
console.log(ok ? 'DESIGN-TOKEN FIX PROBE PASSED' : 'DESIGN-TOKEN FIX PROBE FAILED');
