// Task 945 review, self-audit. Two read-only measures: which paths that steer agents the write hook leaves to Sonnet, and which contracts hold the census runner or mapper.
// Run from the repository root.
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('.');
const T = 'scripts/workflow-gates';
const { evaluateHook } = await import(pathToFileURL(join(ROOT, T, 'security-hook.mjs')).href);
const { isPolicyPath, isProductPath } = await import(pathToFileURL(join(ROOT, T, 'contract.mjs')).href);
console.log('=== a Sonnet Edit, with no contract naming the path');
for (const file of ['AGENTS.md', 'CLAUDE.md', '.codex/RULES.md', 'docs/orchestrator-procedures.md', 'docs/governance-enforcement.md', '.npmrc', '.github/CODEOWNERS', '.claude/rules/shared/secure-code-review.md', 'scripts/workflow-gates/code-check.json', 'scripts/check-surface-census-changed.mjs', 'scripts/map-changed-surfaces.mjs']) {
  const refused = evaluateHook(ROOT, { hook_event_name: 'PreToolUse', tool_name: 'Edit', model: 'sonnet', tool_input: { file_path: file, old_string: 'a', new_string: 'b' } }, '');
  const first = refused.length ? `${refused[0]}`.split('\n')[0].slice(0, 70) : 'ALLOWED';
  console.log(`${file}: policy ${isPolicyPath(file)}, product ${isProductPath(file)} => ${first}`);
}
console.log('=== contracts whose scope holds the census runner or the mapper');
let hits = 0;
for (const dir of ['tasks/Sprints', 'tasks/Archive']) {
  for (const name of readdirSync(dir).filter(file => file.endsWith('.security.json'))) {
    let contract;
    try { contract = JSON.parse(readFileSync(join(dir, name), 'utf8')); } catch { continue; }
    if ((contract.scope ?? []).some(file => /check-surface-census-changed|map-changed-surfaces/.test(file))) { hits += 1; console.log(`${dir}/${name}: ${contract.kind} ${contract.stage}`); }
  }
}
console.log(`contracts holding them: ${hits}`);
