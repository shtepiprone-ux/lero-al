// Task 945 review, read-only: the refuse rules of code-check.json over every tracked text file and over the added lines of the branch. Prints file, line and
// rule only, never the matched text, and how long the whole-diff form takes, which is the measure of the correction this review proposes.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const registry = JSON.parse(readFileSync('scripts/workflow-gates/code-check.json', 'utf8'));
const rules = registry.secure.filter(rule => rule.refuse).map(rule => ({ name: rule.name || rule.what || rule.text, re: new RegExp(rule.pattern, rule.flags || '') }));
console.log('refuse rules:', rules.map(r => r.name).join(' | '));
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 1 << 28 }).split('\0').filter(Boolean);
let begun = Date.now(), scanned = 0;
const byRule = {}, hits = [];
for (const file of files) {
  let bytes;
  try { bytes = readFileSync(file); } catch { continue; }
  if (bytes.length > 8 << 20 || bytes.subarray(0, 8000).includes(0)) continue;
  scanned++;
  const lines = bytes.toString('utf8').split('\n');
  lines.forEach((line, index) => {
    for (const rule of rules) if (rule.re.test(line)) { byRule[rule.name] = (byRule[rule.name] || 0) + 1; hits.push(`${file}:${index + 1} [${rule.name}] len ${line.length}`); }
  });
}
console.log(`tree: ${scanned} text files of ${files.length}, ${Date.now() - begun} ms, hits ${hits.length}`, JSON.stringify(byRule));
const groups = {};
for (const hit of hits) { const key = hit.split('/').slice(0, 2).join('/').split(':')[0]; groups[key] = (groups[key] || 0) + 1; }
console.log(Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${v} ${k}`).join('\n'));
console.log(hits.filter(h => !/selftest|sessions\/evidence|tasks\//.test(h)).slice(0, 25).join('\n'));

begun = Date.now();
const diff = execFileSync('git', ['diff', '--unified=0', '--no-color', '--no-ext-diff', 'origin/main...0c1e09eb1'], { encoding: 'utf8', maxBuffer: 1 << 30 }).split('\n');
let file = '', added = 0; const diffHits = [];
for (const line of diff) {
  if (line.startsWith('+++ ')) { file = line.slice(6); continue; }
  if (!line.startsWith('+')) continue;
  added++;
  for (const rule of rules) if (rule.re.test(line)) diffHits.push(`${file} [${rule.name}]`);
}
const counts = {}; for (const hit of diffHits) counts[hit] = (counts[hit] || 0) + 1;
console.log(`branch diff: ${added} added lines, ${Date.now() - begun} ms, hits ${diffHits.length}`);
console.log(Object.entries(counts).map(([k, v]) => `${v} ${k}`).slice(0, 30).join('\n'));
