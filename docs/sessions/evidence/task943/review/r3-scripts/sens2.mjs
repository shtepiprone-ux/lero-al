// Task 943 approver (review 3, session e50584bc), self-audit: the four kickoff sensitivity breaks that sens.mjs did not
// reproduce (AC8, AC9, AC12, AC13), each on a COPY of the gate folder, plus the digests of the seven retained artifacts
// against sensitivity.json and the hook sha256 lines inside them. The live gate files are only read.
import { cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const live = join(ROOT, 'scripts', 'workflow-gates');
const base = join(ROOT, 'test-results', '943-r3', 'gates-copy2');
const copy = join(base, 'scripts', 'workflow-gates');
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const { digest } = await import(new URL('../../scripts/workflow-gates/contract.mjs', import.meta.url));

// A. Retained artifacts.
const record = JSON.parse(readFileSync(join(ROOT, 'docs/sessions/evidence/task943/sensitivity/sensitivity.json'), 'utf8'));
const hookSha = sha(join(live, 'security-hook.mjs'));
console.log(`live hook sha256 ${hookSha}`);
for (const row of record.cases) {
  const text = readFileSync(join(ROOT, row.artifact), 'utf8');
  const shas = [...new Set([...text.matchAll(/\b[0-9a-f]{64}\b/g)].map(m => m[0]))];
  console.log(`artifact ${row.id}: digest ${digest(ROOT, [row.artifact]) === row.artifactSha256 ? 'EQUALS' : 'DIFFERS FROM'} sensitivity.json; mentions final hook sha256 ${shas.includes(hookSha)}; baseline/mutant/restored ${row.baseline}/${row.mutant}/${row.restored}; failureKind ${row.failureKind}; ERR_ASSERTION in text ${/ERR_ASSERTION|AssertionError/.test(text)}`);
}

// B. Breaks on a copy.
rmSync(base, { recursive: true, force: true });
cpSync(live, copy, { recursive: true });
const run = (label, file, pattern) => {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-name-pattern', pattern, join(copy, file)], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const lines = r.stdout.split(/\r?\n/);
  const results = lines.filter(l => /^(not )?ok \d+ - /.test(l.trim())).map(l => l.trim().replace(/^(not ok|ok) \d+ - (\[[^\]]+\]).*$/, '$1 $2'));
  const failures = [];
  lines.forEach((l, i) => { if (/^\s+error: /.test(l)) failures.push(`${l.trim().slice(0, 200)} | ${(lines.slice(i + 1, i + 12).find(x => /code: 'ERR_ASSERTION'|name: 'AssertionError'/.test(x)) || '').trim()}`); });
  console.log(`## ${label}: exit ${r.status}; ${results.join(', ')}`);
  for (const f of failures) console.log(`  failure: ${f}`);
};
const breaks = [
  ['GOV-943-TESTS-REBASE-DENY (AC8): [<id>] presence check skipped', 'contract.mjs', 'case-test-rebase.selftest.mjs', 'GOV-943-TESTS-REBASE-DENY',
    'if (source !== null) check(source.includes(`[${row.id}]`)', 'if (false) check(source.includes(`[${row.id}]`)'],
  ['GOV-943-EXEMPT-UNTRACKED-DENY (AC9): tracked check dropped', 'security-hook.mjs', 'case-test-rebase.selftest.mjs', 'GOV-943-EXEMPT-UNTRACKED-DENY',
    'if (repository && !tracked(path)) continue;', 'if (false) continue;'],
  ['GOV-943-CI-STALE-REVIEW-DENY (AC12): reviewed contracts outside selected skipped', 'cli.mjs', 'case-test-rebase.selftest.mjs', 'GOV-943-CI-STALE-REVIEW-DENY',
    'if (selected.includes(path)) continue;', 'if (true) continue;'],
  ['GOV-943-HOOK-TARGET-SPELLING-DENY (AC13): R12 (c) parsed folder change dropped', 'security-hook.mjs', 'shell-mutation.selftest.mjs', 'GOV-943-HOOK-TARGET-SPELLING-DENY',
    'if (movedFolder(value)) folders = folders.map(folder => resolve(folder, spelling(value)));', 'void 0;'],
];
for (const [label, target, test, pattern, needle, replacement] of breaks) {
  const file = join(copy, target);
  const original = readFileSync(file, 'utf8');
  if (original.split(needle).length !== 2) { console.log(`## ${label}: anchor not found exactly once, skipped`); continue; }
  run(`baseline - ${label}`, test, pattern);
  writeFileSync(file, original.replace(needle, replacement));
  run(`mutant - ${label}`, test, pattern);
  writeFileSync(file, original);
  run(`restored - ${label}`, test, pattern);
  console.log(`  restored ${target} equals live: ${sha(file) === sha(join(live, target))}`);
}
rmSync(base, { recursive: true, force: true });
console.log(`live hook sha256 after ${sha(join(live, 'security-hook.mjs'))}`);
