// Task 941 review 2, self-audits 2 and 3 (2026-11-02). Run from the project root:
//   node docs/sessions/evidence/task941/review-2/r12-scan/run-scan.mjs
// 1. Positive control: the triggers of proxy.mjs record the known R12 forms and not a plain read.
// 2. Every gate self-test that imports security-hook.mjs is copied to test-results/task941-review2/r12-scan/ (gitignored) with
//    its hook import pointed at proxy.mjs and every other './x.mjs' import (and new URL('./x.mjs', import.meta.url)) pointed at the
//    real scripts/workflow-gates file, then run with node --test. Each hook input that an R12 trigger would extend is printed
//    with the copy's file and line, so each can be checked against the assertion that consumes it. A test that spawns the
//    hook as a process passes that input to the real hook, which this proxy does not see; such inputs are listed separately.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const gates = join(root, 'scripts/workflow-gates');
const out = join(root, 'test-results/task941-review2/r12-scan');
mkdirSync(out, { recursive: true });
const proxyUrl = pathToFileURL(join(root, 'docs/sessions/evidence/task941/review-2/r12-scan/proxy.mjs')).href;
const { triggers } = await import(proxyUrl);
const product = ['pack', 'age.json'].join('');
for (const command of ['cd D; echo x > hook.mjs', 'cat Y > D/hoo?.mjs', 'Get-Content Y > D/hook.mjs.',
  `node -e "require('fs').writeFileSync('${product}','x')"`, `cd D; node -e "require('fs').writeFileSync('hook.mjs','x')"`,
  'grep -n a scripts/x.mjs']) {
  console.log(`control ${JSON.stringify(command)} -> ${JSON.stringify(triggers(root, command))}`);
}
const tests = readdirSync(gates).filter(name => name.endsWith('.selftest.mjs')
  && readFileSync(join(gates, name), 'utf8').includes("from './security-hook.mjs'")).sort();
let status = 0;
for (const name of tests) {
  const source = readFileSync(join(gates, name), 'utf8');
  const real = file => pathToFileURL(join(gates, file)).href;
  const copy = source
    .replace("from './security-hook.mjs'", `from '${proxyUrl}'`)
    .replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${real(file)}'`)
    .replace(/new URL\('\.\/([\w.-]+\.mjs)', import\.meta\.url\)/g, (_, file) => `new URL('${real(file)}')`);
  const copyName = name.replace('.selftest.mjs', '.copy.test.mjs');
  writeFileSync(join(out, copyName), copy);
  const log = join(out, `${copyName}.tsv`);
  writeFileSync(log, '');
  const run = spawnSync(process.execPath, ['--test', join(out, copyName)], { cwd: root, encoding: 'utf8', env: { ...process.env, R12_SCAN_LOG: log } });
  const totals = run.stdout.split('\n').filter(line => /^# (pass|fail)/.test(line)).join(', ');
  const recorded = readFileSync(log, 'utf8').split('\n').filter(Boolean);
  const spawned = source.split('\n').map((line, i) => [i + 1, line]).filter(([, line]) => /spawnSync\(process\.execPath, \[(?:HOOK|fileURLToPath\(new URL\('\.\/security-hook)/.test(line)).map(([n]) => n);
  console.log(`${name}: ${totals}; hook inputs an R12 trigger would extend: ${recorded.length}; lines spawning the real hook: ${JSON.stringify(spawned)}`);
  // The temporary folder is written as <tmp> so that no user folder name is retained in the evidence.
  const tmp = tmpdir();
  for (const line of recorded) console.log(`  ${line.split(tmp.replaceAll('\\', '\\\\')).join('<tmp>').split(tmp).join('<tmp>')}`);
  if (run.status !== 0) status = run.status;
}
process.exitCode = status;
