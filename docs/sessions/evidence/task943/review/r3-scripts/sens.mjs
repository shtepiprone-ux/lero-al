// Task 943 approver (review 3, session e50584bc): sensitivity of shell-mutation.selftest.mjs on a COPY of the gate folder
// under test-results/943-r3/gates-copy; the live gate files are only read. Each break is applied alone to the copy, the
// whole test file runs, then the copy is restored and rerun. Prints sha256 of the live and copied hook.
import { cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const live = join(ROOT, 'scripts', 'workflow-gates');
const base = join(ROOT, 'test-results', '943-r3', 'gates-copy');
const copy = join(base, 'scripts', 'workflow-gates');
rmSync(base, { recursive: true, force: true });
cpSync(live, copy, { recursive: true });
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const hook = join(copy, 'security-hook.mjs');
const original = readFileSync(hook, 'utf8');
console.log(`live hook sha256 ${sha(join(live, 'security-hook.mjs'))}; copy ${sha(hook)}`);
const run = label => {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', join(copy, 'shell-mutation.selftest.mjs')], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const lines = r.stdout.split(/\r?\n/);
  const results = lines.filter(l => /^(not )?ok \d+ - /.test(l.trim())).map(l => l.trim().replace(/^(not ok|ok) \d+ - (\[[^\]]+\]).*$/, '$1 $2'));
  const failures = [];
  lines.forEach((l, i) => { if (/^\s+error: /.test(l)) failures.push(`${l.trim().slice(0, 220)} | ${(lines.slice(i + 1, i + 12).find(x => /code: 'ERR_ASSERTION'|name: 'AssertionError'/.test(x)) || '').trim()}`); });
  console.log(`## ${label}: exit ${r.status}; hook sha256 ${sha(hook)}`);
  for (const l of results) console.log(`  ${l}`);
  for (const f of failures) console.log(`  failure: ${f}`);
};
run('baseline (copy of the final hook)');
const breaks = [
  ['GOV-943-HOOK-NESTED-DENY (AC14): R13 (b) parsed text evaluation dropped', 'if (inner && depth < 3) {', 'if (false && inner && depth < 3) {'],
  ['GOV-943-HOOK-PROGRAM-DENY (AC2): tee removed from the table', "const TEE_PROGRAMS = new Set(['tee', 'tee-object']);", "const TEE_PROGRAMS = new Set(['tee-object']);"],
  ['GOV-943-HOOK-PRETOOL-DENY (AC3): Copy-Item removed from the table', "'cpi', 'copy-item', 'install'", "'cpi', 'install'"],
  ['own break: R13 (f) child-process strings not read', 'if (depth < 3) for (const match of command.matchAll(CHILD_CALL)) {', 'if (false) for (const match of command.matchAll(CHILD_CALL)) {'],
  ['own break: R15 prettier removed from OTHER_WRITERS', "new Set(['prettier', 'eslint',", "new Set(['eslint',"],
  ['own break: R12 (d) revision 4 Write/Edit event cwd ignored', 'files = [...new Set([file, ...(folder ? [projectPath(root, raw, folder)] : [])])];', 'files = [file];'],
  ['own break: R14 (c) generic API names unqualified', 'const API_QUALIFIER = String.raw`(?:', 'const API_QUALIFIER = String.raw`(?:\\b|'],
  ['own break: R13 (d) pipeline rule dropped', 'if (PIPED_PROGRAMS.has(program) && all.length > 1) {', 'if (false) {'],
  ['own break: R13 (e) lenient reading dropped', 'for (const path of lenientTargets(root, command, starts)) add(path);', 'void lenientTargets;'],
];
for (const [label, needle, replacement] of breaks) {
  if (original.split(needle).length !== 2) { console.log(`## ${label}: anchor not found exactly once, skipped`); continue; }
  writeFileSync(hook, original.replace(needle, replacement));
  run(`mutant - ${label}`);
  writeFileSync(hook, original);
}
run('restored');
console.log(`restored copy equals live: ${sha(hook) === sha(join(live, 'security-hook.mjs'))}; live hook sha256 ${sha(join(live, 'security-hook.mjs'))}`);
rmSync(base, { recursive: true, force: true });
