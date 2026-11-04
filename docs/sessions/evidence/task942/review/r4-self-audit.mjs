// Task 942 review 1, self-audit of the reviewer's own revision 5 (read-only). Run from the project root after p13-reader-forms-run.mjs and r1-probes.mjs:
// node docs/sessions/evidence/task942/review/r4-self-audit.mjs
// Three hooks: C60 (copy), C87 (live, unchanged), and the revision 5 prototype of p13.
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const url = path => pathToFileURL(join(root, path)).href;
const c60 = await import(url('test-results/task942-approver/hook-c60.mjs'));
const c87 = await import(url('scripts/workflow-gates/security-hook.mjs'));
const proto = await import(url('test-results/task942-r11/security-hook.mjs'));
const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs', Y = `docs/${N}`;
const fx = mkdtempSync(join(tmpdir(), 'lero-942-self-'));
for (const file of [X, Y, 'docs/a.b', 'a.b']) { mkdirSync(dirname(join(fx, file)), { recursive: true }); writeFileSync(join(fx, file), 'a\n'); }
const has = (hook, command, target = X) => { try { return hook.shellWriteTargets(fx, command, fx).includes(target); } catch (e) { return `THROW ${e.message.slice(0, 50)}`; } };
const section = title => console.log(`\n## ${title}`);

// 1. Every form of the report's undetected table, as the report spells it, on the prototype.
section('1. the 26 forms of the completion report, as it spells them');
const report = readFileSync('docs/sessions/evidence/task942/impl/completion-report.md', 'utf8').split('\n');
const start = report.findIndex(line => line.startsWith('**New, for the approver (C48).**'));
const rows = report.slice(start).filter(line => line.startsWith('| `')).slice(0, 15);
let total = 0, closed = 0;
for (const row of rows) {
  const cell = row.split(/ \| /)[0].replace(/^\| /, '');
  for (const match of cell.matchAll(/`([^`]+)`/g)) {
    const command = match[1].replaceAll('ˋ', '`').replaceAll('\\|', '|').replaceAll('X', X).replace(/(?<![A-Za-z])D(?![A-Za-z])/g, D).replace(/'N'/g, `'${N}'`);
    const a = has(c87, command), b = has(proto, command);
    total++;
    if (b === true) closed++;
    console.log(`${b === true ? 'closed' : 'OPEN  '} | c87 ${a} | prototype ${b} | ${command}`);
  }
}
console.log(`forms ${total}; closed by the prototype ${closed}; open ${total - closed}`);

// 2. Targets the new value options and readings take away: the same class as the `--package` correction of section 5.
section('2. targets of C60 and C87 that the prototype loses');
const words = ['-p', '--package', '-w', '--workspace', '--filter', '-F', '--prefix', '-C', '--dir', '--cwd'];
for (const runner of ['npx', 'pnpx', 'bunx', 'npm exec', 'pnpm dlx', 'yarn dlx', 'bun x']) for (const word of words) {
  const command = `${runner} ${word} rm ${X}`;
  const [a, b, c] = [has(c60, command), has(c87, command), has(proto, command)];
  if ((a === true || b === true) && c !== true) console.log(`LOST | c60 ${a} | c87 ${b} | prototype ${c} | ${command}`);
}
for (const command of [`npx --call='rm ${X}' -c 'cat a'`, `npx -c 'rm ${X}' -c 'cat a'`, `npx -c 'rm ${X}' --call='cat a'`, `npm --loglevel rm ${X}`, `yarn workspace rimraf ${X}`, `yarn workspace rm rm ${X}`, `pnpm --silent rimraf ${X}`, `pnpm --silent x rimraf ${X}`]) {
  console.log(`${[has(c60, command), has(c87, command), has(proto, command)].join(' / ')} (c60 / c87 / prototype) | ${command}`);
}

// 3. A seeded fuzz, prototype against both older hooks.
section('3. fuzz, prototype against C60 and C87');
let seed = 20261104;
const rnd = n => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
const alphabet = ['npm', 'npx', 'pnpm', 'yarn', 'bun', 'pnpx', 'bunx', 'corepack', 'env', '/usr/bin/env', 'sudo', 'exec', 'x', 'dlx', 'run', 'workspace', 'rimraf', 'shx', 'rm', 'cat', 'bash', 'sh', 'python', 'node', 'eval', '-c', '-e', '--call', "--call='rm a.b'", '--call=', '--package', '-p', '-C', '-iC', '-u', '-S', '-iS', '--split-string', "--split-string='rm a.b'", '--unset', '--chdir', '--', '-', '--prefix', '-w', '--workspace', '--filter', '-F', '--dir', '--cwd', '--loglevel', '--silent', "'rm a.b'", '"rm a.b"', "'", '"', '\\"', '\\\\\\"', '`"', '`', ';', '&&', '|', "open('a.b','w')", "open('a.b',", 'open(', "Path('a.b').open('w')", "[IO.File]::Open('a.b','Create')", "'a.b'", 'a.b', 'docs', 'docs/a.b', '**dict(', "*['w']", "**{'mode':'w'}", 'npm.cmd', 'npx.cmd', 'rm.cmd', '.'];
const lost = { c60: new Map(), c87: new Map() };
let thrown = 0, slowest = 0;
for (let i = 0; i < 60000; i++) {
  const command = Array.from({ length: 1 + rnd(7) }, () => alphabet[rnd(alphabet.length)]).join(rnd(6) ? ' ' : '');
  const t0 = performance.now();
  let after;
  try { after = proto.shellWriteTargets(fx, command, fx); } catch (e) { thrown++; console.log(`THROW ${JSON.stringify(command)} ${e.message.slice(0, 60)}`); continue; }
  slowest = Math.max(slowest, performance.now() - t0);
  for (const [name, hook] of [['c60', c60], ['c87', c87]]) {
    let before;
    try { before = hook.shellWriteTargets(fx, command, fx); } catch { continue; }
    const gone = before.filter(t => !after.includes(t) && !/['"]/.test(t));
    if (gone.length) lost[name].set(command, gone);
  }
}
console.log(`60000 commands: exceptions ${thrown}; slowest ${Math.round(slowest)} ms; lost a target: against C60 ${lost.c60.size}, against C87 ${lost.c87.size}`);
for (const name of ['c60', 'c87']) for (const [command, gone] of [...lost[name]].sort((a, b) => a[0].length - b[0].length).slice(0, 25)) console.log(`  ${name} ${JSON.stringify(gone.slice(0, 2))} for ${JSON.stringify(command)}`);

// 4. The impact claimed for F2, on the real entry points of the hook, not on shellWriteTargets alone.
section('4. F2 on evaluateHook and governanceIndependenceErrors');
const folders = Array.from({ length: 200 }, (_, i) => `cd d${i}`).join('; ');
const command = `${folders}; python -c "system('${'open('.repeat(2000)}')"`;
const transcript = [{ type: 'assistant', message: { content: [{ type: 'tool_use', id: 's0', name: 'Bash', input: { command } }] } }, { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 's0', content: 'output' }] } }].map(line => JSON.stringify(line)).join('\n');
const contract = { version: 1, stage: 'reviewed', kind: 'governance', scope: [X] };
for (const [name, hook] of [['c60', c60], ['c87', c87], ['prototype', proto]]) {
  let t0 = performance.now();
  hook.evaluateHook(fx, { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', cwd: fx, tool_input: { command } }, '');
  const pre = Math.round(performance.now() - t0);
  t0 = performance.now();
  hook.governanceIndependenceErrors(fx, contract, 'tasks/gov_kickoff.security.json', transcript);
  console.log(`${name}: evaluateHook PreToolUse ${pre} ms; governanceIndependenceErrors ${Math.round(performance.now() - t0)} ms`);
}
rmSync(fx, { recursive: true, force: true });
