// Task 945 design: each command the registry will hold, on this tree, with a real file. Read-only: no command here writes.
// Run from the project root: node docs/sessions/evidence/task945/design/p05-registry-commands.mjs
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const eslint = 'node node_modules/eslint/bin/eslint.js --quiet';
const tsc = 'node node_modules/typescript/bin/tsc --noEmit --pretty false';
const vitest = 'node node_modules/vitest/vitest.mjs related';
const ts = 'src/lib/utils.ts', tsx = 'src/app/global-error.tsx', gate = 'scripts/check-listing-visibility.mjs', ps1 = '.claude/hooks/phase-write-gate.ps1', locale = 'messages/en.json';
const commands = [
  ['write, ts', `${eslint} ${ts}`], ['write, tsx', `${eslint} ${tsx}`], ['write, types of the whole project', tsc],
  ['write, script syntax', `node --check ${gate}`], ['write, script lint', `${eslint} ${gate}`], ['write, hook lint', `${eslint} scripts/workflow-gates/security-hook.mjs`],
  ['write, file integrity', `node scripts/check-file-integrity.mjs --files ${ts}`], ['write, mojibake', `node scripts/check-mojibake.mjs --files ${ts}`],
  ['write, PowerShell parse', `powershell -NoProfile -Command "$e=$null;[void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path '${ps1}'),[ref]$null,[ref]$e); if($e){$e;exit 1}"`],
  ['stop, tests of a shared util', `${vitest} ${ts} --run --passWithNoTests --reporter=dot`], ['stop, a file no test reaches', `${vitest} ${tsx} --run --passWithNoTests --reporter=default`],
  ['stop, design tokens', 'node scripts/check-design-tokens.mjs --strict'], ['stop, UI contract', 'node scripts/check-ui-contract.mjs'], ['stop, locale parity', 'node scripts/check-i18n-parity.mjs'],
  ['stop, gate suite', 'node scripts/workflow-gates/selftests.mjs'], ['stop, workflow settings', 'node scripts/workflow-gates/check-workflow.mjs'],
  ['locale JSON parses', `node -e "JSON.parse(require('fs').readFileSync('${locale}','utf8'))"`],
];
for (const [name, command] of commands) {
  const t0 = performance.now();
  const run = spawnSync(command, { shell: true, encoding: 'utf8', timeout: 300000, maxBuffer: 1 << 28 });
  const last = `${run.stdout || ''}\n${run.stderr || ''}`.split('\n').map(line => line.replace(/\u001b\[[0-9;]*m/g, '').trim()).filter(Boolean).at(-1) || '';
  console.log(`${name}: exit ${run.status}; ${Math.round(performance.now() - t0)} ms; ${last.replace(/[A-Za-z]:\\Users\\[^\\\s]+/g, '<user-home>').slice(0, 110)}`);
}
