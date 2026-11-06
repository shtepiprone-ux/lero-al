// Task 945 approval of revision 1 (approver): lines of my own choice broken one at a time, in memory, through the tool's own mutation-loader.mjs, against the
// tests that should notice. No file changes. A break a named test group misses is rerun against that whole self-test file before it is called a survivor.
// Usage (project root): node <this file> [first index] [last index]
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('.');
const T = 'scripts/workflow-gates';
const CC = 'code-check', CR = 'change-review', DC = 'dependency-check', MC = 'mutation-check', HD = 'hook-differential';
const breaks = [
  ['binary by attribute no longer read', CC, CR, 'reader of the tree', "if (entry.startsWith('-\\t-\\t')) toRead.add(entry.slice(4));", ';'],
  ['the 8 MiB bound of an added line gone', CC, CR, 'reader of the tree', 'if (!tooLarge.get(file)) judge(file, line, text);', 'judge(file, line, text);'],
  ['a line that also holds a key is printed', CC, CR, 'SECRET-ECHO', 'rule.hidden?.some(find => find.test(text)) ?', 'false ?'],
  ['no rule hides anything', CC, CR, 'SECRET-ECHO', "(registry.secure || []).filter(rule => rule.refuse).map(rule => new RegExp(rule.pattern, rule.flags || ''))", '[]'],
  ['a failed git read is no failure', CC, CR, 'reader of the tree', 'if (run.error || run.status !== 0) throw new Error(`git ${args[0]} failed:', 'if (run.error) throw new Error(`git ${args[0]} failed:'],
  ['a package check over a refused package list', CR, CR, 'the review: a secret', 'if (packages.length && !refused.some(({ file }) => packages.includes(file))) {', 'if (packages.length) {'],
  ['tests over a refused line', CR, CR, 'the review: a secret', 'if (registry.mutation && files.length && !refused.length) {', 'if (registry.mutation && files.length) {'],
  ['untracked files not read by the review', CR, CR, 'SECRET-REACH', 'refusedLines(root, base, [], { untracked: true })', 'refusedLines(root, base, [])'],
  ['the review exits 0 on a refusal', CR, CR, 'by hand and in CI', 'process.exit(result.failures.length ? 1 : 0);', 'process.exit(0);'],
  ['the mutation guard of a name gone', MC, DC, 'NAME-INJECTION', 'if (unsafe) {', 'if (false) {'],
  ['any stem reaches a command line', MC, DC, 'NAME-INJECTION', "/^[\\w.-]+$/.test(stemOf(file))", 'true'],
  ['the root entry of a lock file refused', DC, DC, 'a lock file may fetch', 'else if (path && !entry.link && !entry.resolved && !entry.integrity)', 'else if (!entry.link && !entry.resolved && !entry.integrity)'],
  ['a link refused', DC, DC, 'a lock file may fetch', 'else if (path && !entry.link && !entry.resolved && !entry.integrity)', 'else if (path && !entry.resolved && !entry.integrity)'],
  ['a subagent refused without end', CC, CC, 'a repeated attempt', "if (name === 'SubagentStop' && (refused.length || todo.length) && state.subagentRefused === key) {", 'if (false) {'],
  ['a check that did not finish is stored', CC, CC, 'a repeated attempt', 'if (run.status !== null) memory[', 'memory['],
  ['stale memory over a new version', CC, CC, 'a repeated attempt', 'if (state.runs?.key !== key) state.runs = { key, results: {} };', 'state.runs ||= { key, results: {} };'],
  ['a file no row holds is out of the set', CC, CC, 'a repeated attempt', '[...others].sort().map(file => [file, hashOf(root, file)]), ', ''],
  ['a crash reads as a finding elsewhere', CC, CC, 'GATE-CRASH', 'if (!found.length) failures.push(', 'if (false) failures.push('],
  ['an entry with no finding is accepted', CC, CC, 'GATE-CRASH', "if (entry.namesFile && !(typeof entry.finding === 'string' && entry.finding)) throw", 'if (false) throw'],
  ['a file gone before the session is told', CC, CC, 'what still names a deleted file', "new Set([...gone].filter(file => !state.goneBefore.includes(file) && hashOf(root, file) === 'deleted'))", "new Set([...gone].filter(file => hashOf(root, file) === 'deleted'))"],
  ['a Stop that names nothing', CC, CR, 'SECRET-REACH', "refusedLines(root, 'HEAD', [...new Set([...Object.keys(state.named), ...changed])])", "refusedLines(root, 'HEAD', [])"],
  ['a written file no row holds is not read at the write', CC, CR, 'through the tool: a write tool', 'const read = [...new Set([...todo, ...(written && !(written in versions) ? [written] : [])])];', 'const read = [...todo];'],
  ['a failed git grep is no failure', CC, CC, 'what still names a deleted file', 'if (run.error || run.status > 1) throw new Error(`git grep failed:', 'if (run.error) throw new Error(`git grep failed:'],
  ['UNQUOTABLE loses $', CC, DC, 'NAME-INJECTION', "/[\"'`$%\\r\\n]/", "/[\"'`%\\r\\n]/"],
  ['UNQUOTABLE loses %', CC, CC, 'a name no command line can quote', "/[\"'`$%\\r\\n]/", "/[\"'`$\\r\\n]/"],
  ['UNQUOTABLE loses the backtick', CC, CC, 'a name no command line can quote', "/[\"'`$%\\r\\n]/", "/[\"'$%\\r\\n]/"],
  ['UNQUOTABLE loses the line breaks', CC, CC, 'a name no command line can quote', "/[\"'`$%\\r\\n]/", "/[\"'`$%]/"],
  ['the package name takes an ampersand', DC, DC, 'NAME-INJECTION', '[A-Za-z0-9._~-]*$/;', '[A-Za-z0-9._~&-]*$/;'],
  ['a guard that reads only its own text', MC, MC, 'GOV-945-MUTATION-DISK-ERROR', 'if (held.has(file) ? same(found, held.get(file)) : !now.has(file)) continue;', 'if (!now.has(file)) continue;'],
  ['outside the roots is not named', MC, MC, 'GOV-945-MUTATION-DISK-ERROR', 'if (!under(file)) { if (before.get(file) !== now.get(file)) outside.add(file); continue; }', 'if (!under(file)) continue;'],
  ['a control that writes goes unseen', MC, MC, 'GOV-945-MUTATION-DISK-ERROR', 'if (guard.said()) { result.error = guard.said(); continue; }', ''],
  ['a known note of a stage is dropped', CC, CC, 'a repeated attempt', 'notes.push(...known.notes);', ';'],
  ['a differential that throws exits 0', HD, CC, 'the real main of the differential', 'return result.lost || result.thrown ? 1 : 0;', 'return result.lost ? 1 : 0;'],
  ['a contract loses .npmrc', 'contract', CC, 'GOV-945-HOOK-EXECUTOR-DENY', '\\.npmrc$|', ''],
  ['a contract loses the CODEOWNERS', 'contract', CC, 'GOV-945-HOOK-EXECUTOR-DENY', '\\.github\\/CODEOWNERS$|', ''],
];
const key = path => { const plain = path.replaceAll('\\', '/'); return process.platform === 'win32' ? plain.toLowerCase() : plain; };
const OUT = join(ROOT, 'test-results/task945-approval/out');
mkdirSync(OUT, { recursive: true });
const first = Number(process.argv[2] ?? 0), last = Number(process.argv[3] ?? breaks.length - 1);
console.log(`# Task 945 approval: ${breaks.length} breaks; node ${process.version}; ${process.platform}; HEAD ${spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()}; ${new Date().toISOString()}`);
for (const [index, [label, stem, tests, pattern, find, replacement]] of breaks.entries()) {
  if (index < first || index > last) continue;
  const file = `${T}/${stem}.mjs`;
  const text = readFileSync(join(ROOT, file), 'utf8');
  const start = text.indexOf(find);
  if (start < 0 || text.indexOf(find, start + 1) >= 0) { console.log(`${index} NOT PLACED ${label}`); continue; }
  const report = join(OUT, `${index}.log`);
  rmSync(report, { force: true });
  const env = { ...process.env, NODE_OPTIONS: `--import=${pathToFileURL(join(ROOT, T, 'mutation-loader.mjs')).href}`, CODE_CHECK_MUTANT: JSON.stringify({ key: key(resolve(ROOT, file)), start, end: start + find.length, original: find, replacement, report }) };
  delete env.NODE_TEST_CONTEXT;
  const run = args => spawnSync(process.execPath, ['--test', ...args, `${T}/${tests}.selftest.mjs`], { cwd: ROOT, env, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 400000 });
  const started = Date.now();
  let result = run([`--test-name-pattern=${pattern}`]), scope = 'group';
  if (result.status === 0) { result = run([]); scope = 'whole file'; }
  const applied = existsSync(report) && readFileSync(report, 'utf8').includes('applied');
  const failed = [...result.stdout.matchAll(/^\s*error: '(.+)'$/gm)].map(match => match[1]).slice(0, 2).join(' | ').slice(0, 150);
  console.log(`${index} ${result.status === 0 ? 'SURVIVED' : 'CAUGHT'} ${label}; applied ${applied}; ${scope}; ${tests}; ${Math.round((Date.now() - started) / 1000)} s; ${failed}`);
}
console.log(`# ended ${new Date().toISOString()}`);
