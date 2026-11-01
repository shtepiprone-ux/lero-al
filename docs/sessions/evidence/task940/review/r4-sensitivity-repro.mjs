// Task 940 approver: independent reproduction of the three sensitivity breaks on a temporary copy of
// scripts/workflow-gates (the repository files are never modified). Usage: node <this file>
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const GATES = join(ROOT, 'scripts', 'workflow-gates');
const breaks = [
  ['GOV-940-VAL-SCOPE-DENY', 'contract.mjs', 'check(!tests.has(file),', 'check(true || !tests.has(file),'],
  ['GOV-940-CI-SCOPE-DENY', 'cli.mjs', 'if (scopeDigest(root, contract, new Map([...listed]', 'if (false && scopeDigest(root, contract, new Map([...listed]'],
  ['GOV-940-HOOK-FORGED-DENY', 'security-hook.mjs',
    "      if (typeof entry.evidence !== 'string' || !isEvidencePath(entry.evidence)) continue;\n"
    + '      let problems; try { problems = rulesEntryErrors(root, other, entry); } catch { continue; }\n'
    + '      if (problems.length) continue;\n', ''],
];
const run = (dir, id) => {
  const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=${id}`, 'scope-rebase.selftest.mjs'], { cwd: dir, encoding: 'utf8' });
  const out = `${result.stdout}${result.stderr}`;
  return { exit: result.status, pass: out.match(/^# pass (\d+)/m)?.[1], fail: out.match(/^# fail (\d+)/m)?.[1],
    assertion: /code: 'ERR_ASSERTION'/.test(out), error: out.match(/^\s+error: (.*)$/m)?.[1] ?? '' };
};
for (const [id, file, from, to] of breaks) {
  const dir = mkdtempSync(join(tmpdir(), 'lero-940-repro-'));
  try {
    cpSync(GATES, dir, { recursive: true });
    const baseline = run(dir, id);
    const path = join(dir, file);
    const original = readFileSync(path, 'utf8');
    const text = original.replace(/\r\n/g, '\n');
    if (text.split(from).length !== 2) throw new Error(`${id}: break anchor not unique in ${file}`);
    writeFileSync(path, text.replace(from, to));
    const mutant = run(dir, id);
    writeFileSync(path, original);
    const restored = run(dir, id);
    console.log(JSON.stringify({ id, file, baseline, mutant, restored }));
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
