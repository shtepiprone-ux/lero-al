// Task 931 revision 3 self-audit (Opus, read-only Git, 2026-11-02): for a stale reviewed contract, find the commit that
// recorded its review digest and every digest file whose bytes differ between that commit and the working tree, with the
// commits that changed each. Usage: node <this file> <contract path> [...]
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { workflowRuleInputs } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const RUNTIME = ['package.json', 'package-lock.json', 'tsconfig.json', '.nvmrc', 'src/tests/setup.ts', 'src/tests/integration/setup.ts',
  ...readdirSync(ROOT).filter(f => /^(?:next|vitest(?:\.[a-z0-9_-]+)?)\.config\.[cm]?[jt]s$/.test(f))].filter(f => existsSync(resolve(ROOT, f)));
for (const path of process.argv.slice(2)) {
  const c = readJson(ROOT, path);
  const files = [...new Set([...c.scope, ...(c.inputs || []), ...workflowRuleInputs(ROOT, c.rules || []), ...c.cases.map(r => r.testFile), ...RUNTIME])];
  const at = git(['log', '-1', '--format=%h %ad %s', '--date=short', '-S', c.review.scopeSha256, '--', path]);
  const commit = at.split(' ')[0];
  console.log(`${path}\n  review digest recorded in: ${at}`);
  const changed = git(['diff', '--name-only', commit, '--', ...files]).split('\n').filter(Boolean);
  const untrackedOrNew = files.filter(f => existsSync(resolve(ROOT, f)) && !git(['ls-tree', '--name-only', commit, '--', f]));
  for (const f of [...new Set([...changed, ...untrackedOrNew])]) {
    const by = git(['log', '--format=%h %s', `${commit}..HEAD`, '--', f]).split('\n').filter(Boolean).map(l => l.slice(0, 90));
    const working = git(['status', '--short', '--', f]);
    console.log(`  changed: ${f}${working ? ` (working tree: ${working})` : ''}\n    ${by.join('\n    ') || '(no commit after the review; working tree only)'}`);
  }
}
