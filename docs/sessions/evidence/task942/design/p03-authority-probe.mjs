// Task 942 design probe (Opus designer, 2026-11-01): the two outer layers that GOV-942-HOOK-EXECUTOR-DENY and
// GOV-942-CI-POLICY-DENY map. (1) the real pre-write guard `evaluateHook` refuses a Sonnet Edit of the gate script and
// allows the same Edit for Opus; (2) the real CI `validateDiff` refuses a changed gate script that no governance contract
// scopes. Uses temporary fixture roots only; writes nothing in the repository except its own output, which the caller
// redirects. Usage (repo root): node docs/sessions/evidence/task942/design/p03-authority-probe.mjs
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { evaluateHook } = await import(new URL('../../../../../scripts/workflow-gates/security-hook.mjs', import.meta.url).href);
const { validateDiff } = await import(new URL('../../../../../scripts/workflow-gates/cli.mjs', import.meta.url).href);
const file = 'scripts/check-listing-visibility.mjs';
const root = mkdtempSync(join(tmpdir(), 'task942-auth-'));
let ok = true;
try {
  mkdirSync(join(root, 'scripts'), { recursive: true });
  mkdirSync(join(root, 'tasks'), { recursive: true });
  writeFileSync(join(root, file), 'export const changed = true;\n');
  const event = { hook_event_name: 'PreToolUse', tool_name: 'Edit', model: 'sonnet', tool_input: { file_path: file } };
  const sonnet = evaluateHook(root, event, '').join('\n');
  const opus = evaluateHook(root, { ...event, model: 'opus' }, '');
  console.log(`platform ${process.platform}; node ${process.version}`);
  console.log(`evaluateHook sonnet Edit ${file}: ${sonnet.slice(0, 120)}`);
  console.log(`evaluateHook opus Edit ${file}: ${JSON.stringify(opus)}`);
  ok = ok && /POLICY-EDIT AUTHORITY/.test(sonnet) && opus.length === 0;
  const result = validateDiff(root, [file], { phase: 'verify' });
  console.log(`validateDiff errors: ${JSON.stringify(result.errors)}`);
  ok = ok && result.errors.some(e => e.includes('outside every changed governance contract scope'));
} finally { rmSync(root, { recursive: true, force: true }); }
console.log(ok ? 'AUTHORITY PROBE PASSED' : 'AUTHORITY PROBE FAILED');
process.exitCode = ok ? 0 : 1;
