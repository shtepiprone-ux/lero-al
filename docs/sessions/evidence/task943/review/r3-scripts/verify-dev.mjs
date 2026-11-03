// Task 943 approver (review 3, session e50584bc), AC7: `cli.mjs verify` of the 941 contract (no integration case, no identity)
// and of the 923 owner-fixes and 927 contracts with the approved development project identity (C51). As in the Task 923
// real-boundary runs, only NEXT_PUBLIC_SUPABASE_URL is read from .env.local and the ref is the project in that URL; no value is
// printed or kept. Each run is kept in docs/sessions/evidence/task943/review/r3-verify-<name>.txt.
// Usage (project root): node test-results/943-r3/verify-dev.mjs <941|923-owner-fixes|927> [<run label>]
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { release } from 'node:os';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const contracts = {
  '941': ['tasks/Archive/Sprint_92_kickoff_prompt_Task_941_Read_Only_Commands_Are_Not_Writes.security.json', false],
  '923-owner-fixes': ['tasks/Sprints/Sprint_78_Task_923_security_record_owner_fixes.security.json', true],
  '927': ['tasks/Sprints/Sprint_91_kickoff_prompt_Task_927_Google_Sign_In_Shows_Lero_Al.security.json', true],
};
const [name, label = ''] = process.argv.slice(2);
const [contract, identity] = contracts[name];
const env = { ...process.env };
let identityNote = 'no project identity (unit cases only)';
if (identity) {
  const line = readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).find(l => /^NEXT_PUBLIC_SUPABASE_URL=/.test(l));
  const url = line.slice('NEXT_PUBLIC_SUPABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
  env.NEXT_PUBLIC_SUPABASE_URL = url;
  env.SECURITY_TEST_PROJECT_REF = new URL(url).hostname.split('.')[0];
  env.SECURITY_TEST_TARGET = 'development';
  identityNote = 'development project identity from the .env.local Supabase URL (values not printed)';
}
const args = ['scripts/workflow-gates/cli.mjs', 'verify', '--contract', contract];
const started = new Date().toISOString();
const t = performance.now();
const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', env, maxBuffer: 256 * 1024 * 1024 });
const ms = Math.round(performance.now() - t);
const redact = text => (identity ? text.split(env.SECURITY_TEST_PROJECT_REF).join('<ref>') : text);
const out = [`# Task 943 review 3 (session e50584bc): verify ${name}${label ? ` ${label}` : ''}`,
  `platform ${process.platform} ${release()}; node ${process.version}; cwd ${ROOT}; started ${started}; ${ms} ms; ${identityNote}`,
  `command: node ${args.join(' ')}`, `exit ${r.status}`, '', '## stdout', redact(r.stdout || ''), '## stderr', redact(r.stderr || '')].join('\n');
writeFileSync(join(ROOT, 'docs/sessions/evidence/task943/review', `r3-verify-${name}${label ? `-${label}` : ''}.txt`), `${out}\n`);
console.log(`verify ${name}${label ? ` ${label}` : ''}: exit ${r.status} in ${ms} ms`);
