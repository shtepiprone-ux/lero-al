// Owner question after Task 945 review 1: does a dependency update reach main, and do the critical advisories apply to this configuration. Read-only: digests in memory,
// the advisory database through the read-only gh api, sources through git and the file system. Run from the repository root.
import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve('.');
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28 }).trim();
const { scopeDigest } = await import(`file:///${ROOT.replaceAll('\\', '/')}/scripts/workflow-gates/contract.mjs`);
console.log(`HEAD ${git('rev-parse', '--short', 'HEAD')}, origin/main ${git('rev-parse', '--short', 'origin/main')}, next on origin/main ${JSON.parse(git('show', 'origin/main:package.json')).dependencies.next}, ahead ${git('rev-list', '--count', 'origin/main..HEAD')}`);
const contractSource = readFileSync('scripts/workflow-gates/contract.mjs', 'utf8');
console.log('scopeDigest signature:', contractSource.split('\n').find(l => /export (?:const|function) scopeDigest/.test(l))?.trim().slice(0, 160));
console.log('=== the digest of each reviewed contract if the lock file changes by one byte, in memory');
const overrides = new Map([['package-lock.json', `${readFileSync('package-lock.json', 'utf8')}\n`]]);
let total = 0, changed = 0;
for (const folder of ['tasks/Archive', 'tasks/Sprints']) for (const name of readdirSync(join(ROOT, folder)).filter(f => f.endsWith('.security.json'))) {
  let contract; try { contract = JSON.parse(readFileSync(join(ROOT, folder, name), 'utf8')); } catch { continue; }
  if (contract.stage !== 'reviewed' || !contract.review) continue;
  total += 1;
  let now, then; try { now = scopeDigest(ROOT, contract); then = scopeDigest(ROOT, contract, overrides); } catch (error) { console.log(`${name}: ERROR ${error.message.slice(0, 120)}`); continue; }
  if (now !== then) changed += 1;
  console.log(`${/Task_(\d+)[^.]*/.exec(name)?.[0].slice(0, 40)} [${contract.kind ?? 'legacy'}]: digest changes ${now !== then}`);
}
console.log(`reviewed ${total}; digest changes ${changed}`);
const lines = contractSource.split('\n');
for (const n of [66, 167, 193]) console.log(`contract.mjs:${n}: ${lines[n - 1].trim().slice(0, 150)}`);
console.log('=== the advisories');
for (const id of ['GHSA-2464-fhr4-w9xw', 'GHSA-2xp9-vwfh-vxw4', 'GHSA-p293-qw3h-jr36']) {
  const r = spawnSync('gh', ['api', `/advisories/${id}`, '--jq', '{summary,severity,description}'], { encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  console.log(`--- ${id}: ${(r.stdout || r.stderr).replace(/\\r\\n|\\n/g, ' ').slice(0, 1500)}`);
}
const sentry = spawnSync('npm audit --omit=dev --json', { shell: true, encoding: 'utf8', maxBuffer: 1 << 28 });
const via = JSON.parse(sentry.stdout).vulnerabilities['@sentry/nextjs']?.via?.filter(v => typeof v === 'object') ?? [];
for (const v of via) if (v.severity === 'critical') { const id = v.url.split('/').pop(); const r = spawnSync('gh', ['api', `/advisories/${id}`, '--jq', '{summary,description}'], { encoding: 'utf8', shell: true }); console.log(`--- ${id}: ${(r.stdout || r.stderr).replace(/\\r\\n|\\n/g, ' ').slice(0, 1200)}`); }
console.log('=== this configuration');
for (const file of ['next.config.ts', 'next.config.mjs', 'next.config.js']) if (existsSync(file)) readFileSync(file, 'utf8').split('\n').forEach((l, i) => { if (/tunnelRoute|images\b|dangerouslyAllowSVG|formats|remotePatterns|unoptimized|withSentryConfig/.test(l)) console.log(`${file}:${i + 1}: ${l.trim().slice(0, 130)}`); });
const grep = (...a) => spawnSync('git', ['grep', '-n', ...a], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout.trim();
console.log('next/image importers', grep('-l', "from 'next/image'", '--', 'src').split('\n').filter(Boolean).length);
console.log('sentry tunnel in source', grep('-E', 'tunnel(Route)?\\s*[:=]', '--', 'src', 'sentry.*', 'instrumentation*').slice(0, 300) || 'none');
console.log('=== who deploys from where');
const vercel = existsSync('vercel.json') ? JSON.parse(readFileSync('vercel.json', 'utf8')) : null;
console.log('vercel.json keys', vercel ? Object.keys(vercel).join(',') : 'absent');
