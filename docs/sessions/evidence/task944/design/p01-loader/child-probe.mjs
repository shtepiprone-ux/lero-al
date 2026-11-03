import { spawnSync } from 'node:child_process';
const r = spawnSync(process.execPath, ['--input-type=module', '-e', "const m = await import('file:///C:/Claude_Code_Projects/lero-al/scripts/workflow-gates/contract.mjs'); console.log('child sees', m.SENSITIVITY_PROBE ?? 'live')"], { encoding: 'utf8', env: { ...process.env } });
console.log(r.stdout.trim(), r.stderr.trim().slice(0, 200));
