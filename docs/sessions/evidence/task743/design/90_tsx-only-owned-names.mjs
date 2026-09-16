// Task 743 design measurement: owned globals.css names referenced only from TS/TSX (no CSS consumer).
import { readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
const g = readFileSync('src/app/globals.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const names = new Set([...g.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]));
const files = [];
const globalsSuffix = ['src', 'app', 'globals.css'].join(sep);
(function w(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) w(p);
    else if (/\.(css|tsx|ts)$/.test(e.name) && !p.endsWith(globalsSuffix)) files.push(p);
  }
})('src');
const txt = Object.fromEntries(files.map((f) => [f, readFileSync(f, 'utf8')]));
const out = [];
for (const n of names) {
  const re = new RegExp('var\\(' + n.replace(/-/g, '\\-') + '\\s*\\)');
  let css = 0;
  const tsx = [];
  for (const f of files) {
    if (!re.test(txt[f])) continue;
    if (f.endsWith('.css')) css++;
    else tsx.push(f.split(sep).join('/'));
  }
  if (css === 0 && tsx.length) out.push(`${n} <- ${tsx.join(', ')}`);
}
console.log(`owned names parsed: ${names.size}; TSX-only referenced: ${out.length}`);
console.log(out.join('\n'));
