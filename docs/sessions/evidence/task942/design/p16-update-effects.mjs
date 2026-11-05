// Task 942 and Task 931, decision D30: what the dependency update and the gate change touch. Read-only: digests in memory, a temporary folder for the manifests.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const ROOT = resolve('.');
const { scopeDigest } = await import(pathToFileURL(resolve('scripts/workflow-gates/contract.mjs')).href);
const { advisoriesOf } = await import(pathToFileURL(resolve('scripts/workflow-gates/dependency-check.mjs')).href);
const sh = (c, cwd) => { const r = spawnSync(c, { cwd, shell: true, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 280000 }); return { status: r.status, out: r.stdout ?? '', err: r.stderr ?? '' }; };
console.log('=== which reviewed contracts the files of revision 7 stale, each file alone, in memory');
const files = ['scripts/workflow-gates/contract.mjs', 'scripts/workflow-gates/cli.mjs', 'scripts/workflow-gates/check-workflow.mjs', 'scripts/workflow-gates/security-hook.mjs', '.claude/settings.json', '.claude/rules/review/04-contract-rebases.md', '.claude/rules/shared/workflow-contract.md'];
for (const dir of ['tasks/Archive', 'tasks/Sprints']) for (const name of readdirSync(dir).filter(f => f.endsWith('.security.json'))) {
  const contract = JSON.parse(readFileSync(join(dir, name), 'utf8'));
  if (contract.stage !== 'reviewed') continue;
  const now = scopeDigest(ROOT, contract);
  const hit = files.filter(file => scopeDigest(ROOT, contract, new Map([[file, `${readFileSync(file, 'utf8')}\n`]])) !== now);
  console.log(`${/Task_\d+[^.]{0,20}/.exec(name)[0]} [${contract.kind}]: ${hit.map(f => f.split('/').pop()).join(', ') || 'none'}`);
}
console.log('=== the report that reruns each reviewed product contract');
for (const f of ['docs/sessions/evidence/task923/security', 'docs/sessions/evidence/task927/security', 'docs/sessions/evidence/task931/security']) console.log(f, existsSync(f) ? readdirSync(f).filter(x => /report/.test(x)).join(' ') : 'absent');
for (const dir of ['tasks/Archive', 'tasks/Sprints']) for (const name of readdirSync(dir).filter(f => f.endsWith('.security.json'))) { const c = JSON.parse(readFileSync(join(dir, name), 'utf8')); if (c.stage === 'reviewed' && c.kind === 'product') console.log(`${/Task_\d+[^.]{0,28}/.exec(name)[0]}: report ${c.report}`); }
console.log('=== after the update: serious advisories against the baseline of Task 945');
const dir = mkdtempSync(join(tmpdir(), 'update-effects-'));
for (const file of ['package.json', 'package-lock.json', '.npmrc']) copyFileSync(file, join(dir, file));
for (const c of ['npm install --package-lock-only --ignore-scripts --no-audit --no-fund --save-exact next@15.5.28 eslint-config-next@15.5.28', 'npm install --package-lock-only --ignore-scripts --no-audit --no-fund @sentry/nextjs@10.78.0']) console.log(`${c}: exit ${sh(c, dir).status}`);
const after = advisoriesOf(JSON.parse(sh('npm audit --json', dir).out));
const baseline = new Set(JSON.parse(readFileSync('scripts/workflow-gates/audit-baseline.json', 'utf8')).advisories.map(entry => entry.id));
console.log(`baseline ${baseline.size}; after the update ${after.length}; new, which the check refuses: ${after.filter(a => !baseline.has(a.id)).length}; closed: ${[...baseline].filter(id => !after.some(a => a.id === id)).length}`);
for (const a of after.filter(entry => !baseline.has(entry.id))) console.log(`  NEW ${a.severity} ${a.name} ${a.id}: ${a.title.slice(0, 90)}`);
const lockAfter = JSON.parse(readFileSync(join(dir, 'package-lock.json'), 'utf8')).packages, lockBefore = JSON.parse(readFileSync('package-lock.json', 'utf8')).packages;
const fresh = Object.keys(lockAfter).filter(k => k && !lockBefore[k]);
const out = fresh.filter(k => lockAfter[k].resolved && !lockAfter[k].resolved.startsWith('https://registry.npmjs.org/'));
console.log(`lock entries added ${fresh.length}; from another registry ${out.length}; with no integrity ${fresh.filter(k => lockAfter[k].resolved && !lockAfter[k].integrity).length}`);
rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
console.log('=== how the code reads the removed packages');
const removed = ['@sentry/browser', '@sentry/core', '@fastify/otel', '@prisma/instrumentation', '@opentelemetry/instrumentation-http'];
for (const name of removed) console.log(`${name}: imported in src: ${(spawnSync('git', ['grep', '-l', `from '${name}`, '--', 'src', 'sentry.*', 'instrumentation*', 'next.config.ts'], { encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean).length)}`);
const sentryUse = spawnSync('git', ['grep', '-n', "from '@sentry/nextjs'", '--', 'src', 'sentry.*', 'instrumentation*', 'next.config.ts'], { encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean);
console.log(`files importing @sentry/nextjs: ${sentryUse.length}\n${sentryUse.slice(0, 8).map(l => l.slice(0, 110)).join('\n')}`);
