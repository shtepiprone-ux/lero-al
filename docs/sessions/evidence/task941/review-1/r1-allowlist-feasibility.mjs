#!/usr/bin/env node
// Task 941 review 1, third self-check (2026-11-02): feasibility of the revision 1 R1 (a) character allowlist.
// A reviewer prototype of the revision 1 allowlist part of R1 (a) only (the unchanged whole-string checks for backtick,
// `$(`, `<(`, `>(` and `<<` stay in force on top of it), not the implementation: it shows that every AC1 command and every read-only
// redirection variant still passes (a), and which bypass forms (a) rejects; the rest must be rejected by R1 (d). Since the fifth
// self-check it also models the R1 (d) argument allowlist of rg, sed and git (not the backslash dual view of (d)).
// Usage (repo root): node docs/sessions/evidence/task941/review-1/r1-allowlist-feasibility.mjs
const OUTSIDE = /^[A-Za-z0-9 \t\r\n\-_./:=,+%~;|&<>*?[\]\\]$/;
function passesA(command) {
  if (typeof command !== 'string' || /[‘-„]/.test(command) || /\\['"]/.test(command)) return false;
  let quote = '';
  for (const ch of command) {
    if (quote === "'") { if (ch === "'") quote = ''; continue; }
    if (quote === '"') { if (ch === '"') quote = ''; else if (ch === '$' || ch === '`' || ch === '\\') return false; continue; }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (!OUTSIDE.test(ch)) return false;
  }
  if (quote) return false;
  return !command.split(/[\s;|&]+/).includes('--%');
}
const X = 'scripts/workflow-gates/example.mjs', Y = 'scripts/workflow-gates/reader.mjs';
const mustPass = [
  "grep -n -i -E 'writeFileSync|Set-Content|Out-File' scripts/workflow-gates/security-hook.mjs | head -30",
  "grep -n 'writeFileSync' scripts/workflow-gates/cli.mjs; sed -n '60,70p' .claude/rules/review/03-decision-closure.md",
  "Select-String -Pattern 'Set-Content' -Path scripts/workflow-gates/security-hook.mjs",
  "grep -n -E 'Set-Content|echo injected > src/profile.ts' scripts/workflow-gates/diff-hook.selftest.mjs",
  'git diff -- scripts/workflow-gates/cli.mjs',
  "sed -n '1,5p' scripts/workflow-gates/cli.mjs",
  "Get-Content scripts/workflow-gates/cli.mjs | Select-String -Pattern 'Set-Content'",
  "Get-Content scripts\\workflow-gates\\cli.mjs | Select-String -Pattern 'Set-Content'",
  "grep -n '#.*writeFileSync' scripts/workflow-gates/cli.mjs",
  `sed -n '1,$p' ${Y}`,
  `grep -n 'Set-Content' ${Y} 2>&1 > docs/out.txt`,
  `grep -n 'a' ${Y} > ${X}`, `grep -n 'a' ${Y} >> ${X}`, `grep -n 'a' ${Y} 2> "${X}"`, `grep -n 'a' ${Y} >&${X}`,
  `cat ${Y} <>${X}`, `Get-Content ${Y} *> '${X}'`, `grep -n 'a' ${Y} > /c/Claude_Code_Projects/lero-al/${X}`,
];
const mustFailA = [
  `cat README.md # '\necho x > ${X} # '`,
  `Get-Content README.md <# ' #> ; Set-Content '${X}' 'x' <# ' #>`,
  `rg $'--pre' 'x' 'writeFileSync' ${X}`,
  `git log $'--output=${X}'`,
  `cat --output=${X}; git log -1 "$_"`,
  `head -i; sed -n 1p "$_" ${X}`,
  `git log --% -1 '\nSet-Content '${X}' 'x'; git log --% -1 '`,
  `git log --% -1 %OPT% -- ${X}`,
  `Get-Content opts.txt -OutVariable v; git log -1 @v -- ${X}`,
  `cat '\\044\\050touch ${X}\\051'; grep -c zzz "\${_@P}"`,
  `grep -n 'writeFileSync' ${Y} > $PWD/${X}`,
  `Select-String -Pattern 'a' -Path ${Y} > $pwd\\${X.replaceAll('/', '\\')}`,
];
const needD = [`rg --pr\\e 'x' 'writeFileSync' ${X}`, `git log --out\\put=${X} -S writeFileSync`, 'sed -n 1p *', `rg a *pre=x 'writeFileSync' ${X}`,
  // Fifth self-check (same day): quoted glob, quoted brace list and inner quotes that a program started from PowerShell reads again.
  `sed -n 1p '*' 'writeFileSync' ${X}`, `sed -n 1p '{-i,${X}}' 'writeFileSync'`, `sed -n 1p '"-i"' 'writeFileSync' ${X}`,
  `sed -n 1p "'-i'" 'writeFileSync' ${X}`, `git log -1 '--out"put"=${X}' -S writeFileSync`];
needD.push(`sed -n 1p '@opts.txt' 'writeFileSync' ${X}`);
// Fifth self-check: prototype of the revision 1 R1 (d) argument allowlist for rg, sed and git only (not the backslash dual
// view): every argument, read as the shell reads it (a quote inside the other kind of quoted span is kept), uses only these.
const ARG = /^[A-Za-z0-9 \-_./:=,+%|$\\~^]*$/;
function words(command) {
  const commands = [[]]; let word = null; let quote = '';
  const end = () => { if (word !== null) commands.at(-1).push(word); word = null; };
  for (const ch of command) {
    if (quote) { if (ch === quote) quote = ''; else word += ch; continue; }
    if (ch === "'" || ch === '"') { quote = ch; word ??= ''; continue; }
    if (/[;|&\n]/.test(ch)) { end(); commands.push([]); continue; }
    if (/\s/.test(ch)) { end(); continue; }
    word = (word ?? '') + ch;
  }
  end();
  return commands.filter((c) => c.length);
}
const passesD = (command) => words(command).every(([name, ...args]) =>
  !['rg', 'sed', 'git'].includes(name.toLowerCase()) || args.every((a) => /[<>]/.test(a) || ARG.test(a)));
let wrong = 0;
for (const c of mustPass) { const ok = passesA(c) && passesD(c); wrong += !ok; console.log(`must pass (a) and (d): ${ok ? 'PASS' : 'FAIL'} | ${JSON.stringify(c)}`); }
for (const c of mustFailA) { const ok = !passesA(c); wrong += !ok; console.log(`rejected by (a): ${ok ? 'PASS' : 'FAIL'} | ${JSON.stringify(c)}`); }
for (const c of needD) {
  const glob = c === 'sed -n 1p *' || c.startsWith('rg a *pre');
  // The two backslash forms need the dual view of (d), which this prototype does not model; they are only listed.
  const backslash = c.includes('\\');
  const ok = passesA(c) && (backslash || !passesD(c));
  if (!backslash) wrong += !ok;
  console.log(`passes (a), ${backslash ? 'left to the backslash dual view of (d)' : `rejected by the (d) allowlist${glob ? ' (unquoted glob)' : ''}`}: ${ok ? 'PASS' : 'FAIL'} | ${JSON.stringify(c)}`);
}
console.log(`unexpected results: ${wrong}`);
process.exitCode = wrong ? 1 : 0;
