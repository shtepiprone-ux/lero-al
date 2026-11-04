// Task 944 review 3 (approver): breaks chosen by this review, beyond the four recorded ones. Each break exists only in the memory
// of its test process through the candidate's sensitivity-register.mjs; no file of the task scope is written. The specs live in
// the gitignored test-results/944-r3/. Usage (project root): node docs/sessions/evidence/task944/review/r3-mutants.mjs
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const G = 'scripts/workflow-gates';
const OUT = resolve(ROOT, 'test-results/944-r3');
mkdirSync(OUT, { recursive: true });
const REGISTER = pathToFileURL(resolve(ROOT, `${G}/sensitivity-register.mjs`)).href;
const contract = JSON.parse(readFileSync(resolve(ROOT, 'tasks/Archive/Sprint_92_kickoff_prompt_Task_944_Sensitivity_Breaks_Only_In_Memory.security.json'), 'utf8'));
const sha = file => createHash('sha256').update(readFileSync(resolve(ROOT, file))).digest('hex');
const CLI = `${G}/cli.mjs`, CONTRACT = `${G}/contract.mjs`, HOOK = `${G}/security-hook.mjs`, HOOKS = `${G}/sensitivity-hooks.mjs`;
const MUTANTS = [
  ['R1 (d) live-file check dropped', CLI, "if (before.target !== after.target || before.test !== after.test) return refuse('a live file changed during the run');", '', 'GOV-944-SENS-LIVE-ERROR'],
  ['R1 (b) exactly-once check dropped', CLI, 'if (count !== 1) return refuse(', 'if (false) return refuse(', 'GOV-944-SENS-RUN-DENY'],
  ['R1 (b) replace-equals-find dropped', CLI, "if (replace === find) return refuse('replace equals find');", '', 'GOV-944-SENS-RUN-DENY'],
  ['R1 (b) test file as target dropped', CLI, 'if (spec.target === row.testFile) return refuse(', 'if (false) return refuse(', 'GOV-944-SENS-RUN-DENY'],
  ['R1 (b) scope/inputs check dropped', CLI, 'if (!scope.includes(spec.target) && !inputs.includes(spec.target)) return refuse(', 'if (false) return refuse(', 'GOV-944-SENS-RUN-DENY'],
  ['R1 (b) evidence-tree check dropped', CLI, "if (typeof breakPath !== 'string' || !isEvidencePath(breakPath)) return refuse(", 'if (false) return refuse(', 'GOV-944-SENS-RUN-DENY'],
  ['R1 (b) governance-only check dropped', CLI, "if (contract?.kind !== 'governance') return refuse(", 'if (false) return refuse(', 'GOV-944-SENS-RUN-DENY'],
  ['R1 (f) record appended, not replaced', CLI, 'sensitivity.cases = index === -1 ? [...sensitivity.cases, record]', 'sensitivity.cases = true ? [...sensitivity.cases, record]', 'GOV-944-SENS-RUN-ALLOW'],
  ['R2 method check dropped', CONTRACT, "if (record?.method !== 'in-memory') return fail('method is not in-memory');", '', 'GOV-944-VAL-RECORD-DENY'],
  ['R2 evidence-path check dropped', CONTRACT, "if (typeof record.break !== 'string' || !isEvidencePath(record.break)) return fail(", 'if (false) return fail(', 'GOV-944-VAL-RECORD-DENY'],
  ['R2 stale break digest dropped', CONTRACT, 'if (record.breakSha256 !== digest(root, [record.break])) return fail(', 'if (false) return fail(', 'GOV-944-VAL-RECORD-DENY'],
  ['R2 case match dropped', CONTRACT, 'if (spec?.case !== id) return fail(', 'if (false) return fail(', 'GOV-944-VAL-RECORD-DENY'],
  ['R2 legacy list emptied', CONTRACT, "  'tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.md',\n", '', 'GOV-944-VAL-RECORD-ALLOW'],
  ['R3 (b) CRLF normalization dropped', HOOK, "const lineFeeds = text => String(text).replace(/\\r\\n/g, '\\n');", 'const lineFeeds = text => String(text);', 'GOV-944-HOOK-SYNTAX-DENY'],
  ['R3 (b) CommonJS branch dropped', HOOK, 'const checkOnly = commonjs(target);', 'const checkOnly = false;', 'GOV-944-HOOK-SYNTAX-DENY'],
  ['R3 (b) load result ignored', HOOK, "if (child.status === 0 && (checkOnly || String(child.stdout).trim() === 'linked')) return null;", 'return null;', 'GOV-944-HOOK-SYNTAX-DENY'],
  ['R3 (a) ps1 names dropped', HOOK, 'if (typeof text === \'string\') for (const match of text.matchAll(PS1_SCRIPT)) named.push(match[0]);', '', 'GOV-944-HOOK-SYNTAX-DENY'],
  ['R3 (a) imports not followed', HOOK, 'for (const match of String(text).matchAll(MODULE_SPECIFIER)) queue.push(relativeTo(resolve(base, dirname(file), match[2])));', '', 'GOV-944-HOOK-SYNTAX-DENY'],
  ['R3 role order: guard only for orchestrator', HOOK, 'const syntax = hookModuleSyntaxErrors(root, event);', "const syntax = role === 'orchestrator' ? hookModuleSyntaxErrors(root, event) : [];", 'GOV-944-HOOK-SYNTAX-DENY'],
  ['R3 (b) absent old_string falls through', HOOK, 'if (!before || after === null || !current.includes(before)) return [`HOOK MODULE SYNTAX: ${target}: old_string not found, the result cannot be checked`];', '', 'GOV-944-HOOK-CLOSURE-ERROR'],
  ['R3 (c) guard error rethrown', HOOK, 'return [`HOOK MODULE SYNTAX: guard error (${String(error?.message ?? error).split(\'\\n\')[0]})`];', 'throw error;', 'GOV-944-HOOK-CLOSURE-ERROR'],
  ['R8 (a) folder change after keyword dropped', HOOK, "      let lead = 0;\n      while (SHELL_KEYWORD.test(texts[lead] || '')) lead++;", '      let lead = 0;', 'GOV-944-HOOK-SHELL-FORMS-DENY'],
  ['R8 (a) env -C dropped', HOOK, 'if (movedFolder(value)) folder = resolve(folder, spelling(value));\n  }\n  const program', '}\n  const program', 'GOV-944-HOOK-SHELL-FORMS-DENY'],
  ['R8 (b) clustered flag dropped', HOOK, '(posix && /^-[A-Za-z]*c[A-Za-z]*$/.test(word))', 'false', 'GOV-944-HOOK-SHELL-FORMS-DENY'],
  ['R8 (b) -- after the flag kept', HOOK, "return (posix && rest[0] === '--' ? rest.slice(1) : rest).join(' ');", "return rest.join(' ');", 'GOV-944-HOOK-SHELL-FORMS-DENY'],
  ['R8 (c) read mode counted as write', HOOK, '.filter(m => /[wax+]/.test(m[3]))', '', 'GOV-944-HOOK-SHELL-FORMS-DENY'],
  ['R8 (c) .NET create dropped', HOOK, '...[...text.matchAll(API_CREATE)].map(m => m[1])', '', 'GOV-944-HOOK-SHELL-FORMS-DENY'],
  ['R8 (c) pathlib change dropped', HOOK, '...[...text.matchAll(API_PATHLIB_CHANGE)].flatMap(m => (m[2] ? [m[1], m[3]] : [m[1]])), ', '', 'GOV-944-HOOK-SHELL-FORMS-DENY'],
  ['R8 (c) directory walk dropped', HOOK, 'for (const raw of apiDirectories(command)) underIn(raw, folders);', '', 'GOV-944-HOOK-SHELL-FORMS-DENY'],
  ['R8 (d) xcopy/robocopy dropped', HOOK, "if (program === 'xcopy' || program === 'robocopy') {", 'if (false) {', 'GOV-944-HOOK-SHELL-FORMS-DENY'],
  ['R8 (d) perl script handling dropped', HOOK, "if ((perl ? 'eE' : 'efl').includes(arg[j])) {", "if ('efl'.includes(arg[j]) && !perl) {", 'GOV-944-HOOK-SHELL-FORMS-DENY'],
  ['R8 (e) literal rule back to any quoted occurrence', HOOK, 'for (const word of unquotedWords) LITERAL_WORDS.delete(word);', '', 'GOV-944-HOOK-SHELL-FORMS-DENY'],
  ['R8 (f) .promises qualifier dropped', HOOK, String.raw`\]::|\)\.(?:promises\.)?)` + '`;', String.raw`\]::|\)\.)` + '`;', 'GOV-944-HOOK-SHELL-FORMS-DENY'],
  ['R1 (e) load hook replaces nothing', HOOKS, 'source: source.replace(spec.find, () => spec.replace)', 'source', 'GOV-944-SENS-RUN-ALLOW'],
];
const before = Object.fromEntries([CLI, CONTRACT, HOOK, HOOKS].map(file => [file, sha(file)]));
let index = 0, unexpected = 0;
for (const [name, target, find, replace, id] of MUTANTS) {
  index++;
  const row = contract.cases.find(c => c.id === id);
  const live = readFileSync(resolve(ROOT, target), 'utf8').replace(/\r\n/g, '\n');
  const count = live.split(find).length - 1;
  if (count !== 1) { console.log(`#${index} SPEC-ERROR ${name}: find occurs ${count} times`); unexpected++; continue; }
  const spec = resolve(OUT, `m${index}.json`);
  writeFileSync(spec, JSON.stringify({ version: 1, case: id, target, find, replace }));
  const escaped = row.testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const env = { ...process.env, NODE_ENV: 'test', NODE_OPTIONS: `--import=${REGISTER}`, SENSITIVITY_BREAK: spec };
  // R1 (e): the load hook's own break must run in the outer test process too, so only the named test file is selected.
  const child = spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=^${escaped}$`, row.testFile],
    { cwd: ROOT, env, encoding: 'utf8', timeout: 300000, maxBuffer: 64 * 1024 * 1024 });
  const named = (child.stdout || '').split(/\r?\n/).filter(line => /^(not ok|ok) \d+ - /.test(line) && line.includes(`[${id}]`));
  const failed = named.some(line => line.startsWith('not ok'));
  const assertion = /code: 'ERR_ASSERTION'/.test(child.stdout || '');
  const error = /^\s*error: (.*)$/m.exec(child.stdout || '')?.[1];
  const verdict = failed && assertion ? 'KILLED' : failed ? 'FAILED-NO-ASSERTION' : 'SURVIVED';
  if (verdict !== 'KILLED') unexpected++;
  console.log(`#${index} ${verdict} ${name} -> ${id} (exit ${child.status}): ${String(error ?? '').slice(0, 160)}`);
}
const after = Object.fromEntries(Object.keys(before).map(file => [file, sha(file)]));
console.log(`live digests unchanged: ${JSON.stringify(before) === JSON.stringify(after)}`);
console.log(`${MUTANTS.length} mutants; not killed by an assertion: ${unexpected}`);
