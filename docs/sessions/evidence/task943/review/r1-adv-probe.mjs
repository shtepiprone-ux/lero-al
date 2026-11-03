import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const hook = await import('../../../../../scripts/workflow-gates/security-hook.mjs');
const root = mkdtempSync(join(tmpdir(), 'r1-adv-'));
const X = 'scripts/workflow-gates/fixture-scope.mjs', Y = 'docs/y.mjs';
try {
  for (const f of [X, Y, 'scripts/check-example.mjs']) { mkdirSync(join(root, f, '..'), { recursive: true }); writeFileSync(join(root, f), 'a\n'); }
  const rows = process.env.ROWS ? JSON.parse(process.env.ROWS) : [
    `sed "-i" 's/a/b/' ${X}`,
    `sed "-i" 's/a/b/' ${X} '`,
    `sed '-i' 's/a/b/' ${X} "`,
    `find ${X} "-delete" '`,
    `bash -c 'cp ${Y} ${X}'`,
    `bash -c "rm -f ${X}"`,
    `sh -c 'sed -i s/a/b/ ${X}'`,
    `powershell -Command "Copy-Item ${Y} ${X}"`,
    `powershell -NoProfile -Command "Remove-Item ${X}"`,
    `pwsh -c "Set-Content ${X} x"`,
    `cmd /c "copy ${Y} ${X}"`,
    `cmd /d /c "del ${X}"`,
    `node -e "require('child_process').execSync('rm ${X}')"`,
  ];
  for (const command of rows) {
    const t = hook.shellWriteTargets(root, command);
    const ev = { hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', tool_input: { command: command.replace(X, 'scripts/check-example.mjs') } };
    console.log(`${t.includes(X) ? 'REPORTED' : 'MISSED  '} | readOnly=${hook.isReadOnlyShellCommand(command)} | ${command} | targets=${JSON.stringify(t)} | executor guard on check-example=${JSON.stringify(hook.evaluateHook(root, ev, '').map(e => e.split(':')[0]))}`);
  }
} finally { rmSync(root, { recursive: true, force: true }); }
