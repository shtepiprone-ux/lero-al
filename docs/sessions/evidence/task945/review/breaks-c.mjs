// Task 945 independent review: hand-chosen in-memory breaks through the candidate's own loader. Nothing on disk changes; each run names whether the
// break was applied. A break the own self-test misses is rerun against the whole suite before it is called a survivor.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('.');
const T = 'scripts/workflow-gates';
const LOADER = pathToFileURL(join(ROOT, T, 'mutation-loader.mjs')).href;
const OUT = join(ROOT, 'test-results/task945-review/out');
mkdirSync(OUT, { recursive: true });
const key = path => path.replaceAll('\\', '/').toLowerCase();

const breaks = [
  ['a crashing whole-tree gate counts as a finding elsewhere', 'code-check', "if (!reportsFile(root, run.output, folders)) failures", "if (reportsFile(root, run.output, folders)) failures"],
  ['taskkill without the tree', 'code-check', "['/T', '/F', '/PID'", "['/F', '/PID'"],
  ['file name bound dropped', 'code-check', "(?![\\\\w-]|\\\\.\\\\w)", ""],
  ['the write that fired stays in a new baseline', 'code-check', "if (!saved && written) delete state.baseline[written];", ""],
  ['refuse rules not applied at the write', 'code-check', "if (stage === 'write') failures.push(...added(", "if (stage === 'never') failures.push(...added("],
  ['SubagentStop no longer checks', 'code-check', "['PostToolUse', 'Stop', 'SubagentStop']", "['PostToolUse', 'Stop']"],
  ['a hung check after grace counts as passed', 'code-check', "finish({ status: null, reason: 'timeout' }); }, KILL_GRACE_MS", "finish({ status: 0, reason: 'timeout' }); }, KILL_GRACE_MS"],
  ['a timed out check that closes counts by its status', 'code-check', "status: timedOut ? null : status", "status: status"],
  ['deleted files no longer seen', 'code-check', "if (!(file in versions) && registry.rowsFor(file).length) versions[file] = hashOf(root, file);", "continue;"],
  ['proposed correction, not a defect: AGENTS.md is a policy path', 'contract', "isPolicyPath = file => /^(?:\\.claude\\/|", "isPolicyPath = file => /^(?:AGENTS\\.md$|\\.claude\\/|"],
  ['proposed correction, self-audit: AGENTS.md and CLAUDE.md are policy paths', 'contract', "isPolicyPath = file => /^(?:\\.claude\\/|", "isPolicyPath = file => /^(?:AGENTS\\.md$|CLAUDE\\.md$|\\.claude\\/|"],
  ['proposed correction, self-audit: every steering path is a policy path', 'contract', "isPolicyPath = file => /^(?:\\.claude\\/|", "isPolicyPath = file => /^(?:AGENTS\\.md$|CLAUDE\\.md$|\\.codex\\/|\\.npmrc$|\\.github\\/CODEOWNERS$|docs\\/orchestrator-procedures\\.md$|docs\\/governance-enforcement\\.md$|\\.claude\\/|"],
  ['a name no command can quote is not refused', 'code-check', "named.filter(path => UNQUOTABLE.test(path))", "named.filter(path => false)"],
  ['differential main always exits 0', 'hook-differential', "return result.lost || result.thrown ? 1 : 0;", "return 0;"],
  ['change-review main ignores failures', 'change-review', "process.exit(result.failures.length ? 1 : 0);", "process.exit(0);"],
  ['change-review that could not run exits 0', 'change-review', "CHANGE REVIEW COULD NOT RUN: ${error.message}\\n`);\n    process.exit(1);", "CHANGE REVIEW COULD NOT RUN: ${error.message}\\n`);\n    process.exit(0);"],
  ['change-review follows renames', 'change-review', "['diff', '--no-renames', '--name-only', base]", "['diff', '--name-only', base]"],
  ['a lock entry with no integrity passes', 'dependency-check', "else if (entry.resolved && !entry.link && !entry.integrity)", "else if (false)"],
  ['a file the tests never load is silent', 'mutation-check', "if (!control.applied) { result.notLoaded = true; continue; }", "if (!control.applied) { continue; }"],
  ['a survivor is counted as caught', 'mutation-check', "else if (run.status === 0) result.survivors.push(", "else if (false) result.survivors.push("],
];

function run(args, file, start, end, original, replacement, label) {
  const report = join(OUT, `${label}.log`);
  rmSync(report, { force: true });
  const env = { ...process.env, NODE_OPTIONS: `--import=${LOADER}`, CODE_CHECK_MUTANT: JSON.stringify({ key: key(resolve(ROOT, file)), start, end, original, replacement, report }) };
  delete env.NODE_TEST_CONTEXT;
  const begun = Date.now();
  const result = spawnSync(process.execPath, args, { cwd: ROOT, env, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 300000, windowsHide: true });
  const applied = existsSync(report) && readFileSync(report, 'utf8').includes('applied');
  rmSync(report, { force: true });
  const failed = [...`${result.stdout}`.matchAll(/^\s*(?:not ok \d+ - |✖ )(.+)$/gm)].map(match => match[1]).slice(0, 3);
  return { status: result.status, applied, seconds: Math.round((Date.now() - begun) / 1000), failed };
}

const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
for (const [name, stem, find, replace] of breaks) {
  if (only && !only.test(name)) continue;
  const file = `${T}/${stem}.mjs`;
  const text = readFileSync(join(ROOT, file), 'utf8');
  const start = text.indexOf(find);
  if (start < 0 || text.indexOf(find, start + 1) >= 0) { console.log(`NOT PLACED (${start < 0 ? 'absent' : 'twice'}): ${name}`); continue; }
  const own = existsSync(join(ROOT, T, `${stem}.selftest.mjs`)) ? `${T}/${stem}.selftest.mjs` : `${T}/code-check.selftest.mjs`;
  const first = run(['--test', own], file, start, start + find.length, find, replace, 'first');
  if (first.status !== 0) { console.log(`CAUGHT by ${own} (${first.seconds}s, applied ${first.applied}): ${name} :: ${first.failed.join(' | ').slice(0, 170)}`); continue; }
  const whole = run([`${T}/selftests.mjs`], file, start, start + find.length, find, replace, 'whole');
  console.log(`${whole.status === 0 ? 'SURVIVED the whole suite' : 'CAUGHT by the whole suite'} (own ${first.seconds}s applied ${first.applied}; whole ${whole.seconds}s applied ${whole.applied}): ${name} :: ${whole.failed.join(' | ').slice(0, 170)}`);
}
writeFileSync(join(OUT, 'breaks-c.done'), String(Date.now()));
