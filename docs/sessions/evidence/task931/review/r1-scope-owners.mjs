// Task 931 review (read-only): which contracts scope a file this task changes, and whether that file is a case test there.
import { readFileSync, readdirSync } from 'node:fs';
const changed = process.argv.slice(2);
for (const dir of ['tasks/Sprints', 'tasks/Archive']) for (const name of readdirSync(dir)) {
  if (!name.endsWith('.security.json')) continue;
  const path = `${dir}/${name}`;
  let c; try { c = JSON.parse(readFileSync(path, 'utf8')); } catch { continue; }
  const scope = Array.isArray(c.scope) ? c.scope : [];
  const tests = new Set((c.cases || []).map(row => row?.testFile));
  const hits = changed.filter(f => scope.includes(f));
  if (!hits.length) continue;
  console.log(`${path} stage=${c.stage} kind=${c.kind}`);
  for (const f of hits) console.log(`  ${f}${tests.has(f) ? '  [CASE TEST]' : ''}`);
}
