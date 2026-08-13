import { readFileSync } from 'node:fs';
const css = readFileSync('.next/static/css/3b5759d2e996cb5d.css', 'utf8');
const needle = '.hover\\:bg-overlay\\/70:hover';
let idx = -1;
const positions = [];
while ((idx = css.indexOf(needle, idx + 1)) !== -1) positions.push(idx);
console.log('occurrences at', positions);
for (const p of positions) {
  console.log('---');
  console.log(css.slice(Math.max(0, p - 250), p + 250));
}
