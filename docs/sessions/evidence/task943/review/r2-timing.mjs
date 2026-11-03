// Review 2: AC15 timings on the real project root (F5) and the 5000-folder-change commands (F8).
import { pathToFileURL } from 'node:url';
const root = process.argv[2];
const hook = await import(pathToFileURL(`${root}/scripts/workflow-gates/security-hook.mjs`).href);
const time = (label, fn) => { const t = performance.now(); const r = fn(); console.log(`${label}: ${Math.round(performance.now() - t)} ms | ${r.length} results`); };
for (const command of ['rm -rf docs', 'cp -r docs backup/']) {
  time(`F5 evaluateHook without a role: ${command}`, () => hook.evaluateHook(root, { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } }, ''));
}
for (const [name, command] of [['parsed', `${Array.from({ length: 5000 }, (_, i) => `cd d${i}`).join('; ')}; echo y > z`],
  ['parser-rejected', `${Array.from({ length: 5000 }, (_, i) => `cd d${i}`).join('; ')}; echo $y > z`]]) {
  time(`F8 shellWriteTargets ${name} (${command.length} chars)`, () => hook.shellWriteTargets(root, command));
}
