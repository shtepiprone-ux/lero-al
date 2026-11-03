// Task 943 approver (review 3, session e50584bc), self-audit: reruns the AC2, AC3 and AC13 design probes on the final hook.
// p01 and p02 save their output next to themselves, so they run as copies under test-results/943-r3/probes/ (root and hook
// import rewritten to absolute paths; the design folder is not written). p09, p11 and p14 write only temporary folders and
// run unchanged from the project root (cwd). Prints every probe's stdout with its exit code.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const design = join(ROOT, 'docs/sessions/evidence/task943/design');
const work = join(ROOT, 'test-results/943-r3/probes');
mkdirSync(work, { recursive: true });
const hookUrl = pathToFileURL(join(ROOT, 'scripts/workflow-gates/security-hook.mjs')).href;
for (const name of ['p01-undetected-writes-probe.mjs', 'p02-pretool-probe.mjs']) {
  let text = readFileSync(join(design, name), 'utf8');
  const before = text;
  text = text.replace("new URL('../../../../../scripts/workflow-gates/security-hook.mjs', import.meta.url).href", JSON.stringify(hookUrl))
    .replace("resolve(here, '../../../../..')", JSON.stringify(ROOT))
    .replace(/new URL\('\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/([^']+)', import\.meta\.url\)/g, (_, p) => `new URL(${JSON.stringify(pathToFileURL(join(ROOT, p)).href)})`);
  if (text === before) throw new Error(`${name}: no import rewritten`);
  writeFileSync(join(work, name), text);
}
const runs = [
  ['p01 (AC2: lines 2-21 report X)', [join(work, 'p01-undetected-writes-probe.mjs')]],
  ['p02 (AC3: lines 2-5 refused)', [join(work, 'p02-pretool-probe.mjs')]],
  ['p09 (AC13: lines 4, 10-13, 19, 20, 22, 23, 29, 30, 32-36 real file or refusal)', [join(design, 'p09-target-spelling-probe.mjs')]],
  ['p11 (AC13: lines 3-14 reported or refused)', [join(design, 'p11-absolute-spelling-probe.mjs')]],
  ['p14 (AC13: lines 9-18 non-empty current, 19-21 controls unchanged)', [join(design, 'p14-noclobber-prototype.mjs')]],
];
for (const [label, args] of runs) {
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  console.log(`===== ${label}: exit ${r.status}`);
  console.log(r.stdout.split(/\r?\n/).map((line, i) => `${String(i + 1).padStart(3)}| ${line}`).join('\n'));
  if (r.stderr.trim()) console.log(`stderr: ${r.stderr.trim().slice(0, 600)}`);
}
