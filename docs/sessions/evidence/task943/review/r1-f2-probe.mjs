import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const hook = await import('../../../../../scripts/workflow-gates/security-hook.mjs');
const root = mkdtempSync(join(tmpdir(), 'r1-f2-'));
try {
  mkdirSync(join(root, 'scripts'), { recursive: true }); writeFileSync(join(root, 'scripts/check-example.mjs'), 'a\n');
  const ev = (tool, input, cwd) => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: tool, ...(cwd ? { cwd } : {}), tool_input: input });
  const rows = [
    ['Bash relative, cwd scripts (AC13 control)', ev('Bash', { command: 'echo x > check-example.mjs' }, join(root, 'scripts'))],
    ['Write relative, cwd scripts', ev('Write', { file_path: 'check-example.mjs', content: 'x' }, join(root, 'scripts'))],
    ['Edit relative, cwd scripts', ev('Edit', { file_path: 'check-example.mjs', old_string: 'a', new_string: 'b' }, join(root, 'scripts'))],
    ['Write absolute (control)', ev('Write', { file_path: join(root, 'scripts/check-example.mjs'), content: 'x' }, join(root, 'scripts'))],
  ];
  for (const [name, event] of rows) console.log(`${name}: ${JSON.stringify(hook.evaluateHook(root, event, ''))}`);
} finally { rmSync(root, { recursive: true, force: true }); }
