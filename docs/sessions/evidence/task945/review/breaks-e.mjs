// Task 945 independent review: does the executor role reach AGENTS.md, and do the three product holes named by the report hold when broken in memory.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('.');
const T = 'scripts/workflow-gates';
const section = process.argv[2];
if (section === 'agents') {
  const { evaluateHook } = await import(pathToFileURL(join(ROOT, T, 'security-hook.mjs')).href);
  for (const file of ['AGENTS.md', 'CLAUDE.md', '.claude/rules/shared/secure-code-review.md', 'scripts/workflow-gates/code-check.json', 'scripts/workflow-gates/mutation-loader.mjs', 'scripts/workflow-gates/audit-baseline.json']) {
    const refused = evaluateHook(ROOT, { hook_event_name: 'PreToolUse', tool_name: 'Edit', model: 'sonnet', tool_input: { file_path: file, old_string: 'a', new_string: 'b' } }, '');
    console.log(file, '=>', refused.length ? `REFUSED: ${refused.join(' ').slice(0, 110)}` : 'ALLOWED');
  }
}
if (section === 'holes') {
  const LOADER = pathToFileURL(join(ROOT, T, 'mutation-loader.mjs')).href;
  const OUT = join(ROOT, 'test-results/task945-review/out');
  mkdirSync(OUT, { recursive: true });
  const holes = [
    ['contactEvents lookup failure returns undefined', 'src/modules/listings/actions/contactEvents.ts', "console.error('[contactEvents] listing lookup failed', { code: listingError.code, listingId })\n      return { ok: false, reason: 'insert_failed' }", "console.error('[contactEvents] listing lookup failed', { code: listingError.code, listingId })\n      return undefined"],
    ['contactEvents unexpected error returns undefined', 'src/modules/listings/actions/contactEvents.ts', "console.error('[contactEvents] unexpected error', err)\n    return { ok: false, reason: 'insert_failed' }", "console.error('[contactEvents] unexpected error', err)\n    return undefined"],
    ['rate limit: only error AND null refuses', 'src/modules/listings/actions/submitListingInquiry.ts', 'if (result.error || result.count === null || result.count === undefined) {', 'if (result.error && result.count === null || result.count === undefined) {'],
  ];
  for (const [name, file, find, replacement] of holes) {
    const raw = readFileSync(join(ROOT, file), 'utf8');
    const text = raw.includes('\r\n') ? find.replaceAll('\n', '\r\n') : find;
    const value = raw.includes('\r\n') ? replacement.replaceAll('\n', '\r\n') : replacement;
    const start = raw.indexOf(text);
    if (start < 0) { console.log('NOT PLACED', name); continue; }
    const report = join(OUT, 'hole.log');
    rmSync(report, { force: true });
    const env = { ...process.env, NODE_OPTIONS: `--import=${LOADER}`, CODE_CHECK_MUTANT: JSON.stringify({ key: resolve(ROOT, file).replaceAll('\\', '/').toLowerCase(), start, end: start + text.length, original: text, replacement: value, report }) };
    const run = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'related', file, '--run', '--allowOnly=false', '--reporter=dot', '--config', `${T}/mutation-vitest.config.mjs`], { cwd: ROOT, env, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 280000, windowsHide: true });
    const applied = existsSync(report) && readFileSync(report, 'utf8').includes('applied');
    rmSync(report, { force: true });
    console.log(`${run.status === 0 ? 'SURVIVED every related test' : `caught (exit ${run.status})`}, applied ${applied}: ${name}`);
  }
}
