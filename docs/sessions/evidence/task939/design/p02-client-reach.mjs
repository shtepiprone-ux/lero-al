// Task 939 design probe: which Story files statically reach the browser Supabase client
// (`src/lib/supabase/client.ts`) through their import graph, and through which importer.
// Resolves `@/` (tsconfig paths), relative specifiers, extensions and index files; dynamic
// `import()` specifiers that are plain strings are followed too. Usage: node p02-client-reach.mjs <repo root>
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const target = path.join(root, 'src/lib/supabase/client.ts');
const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
function resolveSpec(from, spec) {
  let base;
  if (spec.startsWith('@/')) base = path.join(root, 'src', spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const c of [base, ...exts.map(e => base + e), ...exts.map(e => path.join(base, 'index' + e))]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}
const re = /(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g;
const edges = new Map();
function deps(file) {
  if (edges.has(file)) return edges.get(file);
  const src = fs.readFileSync(file, 'utf8');
  const out = [];
  for (const m of src.matchAll(re)) { const r = resolveSpec(file, m[1] || m[2] || m[3]); if (r) out.push(r); }
  edges.set(file, out);
  return out;
}
function walkStories(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walkStories(p, acc); }
    else if (/\.stories\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const rel = f => path.relative(root, f).replace(/\\/g, '/');
const stories = walkStories(path.join(root, 'src'));
let reaching = 0;
for (const s of stories.sort()) {
  // BFS keeping the parent so the first path to the client can be printed
  const parent = new Map([[s, null]]);
  const queue = [s];
  let hit = null;
  while (queue.length && !hit) {
    const f = queue.shift();
    for (const d of deps(f)) {
      if (parent.has(d)) continue;
      parent.set(d, f);
      if (d === target) { hit = d; break; }
      queue.push(d);
    }
  }
  if (!hit) continue;
  reaching += 1;
  const chain = [];
  for (let f = hit; f; f = parent.get(f)) chain.unshift(rel(f));
  console.log(`${rel(s)}\n    via ${chain.slice(1).join(' -> ')}`);
}
console.log(`\n${reaching} of ${stories.length} Story files reach src/lib/supabase/client.ts`);
