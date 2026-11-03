// Task 944 design probe p02 (Opus task designer): hook-module closure from .claude/settings.json and .claude/hooks/*.ps1,
// then an ESM syntax check of a proposed Edit result through `node --check --input-type=module -`. Writes nothing.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const slash = text => text.split(String.fromCharCode(92)).join('/');
const rel = p => slash(relative(root, p));
const settings = JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8'));
const words = Object.values(settings.hooks || {}).flat().flatMap(m => m.hooks || []).flatMap(h => [h.command || '', ...(h.args || [])]);
const entries = new Set();
for (const w of words) for (const m of w.matchAll(/\$\{CLAUDE_PROJECT_DIR\}[\\/]([^\s"']+\.m?js)/g)) entries.add(slash(m[1]));
for (const f of readdirSync(join(root, '.claude/hooks')).filter(f => f.endsWith('.ps1')))
  for (const m of readFileSync(join(root, '.claude/hooks', f), 'utf8').matchAll(/scripts[\\/][A-Za-z0-9_.\\/-]+\.m?js/g)) entries.add(slash(m[0]));
const closure = new Set(); const queue = [...entries];
while (queue.length) {
  const file = queue.shift(); if (closure.has(file) || !existsSync(join(root, file))) continue; closure.add(file);
  const text = readFileSync(join(root, file), 'utf8');
  for (const m of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"](\.{1,2}\/[^'"]+)['"]/g)) queue.push(rel(resolve(dirname(join(root, file)), m[1])));
}
console.log('entries:', [...entries].sort().join(', '));
console.log('closure:', [...closure].sort().join(', '));
const check = text => spawnSync(process.execPath, ['--check', '--input-type=module', '-'], { input: text, encoding: 'utf8' });
const live = readFileSync(join(root, 'scripts/workflow-gates/contract.mjs'), 'utf8');
const find = 'if (source !== null) check(source.includes(`[${row.id}]`), ';
const r1 = check(live);
console.log('live contract.mjs: exit', r1.status);
const r2 = check(live.replace(find, 'if (false && source !== null) check(source.includes(`[${row.id}]`), // SENSITIVITY BREAK '));
console.log('incident Edit result: exit', r2.status, '|', (r2.stderr.match(/SyntaxError[^\n]*/) || [''])[0], '| line', (r2.stderr.match(/\[stdin\]:(\d+)/) || [, ''])[1]);
const r3 = check(live.replace(find, 'if (/* SENSITIVITY BREAK */ false && source !== null) check(source.includes(`[${row.id}]`), '));
console.log('block-comment semantic Edit result: exit', r3.status);
const t0 = Date.now(); for (let i = 0; i < 5; i++) check(live); console.log('mean check ms:', Math.round((Date.now() - t0) / 5));
