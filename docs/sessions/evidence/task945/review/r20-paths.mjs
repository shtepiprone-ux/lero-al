// Task 945 review, self-audit. For the paths that steer agents or installs and that isPolicyPath leaves out: tracked, changed on this branch, which contracts hold them.
// A policy path changed on the branch with no governance contract holding it would turn CI's diff check red, so this decides what R19 may add. Run from the repository root.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 });
const base = git('merge-base', 'origin/main', 'HEAD').trim();
const changed = new Set(git('diff', '--name-only', '--no-renames', base, 'HEAD').trim().split('\n'));
const tracked = new Set(git('ls-files').trim().split('\n'));
const contracts = [];
for (const dir of ['tasks/Sprints', 'tasks/Archive']) {
  for (const name of readdirSync(dir).filter(file => file.endsWith('.security.json'))) {
    try {
      const value = JSON.parse(readFileSync(join(dir, name), 'utf8'));
      contracts.push({ name: `${name.match(/Task_(\d+)/)?.[1] ?? name}`, kind: value.kind, stage: value.stage, scope: value.scope ?? [] });
    } catch { /* an unreadable contract holds nothing */ }
  }
}
for (const file of ['AGENTS.md', 'CLAUDE.md', '.codex/RULES.md', 'docs/orchestrator-procedures.md', 'docs/governance-enforcement.md', '.npmrc', '.github/CODEOWNERS']) {
  const holders = contracts.filter(item => item.scope.includes(file)).map(item => `${item.name}:${item.kind ?? 'product'}:${item.stage}`);
  console.log(`${file}: tracked ${tracked.has(file)}, changed on branch ${changed.has(file)}, held by [${holders.join(' ')}]`);
}
