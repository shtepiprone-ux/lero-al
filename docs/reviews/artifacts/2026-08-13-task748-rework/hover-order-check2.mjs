import { readFileSync } from 'node:fs';
const css = readFileSync('.next/static/css/3b5759d2e996cb5d.css', 'utf8');
function pos(sel) {
  const idx = css.indexOf(sel);
  return { idx, snippet: idx >= 0 ? css.slice(idx, idx + 70) : '(not found)' };
}
const pairs = [
  ['.text-foreground{', '.text-overlay-foreground{'],
];
for (const [a, b] of pairs) {
  const pa = pos(a), pb = pos(b);
  console.log(a, pa.idx, pa.snippet);
  console.log(b, pb.idx, pb.snippet);
  console.log('b wins (later):', pb.idx > pa.idx);
  console.log('---');
}
