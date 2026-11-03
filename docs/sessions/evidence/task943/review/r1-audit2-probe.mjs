// Task 943 review 1, second self-audit: nested shells and evaluators whose command text makes the whole command
// parser-rejected (a `$` inside the quoted string), against the revision 4 prototype built by design/p15-run.mjs
// (test-results/task943-r4/security-hook.mjs). Run from the project root after p15-run.mjs:
//   node docs/sessions/evidence/task943/review/r1-audit2-probe.mjs
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const hookPath = process.argv[2] || join(process.cwd(), 'test-results/task943-r4/security-hook.mjs');
const proto = await import(pathToFileURL(hookPath).href);
const root = mkdtempSync(join(tmpdir(), 'audit2-'));
try {
  for (const f of ['scripts/check-example.mjs', 'package.json', 'docs/y.mjs', 'src/app/[locale]/page.tsx', 'AGENTS.md']) { mkdirSync(dirname(join(root, f)), { recursive: true }); writeFileSync(join(root, f), 'a\n'); }
  const ev = (command, tool) => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, tool_input: { command } });
  const rows = [
    ['Bash', 'bash -c "rm package.json $y"'],
    ['Bash', 'bash -c "cp docs/y.mjs scripts/check-example.mjs $y"'],
    ['Bash', 'bash -c "cd scripts; rm check-example.mjs; echo $y"'],
    ['PowerShell', 'powershell -Command "Remove-Item package.json; $x = 1"'],
    ['Bash', 'eval "rm package.json $y"'],
    ['Bash', 'sh -c "cd scripts && rm check-example.mjs $y"'],
    ['PowerShell', 'iex "Copy-Item docs/y.mjs scripts/check-example.mjs; $x"'],
    ['Bash', 'cmd /c "del package.json & echo %x%"'],
    ['Bash', 'rm package.json $y'],
    ['Bash', 'cp docs/y.mjs scripts/check-example.mjs $y'],
    // Script blocks: the program word of the lenient part is the block's caller, not the write program.
    ['PowerShell', 'Invoke-Command -ScriptBlock { Remove-Item package.json }'],
    ['PowerShell', 'Get-Item docs/y.mjs | ForEach-Object { Copy-Item $_ scripts/check-example.mjs }'],
    ['PowerShell', '. { Remove-Item package.json }'],
    ['PowerShell', '& { Set-Content package.json $x }'],
    ['PowerShell', 'Start-Job { Remove-Item package.json }'],
    // Common writers outside the section 5 table of revision 3.
    ['Bash', 'npx prettier --write scripts/check-example.mjs'],
    ['Bash', 'npx eslint --fix scripts'],
    ['Bash', 'npm install left-pad'],
    ['Bash', 'tar -xzf docs/y.tgz -C scripts'],
    ['Bash', 'unzip -o docs/y.zip -d scripts'],
    ['PowerShell', 'Expand-Archive -Path docs/y.zip -DestinationPath scripts -Force'],
    ['PowerShell', 'Get-Process | Export-Csv -Path package.json'],
    // Third self-audit: downloads, remote copies, npm manifest edits and child-process strings.
    ['Bash', 'curl -sSL -o package.json https://example.test/x'],
    ['Bash', 'wget -q -O scripts/check-example.mjs https://example.test/x'],
    ['PowerShell', 'Invoke-WebRequest -Uri https://example.test/x -OutFile package.json'],
    ['Bash', 'scp host:/tmp/x scripts/check-example.mjs'],
    ['Bash', 'npm pkg set name=x'],
    ['Bash', 'npm version patch --no-git-tag-version'],
    ['Bash', `node -e "require('child_process').execSync('rm package.json')"`],
    ['Bash', `python -c "import subprocess; subprocess.run(['rm', 'package.json'])"`],
    // A quoted path with brackets in a parser-rejected command is a literal target.
    ['Bash', 'rm "src/app/[locale]/page.tsx" $y'],
    // Controls that must stay allowed: a quoted `*` in a sed script is no glob of the root; an absolute --prefix outside the root.
    ['Bash', 'sed -i "s#import * as R#x#" docs/y.mjs; echo $y'],
    ['Bash', `npm install left-pad --prefix ${tmpdir().replaceAll('\\', '/')}/elsewhere; echo $y`],
    // Controls that must stay allowed: read-only work in script blocks and prose naming a write program.
    ['Bash', 'npx prettier --check scripts/check-example.mjs'],
    ['Bash', 'npx eslint scripts'],
    ['Bash', 'npm run build'],
    ['Bash', 'tar -tzf docs/y.tgz'],
    ['Bash', 'curl -sS https://example.test/x'],
    ['Bash', 'scp scripts/check-example.mjs host:/tmp/x'],
    ['Bash', 'npm pkg get name'],
    ['Bash', `node -e "require('child_process').execSync('git status')"`],
    ['PowerShell', 'Get-ChildItem docs | ForEach-Object { Get-Content $_.FullName }'],
    ['PowerShell', 'Invoke-Command -ScriptBlock { Get-Content package.json }'],
    ['Bash', 'grep -n "rm -rf build" docs/y.mjs; echo $HOME'],
  ];
  for (const [tool, command] of rows) {
    const refusal = proto.evaluateHook(root, ev(command, tool), '').map(e => e.split(':')[0]);
    console.log(`${refusal.length ? 'REFUSED' : 'ALLOWED'} :: ${command} :: ${JSON.stringify(refusal)} :: targets ${JSON.stringify(proto.shellWriteTargets(root, command))}`);
  }
} finally { rmSync(root, { recursive: true, force: true }); }
