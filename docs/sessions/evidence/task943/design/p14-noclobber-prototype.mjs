// Task 943 revision 3 design evidence (Task 941 review 3 session, 2026-11-03), read-only: the Bash `>|` redirection.
// 1. Real Git Bash runs in temporary folders show what `>|` writes. 2. The current hook (Task 941 revision 2, working tree)
// and the pre-941 hook report nothing for it. 3. A prototype rule, a wrapper around the current `shellWriteTargets`, adds the
// `>|` target: quote-aware for a read-only command (941), raw-text for every other command. 4. Over the frozen 943 corpus
// of session commands it counts the commands whose result changes. Writes only temporary folders; prints to stdout.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const hook = await import(pathToFileURL(join(repo, 'scripts/workflow-gates/security-hook.mjs')).href);
const lines = [`HEAD ${execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()}; node ${process.version}`];

// 1. Real Bash.
const bash = 'C:/Program Files/Git/bin/bash.exe';
const real = (id, command) => {
  const dir = mkdtempSync(join(tmpdir(), 'p14-'));
  mkdirSync(join(dir, 's')); writeFileSync(join(dir, 'Y'), 'a\n'); writeFileSync(join(dir, 's', 'Y'), 'a\n');
  spawnSync(bash, ['-c', command], { cwd: dir, encoding: 'utf8' });
  const files = [...readdirSync(dir).filter(f => f !== 's'), ...readdirSync(join(dir, 's')).map(f => `s/${f}`)].sort();
  lines.push(`real bash | ${id} | ${JSON.stringify(command)} | files=${JSON.stringify(files)}`);
};
real('noclobber-word', 'grep -c a Y >|out');
real('noclobber-space', 'grep -c a Y >| out');
real('noclobber-stderr', 'grep -c a Y 2>|err');
real('noclobber-quoted', "grep -c a Y >|'q t'");
real('noclobber-after-cd', 'cd s; grep -c a Y >|out');
real('noclobber-set-o', 'set -o noclobber; echo x > Y; echo x >| Y; cat Y > out');
real('quoted-control', "grep -c '>|out' Y");

// 3. Prototype rule.
const target = (text, i) => { // quote-aware word after `>|` at index i (the `|`)
  let j = i + 1, word = '', quote = '';
  while (text[j] === ' ' || text[j] === '\t') j++;
  for (; j < text.length; j++) {
    const ch = text[j];
    if (quote) { if (ch === quote) quote = ''; else word += ch; continue; }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (/[ \t\r\n;|&<>]/.test(ch)) break;
    word += ch;
  }
  return word;
};
const noclobberTargets = command => {
  if (typeof command !== 'string') return [];
  const found = [];
  if (hook.isReadOnlyShellCommand(command)) {
    let quote = '';
    for (let i = 0; i < command.length; i++) {
      const ch = command[i];
      if (quote) { if (ch === quote) quote = ''; continue; }
      if (ch === "'" || ch === '"') { quote = ch; continue; }
      if (ch === '|' && command[i - 1] === '>') { const t = target(command, i); if (t) found.push(t); }
    }
  } else {
    for (const m of command.matchAll(/>\|[ \t]*(?:"([^"]+)"|'([^']+)'|([^\s;|&<>'"]+))/g)) found.push(m[1] || m[2] || m[3]);
  }
  return found;
};
const root = mkdtempSync(join(tmpdir(), 'p14-root-'));
// `projectPath` is not exported; the read-only branch resolves a quoted `>` target through it (941 R2).
const resolveTarget = t => (t.includes("'") ? [t] : hook.shellWriteTargets(root, `cat README.md > '${t}'`));
const proto = command => {
  const base = hook.shellWriteTargets(root, command);
  const added = [...new Set(noclobberTargets(command).flatMap(resolveTarget))].filter(t => !base.includes(t));
  return [...base, ...added];
};
const X = 'scripts/workflow-gates/security-hook.mjs';
const forms = [
  // The 941 classifier splits at `|`: only a target spelled as a read-only program name leaves the command read-only.
  ['read-only: target is a program name', `grep -c writeFileSync ${X} >|cat`],
  ['read-only: program name after cd (R12 (c) resolves it against .git)', 'cd .git; grep -c a ../README.md >|head'],
  ['read-only: quoted program name', "grep -c a README.md >| 'ls'"],
  ['not read-only: word target', `grep -c writeFileSync ${X} >|out`],
  ['read-only space', `grep -c a README.md >| ${X}`],
  ['read-only stderr', `grep -c a README.md 2>|${X}`],
  ['read-only quoted target', `grep -c a README.md >|'${X}'`],
  ['not read-only', `echo x >| ${X}`],
  ['not read-only, write word', `node -e "1" >| ${X}; Set-Content q x`],
  ['git metadata', 'grep -c a README.md >| .git/HEAD'],
  ['control: quoted in a read-only grep', `grep -n '>|${X}' README.md`],
  ['control: plain pipe', `grep -c a README.md | wc -l`],
  ['control: > only', `grep -c a README.md > out.txt`],
];
for (const [id, command] of forms) {
  lines.push(`classify | ${id} | readOnly=${hook.isReadOnlyShellCommand(command)} | current=${JSON.stringify(hook.shellWriteTargets(root, command))} | prototype=${JSON.stringify(proto(command))}`);
}
// Executor pre-write guard with the prototype targets: the guard decides on paths, so show the current refusals for them.
const exec = command => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', tool_input: { command } });
for (const command of ['grep -c a README.md >| .git/HEAD', `echo x >| ${X}`]) {
  const viaGuard = proto(command).map(file => hook.evaluateHook(root, { ...exec(`echo x > ${file}`) }, '').join(' ')).join(' | ');
  lines.push(`guard | ${JSON.stringify(command)} | current=${JSON.stringify(hook.evaluateHook(root, exec(command), ''))} | the same paths as a > target=${viaGuard}`);
}

// 4. Frozen corpus.
const corpusPath = join(repo, 'test-results/task943-prototype/corpus.json');
if (existsSync(corpusPath)) {
  // Same layout and sha256 as p12-run.mjs: sorted [command, cwd] pairs.
  const corpus = JSON.parse(readFileSync(corpusPath, 'utf8')).map(([command]) => command);
  const { createHash } = await import('node:crypto');
  const sha = createHash('sha256').update(JSON.stringify(JSON.parse(readFileSync(corpusPath, 'utf8')))).digest('hex');
  const { isPolicyPath, isProductPath } = await import(pathToFileURL(join(repo, 'scripts/workflow-gates/contract.mjs')).href);
  const guarded = t => !t.startsWith('../') && !/^[A-Za-z]:/.test(t) && (isPolicyPath(t) || isProductPath(t) || /^(?:tasks|docs|\.git)\//.test(t));
  let changed = 0, guardedAdded = 0; const examples = [];
  // Command text stays out of the output: the corpus is gitignored because it may hold private data (p12-run.mjs).
  for (const [index, command] of corpus.entries()) {
    const before = hook.shellWriteTargets(root, command), after = proto(command);
    const added = after.filter(t => !before.includes(t));
    if (added.length) {
      changed++; if (added.some(guarded)) guardedAdded++;
      examples.push(`corpus entry #${index} (a command that is not read-only; >| inside quoted text) -> added ${JSON.stringify(added)}`);
    }
  }
  lines.push(`corpus | ${corpus.length} commands, sha256 ${sha} | commands whose result changes ${changed} | of them with an added policy, product, tasks, docs or .git target ${guardedAdded}`);
  for (const e of examples) lines.push(`corpus example | ${e}`);
} else lines.push('corpus | not present');
// 5. Existing self-tests: a file without `>|` gets no prototype addition, so its results cannot change.
const gates = join(repo, 'scripts/workflow-gates');
const withNoclobber = readdirSync(gates).filter(f => f.endsWith('.selftest.mjs') && readFileSync(join(gates, f), 'utf8').includes('>|'));
lines.push(`selftests | ${readdirSync(gates).filter(f => f.endsWith('.selftest.mjs')).length} self-test files | files containing the noclobber operator: ${JSON.stringify(withNoclobber)}`);
// 6. Composition with R12 (c): the revision 2 prototype (p12-r12-prototype.mjs, R12 (a)-(f) on a gitignored copy of the hook)
// resolves a `>` target against the folder of its simple command. R12 (g) makes the `>|` word a W1 target of the same
// simple command, so the expected (g)+(c) result is the p12 result for the command with that one `>|` read as `>`.
// p12 edits the hook it was written for (db04c936f, 941 revision 1, whose R1 (b) it emulates); it no longer applies to the
// 941 revision 2 hook. It takes its root from the cwd, so it runs in a temporary root holding that hook, the current
// sibling modules and its additions file; nothing in the project is written.
const p12Root = mkdtempSync(join(tmpdir(), 'p14-p12-'));
mkdirSync(join(p12Root, 'scripts/workflow-gates'), { recursive: true });
mkdirSync(join(p12Root, 'docs/sessions/evidence/task943/design'), { recursive: true });
// The hook and its sibling modules all come from db04c936f, so a later change of the gate files (Task 943 itself)
// cannot break this composition check when the AC13 rerun happens.
for (const name of execFileSync('git', ['-C', repo, 'ls-tree', '--name-only', 'db04c936f', 'scripts/workflow-gates/'], { encoding: 'utf8' }).trim().split('\n')) {
  if (!/\.(mjs|json)$/.test(name) || name.endsWith('.selftest.mjs')) continue;
  writeFileSync(join(p12Root, name), execFileSync('git', ['-C', repo, 'show', `db04c936f:${name}`]));
}
writeFileSync(join(p12Root, 'docs/sessions/evidence/task943/design/p12-r12-additions.txt'), readFileSync(join(repo, 'docs/sessions/evidence/task943/design/p12-r12-additions.txt')));
const p12Path = execFileSync(process.execPath, [join(repo, 'docs/sessions/evidence/task943/design/p12-r12-prototype.mjs')], { cwd: p12Root, encoding: 'utf8' }).trim();
const p12 = await import(pathToFileURL(resolve(p12Root, p12Path)).href);
const fixture = mkdtempSync(join(tmpdir(), 'p14-fixture-'));
mkdirSync(join(fixture, 'D')); writeFileSync(join(fixture, 'D', 'hook.mjs'), 'x\n'); writeFileSync(join(fixture, 'Y'), 'a\n');
const asRedirect = command => command.replace(/>\|/g, '>');
for (const command of ['cd D; cat ../Y >| hook.mjs', 'cd D; grep -c a ../Y >|cat', 'cd .git; grep -c a ../README.md >|head', 'cat Y >| D/hook.mjs']) {
  lines.push(`composition | ${JSON.stringify(command)} | p12 as written=${JSON.stringify(p12.shellWriteTargets(fixture, command))} | p12 with the >| read as >=${JSON.stringify(p12.shellWriteTargets(fixture, asRedirect(command)))}`);
}
console.log(lines.join('\n'));
