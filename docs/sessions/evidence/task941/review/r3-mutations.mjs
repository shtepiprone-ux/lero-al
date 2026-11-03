// Review 3: isolated mutations of the candidate hook, each run on a copy of scripts/workflow-gates in a temporary folder
// (never in the project). Reports which GOV-941 tests fail per mutation. Writes only temporary folders.
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const mutations = [
  ['baseline', null, null],
  ['S1-first-simple-command-only', 'commands.every(readOnlySimpleCommand)', 'readOnlySimpleCommand(commands[0])'],
  ['S2-hash-allowed', "const UNQUOTED_CHAR = /[A-Za-z0-9 \\t\\r\\n\\-_./:=,+%~;|&<>*?[\\]\\\\]/;", "const UNQUOTED_CHAR = /[A-Za-z0-9 \\t\\r\\n\\-_./:=,+%~;|&<>*?[\\]\\\\#]/;"],
  ['M1-lone-cr-allowed', '|\\r(?!\\n)/.test(command)', '/.test(command)'],
  ['M2-no-cd-rule', 'return !(commands.some(changesFolder) &&', 'return !(false &&'],
  ['M4-cd-case-sensitive', "includes(name.toLowerCase()))", "includes(name))"],
  ['M7-cd-own-command-only', 'commands.some(changesFolder) && commands.some(words => redirections(words).targets.length > 0)', 'commands.some(words => changesFolder(words) && redirections(words).targets.length > 0)'],
  ['M8-cd-only-not-set-location', "['cd', 'set-location'].includes", "['cd'].includes"],
];
const lines = [`candidate HEAD ${execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}; node ${process.version}`];
for (const [id, from, to] of mutations) {
  const dir = mkdtempSync(join(tmpdir(), 'r3-mut-'));
  cpSync(join(repo, 'scripts/workflow-gates'), join(dir, 'scripts/workflow-gates'), { recursive: true });
  const file = join(dir, 'scripts/workflow-gates/security-hook.mjs');
  if (from) {
    const src = readFileSync(file, 'utf8');
    const count = src.split(from).length - 1;
    if (count !== 1) { lines.push(`${id} | MUTATION NOT APPLIED (occurrences=${count})`); continue; }
    writeFileSync(file, src.replace(from, to));
  }
  const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'scripts/workflow-gates/shell-write.selftest.mjs'], { cwd: dir, encoding: 'utf8' });
  const failed = [...run.stdout.matchAll(/^not ok \d+ - \[(GOV-941-[A-Z-]+)\]/gm)].map(m => m[1]);
  const pass = run.stdout.match(/^# pass (\d+)/m)?.[1];
  // Failure kind: every failing test must carry ERR_ASSERTION (an assertion), not a thrown error of another kind.
  const assertionFailures = (run.stdout.match(/code: 'ERR_ASSERTION'/g) || []).length;
  const otherCodes = [...run.stdout.matchAll(/code: '([A-Z_]+)'/g)].map(m => m[1]).filter(code => code !== 'ERR_ASSERTION' && code !== 'ERR_TEST_FAILURE');
  lines.push(`${id} | exit=${run.status} | pass=${pass} | failed=${JSON.stringify(failed)} | ERR_ASSERTION=${assertionFailures} | other error codes=${JSON.stringify(otherCodes)}`);
}
console.log(lines.join('\n'));
