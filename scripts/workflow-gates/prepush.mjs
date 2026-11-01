#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, createWriteStream } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import { setTimeout, clearTimeout } from 'node:timers';
import { hash, git, snapshot, verifyReport, REPORT } from './push-safety.mjs';
import { validateWorkflow } from './check-workflow.mjs';
import { integrationTargetErrors, unitEnvironment } from './cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const read = (root, file) => JSON.parse(readFileSync(join(root, file), 'utf8'));
const install = 'npx playwright install chromium --with-deps';
const phaseTest = '& .\\.claude\\hooks\\phase-write-gate.ps1 -VerifyGate\nif ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }';
const serviceStart = 'nohup npm start > server.log 2>&1 &';
const serviceWait = 'for i in $(seq 1 30); do\n  if curl -sf -o /dev/null http://127.0.0.1:3000/; then exit 0; fi\n  sleep 2\ndone\ncat server.log\nexit 1';
const targetCheck = 'for name in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do\n  if [ -z "${!name}" ]; then echo "::error::Missing protected security-ci secret: $name"; exit 1; fi\ndone\nnode scripts/workflow-gates/cli.mjs target';

function command(step, shard) {
  const text = step.run.replaceAll('${{ matrix.shard }}', String(shard));
  if (text === phaseTest) return ['powershell.exe', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', '.claude/hooks/phase-write-gate.ps1', '-VerifyGate'];
  if (text === serviceStart) return ['service', 'start'];
  if (text === serviceWait) return ['service', 'wait'];
  if (text === targetCheck) return ['target'];
  if (text === install) return ['playwright', 'install'];
  // The existing workflow's direct Node/npm commands need no shell. New shell syntax must get an inspected adapter.
  if (!/^(?:node|npm) [\w./:@= -]+$/.test(text)) throw new Error(`Unsupported CI command; no check was waived: ${step.name}`);
  return text.split(' ');
}

export function localPlan(workflow, policy) {
  const errors = validateWorkflow(workflow, policy);
  if (errors.length) throw new Error(errors.join('; '));
  const rows = [], emitted = new Set();
  const visit = id => {
    if (emitted.has(id)) return;
    emitted.add(id);
    const job = workflow.jobs[id];
    for (const need of job.needs || []) {
      if (!policy.requiredJobs.includes(need)) throw new Error(`Unregistered dependency: ${need}`);
      visit(need);
    }
    if (job.env) throw new Error(`Unsupported job environment: ${id}`);
    const shards = job.strategy?.matrix?.shard || [null];
    if (job.strategy && id !== 'locale-leak') throw new Error(`Unsupported matrix: ${id}`);
    for (const shard of shards) {
      const steps = job.steps.filter(step => step.run && step.run !== 'npm ci');
      rows.push({ id: shard === null ? id : `${id}/${shard}`, job: id,
        commands: steps.map(step => command(step, shard)), steps, needs: job.needs || [],
        timeoutMs: job['timeout-minutes'] * 60000 });
    }
  };
  for (const id of policy.requiredJobs) visit(id);
  return rows;
}

function executable(root, args) {
  if (args[0] === 'node') return [process.execPath, ...args.slice(1)];
  if (args[0] === 'powershell.exe') return args;
  if (args[0] === 'playwright') return [process.execPath, join(root, 'node_modules/playwright/cli.js'), 'install', 'chromium'];
  if (args[0] !== 'npm') throw new Error('Unknown gate executable');
  const npm = [process.env.npm_execpath, join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'),
    join(dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js')].find(p => p && existsSync(p));
  if (!npm) throw new Error('Installed npm CLI unavailable');
  return [process.execPath, npm, ...args.slice(1)];
}

function stop(child) {
  if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === 'win32') {
    try { execFileSync('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', timeout: 10000 }); } catch { child.kill(); }
  } else child.kill('SIGKILL');
}

export async function runCommand(root, args, env, logName, timeoutMs) {
  const path = `test-results/workflow-gates/prepush/${logName}.log`;
  const log = createWriteStream(join(root, path));
  const [exe, ...argv] = executable(root, args);
  return new Promise(done => {
    const child = spawn(exe, argv, { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let error;
    const timer = setTimeout(() => { error = 'Command timed out'; stop(child); }, timeoutMs);
    child.stdout.on('data', data => { log.write(data); process.stdout.write(data); });
    child.stderr.on('data', data => { log.write(data); process.stderr.write(data); });
    child.on('error', e => { error = e.message; });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      log.end(() => done({ code, signal, ...(error ? { error } : {}), log: path, logSha256: hash(readFileSync(join(root, path))) }));
    });
  });
}

function stepEnvironment(step, binding, source) {
  // Allow OS plumbing only. No inherited NODE_OPTIONS, test flags, GitHub tokens, or production credentials.
  const env = unitEnvironment(source);
  delete env.NODE_ENV;
  Object.assign(env, { CI: '1', GITHUB_EVENT_NAME: 'push', GATES_BASE_SHA: binding.base, GATES_HEAD_SHA: binding.head,
    REVIEW_LEDGER_BASE_SHA: binding.base });
  for (const prefix of ['SURFACE_CENSUS', 'UI_CONTRACT', 'MOBILE_ADAPTATION', 'KICKOFF_EVIDENCE']) {
    env[`${prefix}_BASE_SHA`] = binding.base; env[`${prefix}_HEAD_SHA`] = binding.head;
  }
  for (const [key, value] of Object.entries(step.env || {})) {
    const secret = value.match(/^\$\{\{ secrets\.(SECURITY_CI_\w+) \}\}$/);
    const variable = value.match(/^\$\{\{ vars\.(SECURITY_TEST_\w+) \}\}$/);
    if (secret || variable) {
      const name = (secret || variable)[1];
      if (source[name]) env[key] = source[name];
    } else if (!value.includes('${{')) env[key] = value;
    else throw new Error(`Unresolved CI environment expression: ${key}`);
  }
  return env;
}

export function preflightErrors(root, binding, policy) {
  const errors = [];
  if (binding.dirty) errors.push('Commit the selected candidate first; tracked changes and nonignored untracked files prevent exact-commit validation');
  if (binding.head === binding.base) errors.push('No unpublished commit exists; an already-pushed failed commit cannot receive a retroactive pre-push PASS');
  if (process.versions.node !== policy.ciNodeVersion) errors.push(`Use the CI Node runtime ${policy.ciNodeVersion}`);
  if (process.platform !== 'win32') errors.push('The required native PowerShell 5.1 job must run on Windows');
  // Check filenames only. Never open local secret files; Next automatically loads them and would change CI inputs.
  if (readdirSync(root).some(file => /^\.env(?:\.(?:local|production|production\.local|test|test\.local))?$/.test(file))) errors.push('Local auto-loaded env files prevent CI-equivalent execution in the single project folder; they were not read');
  return errors;
}

async function freePort() {
  const server = createServer();
  await new Promise((done, reject) => { server.once('error', reject); server.listen(3000, '127.0.0.1', done); });
  await new Promise(done => server.close(done));
}

async function executePlan(root, plan, binding, save, source) {
  const jobs = [];
  for (const row of plan) {
    const record = { id: row.id, commands: row.commands, status: 'running', results: [] };
    jobs.push(record); save(jobs);
    if (row.needs.some(need => jobs.filter(j => j.id === need || j.id.startsWith(`${need}/`)).some(j => j.status !== 'passed'))) {
      record.status = 'blocked'; save(jobs); continue;
    }
    const deadline = Date.now() + row.timeoutMs;
    let server = null, serverLog = null;
    try {
      for (const [index, args] of row.commands.entries()) {
        const env = stepEnvironment(row.steps[index], binding, source);
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw new Error('Required job exceeded its CI timeout');
        console.log(`\n[prepush ${row.id}] ${args.join(' ')}`);
        if (args[0] === 'target') {
          const errors = integrationTargetErrors(env);
          for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) if (!env[name]) errors.push(`Missing approved CI configuration: ${name}`);
          if (errors.length) throw new Error(errors.join('; '));
        }
        if (args[0] === 'service') {
          if (args[1] === 'start') {
            await freePort();
            const serviceStep = row.steps[index];
            const [exe, ...argv] = executable(root, ['npm', 'start']);
            serverLog = createWriteStream(join(root, 'test-results/workflow-gates/prepush/server.log'));
            server = spawn(exe, argv, { cwd: root, env: stepEnvironment(serviceStep, binding, source), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
            server.on('error', () => {});
            server.stdout.pipe(serverLog, { end: false }); server.stderr.pipe(serverLog, { end: false });
          } else {
            let ready = false;
            for (let attempt = 0; attempt < 30; attempt++) {
              if (!server?.pid || server.exitCode !== null) throw new Error('The gate-owned server failed to start');
              try { const response = await globalThis.fetch('http://127.0.0.1:3000/', { signal: globalThis.AbortSignal.timeout(1500) }); ready = response.ok; } catch { /* wait within the CI startup budget */ }
              if (ready) break;
              await new Promise(done => setTimeout(done, 2000));
            }
            if (!ready) throw new Error('The gate-owned server did not become ready');
          }
        }
        const logName = `${row.id.replaceAll('/', '-')}-${index + 1}`;
        let result;
        if (['target', 'service'].includes(args[0])) {
          const log = `test-results/workflow-gates/prepush/${logName}.log`;
          const observation = args[0] === 'target' ? 'Approved development identity and required configuration are present.'
            : args[1] === 'start' ? `Started gate-owned server PID ${server.pid}.` : 'Gate-owned server is alive; HTTP readiness returned success.';
          writeFileSync(join(root, log), observation + '\n');
          result = { code: 0, signal: null, adapter: args.join(' '), log, logSha256: hash(readFileSync(join(root, log))) };
        } else result = await runCommand(root, args, env, logName, remaining);
        record.results.push(result); save(jobs);
        if (result.code !== 0 || result.signal || result.error) break;
        if (git(root, ['rev-parse', 'HEAD']) !== binding.head || git(root, ['status', '--porcelain=v1', '--untracked-files=all'])) throw new Error('Candidate changed during validation');
      }
      record.status = record.results.length === row.commands.length && record.results.every(r => r.code === 0 && !r.signal && !r.error) ? 'passed' : 'failed';
    } catch (error) { record.status = 'failed'; record.error = error.message; console.error(`BLOCKED: ${error.message}`); }
    finally { stop(server); serverLog?.end(); }
    save(jobs);
  }
  return jobs;
}

export async function main(root = ROOT) {
  if (process.argv[2] === '--verify') {
    const errors = await verifyReport(root);
    if (errors.length) throw new Error(errors.join('; '));
    console.log('Current committed HEAD has fresh complete local pre-push evidence.'); return;
  }
  if (process.argv.length > 2) throw new Error('Use prepush.mjs or prepush.mjs --verify; individual checks cannot be skipped');
  const dir = join(root, 'test-results/workflow-gates/prepush'); mkdirSync(dir, { recursive: true });
  const report = { version: 1, kind: 'local-prepush', status: 'failed', startedAt: new Date().toISOString(), jobs: [] };
  const save = jobs => { report.jobs = jobs; writeFileSync(join(root, REPORT), JSON.stringify(report, null, 2) + '\n'); };
  save([]); // Invalidate any earlier green report before attempting this run.
  try {
    const binding = snapshot(root); Object.assign(report, binding); save([]);
    const policy = read(root, 'scripts/workflow-gates/pipeline.json');
    const plan = localPlan(read(root, '.github/workflows/governance-pr.yml'), policy);
    const errors = preflightErrors(root, binding, policy);
    if (errors.length) throw new Error(errors.join('; '));
    const setup = await runCommand(root, ['npm', 'ci'], stepEnvironment({}, binding, process.env), 'install', 10 * 60000);
    report.install = setup; save([]);
    if (setup.code !== 0 || setup.signal || setup.error) throw new Error('Lockfile dependency installation failed');
    const jobs = await executePlan(root, plan, binding, save, process.env);
    report.release = await runCommand(root, ['node', 'scripts/workflow-gates/cli.mjs', 'release'],
      stepEnvironment({}, binding, process.env), 'release-security', 5 * 60000); save(jobs);
    const after = snapshot(root);
    if (Object.keys(binding).some(key => after[key] !== binding[key])) throw new Error('Candidate or remote changed during validation');
    report.completedAt = new Date().toISOString();
    report.status = jobs.length === plan.length && jobs.every(job => job.status === 'passed')
      && report.release.code === 0 && !report.release.signal && !report.release.error ? 'passed' : 'failed'; save(jobs);
    if (report.status !== 'passed') throw new Error('At least one required local job failed or was blocked');
    console.log('LOCAL PREPUSH PASSED. This does not establish post-push GitHub CI or release success.');
  } catch (error) { report.status = 'failed'; report.error = error.message; report.completedAt = new Date().toISOString(); save(report.jobs); throw error; }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`PREPUSH BLOCKED: ${error.message}`); process.exitCode = 1; });
}
