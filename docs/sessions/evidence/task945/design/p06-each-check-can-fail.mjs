// Task 945 design: a check that cannot fail proves nothing. Each registry command is run on a bad input that exists only in gitignored test-results or on stdin.
// Run from the project root: node docs/sessions/evidence/task945/design/p06-each-check-can-fail.mjs
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const work = 'test-results/task945-probe';
mkdirSync(work, { recursive: true });
const eslint = 'node node_modules/eslint/bin/eslint.js --quiet';
const stdin = (file, text) => spawnSync(`${eslint} --stdin --stdin-filename ${file}`, { shell: true, input: text, encoding: 'utf8' });
const show = (name, run) => console.log(`${name}: exit ${run.status}; ${`${run.stdout || ''}\n${run.stderr || ''}`.split('\n').map(line => line.replace(/\u001b\[[0-9;]*m/g, '').trim()).filter(Boolean).slice(-3)[0]?.slice(0, 120) || ''}`);
show('eslint is applied to src, a syntax error', stdin('src/lib/probe-945.ts', 'const = ;\n'));
show('eslint is applied to src tsx, a syntax error', stdin('src/lib/probe-945.tsx', 'export const a = <div>;\n'));
show('eslint is applied to a gate script, a syntax error', stdin('scripts/workflow-gates/probe-945.mjs', 'const = ;\n'));
show('eslint is applied to a check script, a syntax error', stdin('scripts/probe-945.mjs', 'const = ;\n'));
const scan = spawnSync(`${eslint} --print-config scripts/workflow-gates/security-hook.mjs`, { shell: true, encoding: 'utf8' });
console.log(`a gate script has a resolved eslint config: exit ${scan.status}; ${scan.stdout.length > 100 ? 'config returned' : 'no config'}`);
writeFileSync(`${work}/nul.ts`, 'a\0b\n');
show('file integrity, a NUL byte', spawnSync(`node scripts/check-file-integrity.mjs --files ${work}/nul.ts`, { shell: true, encoding: 'utf8' }));
writeFileSync(`${work}/bad.ps1`, 'if ( {\n');
show('PowerShell parse, a broken script', spawnSync(`powershell -NoProfile -Command "$e=$null;[void][System.Management.Automation.Language.Parser]::ParseFile((Resolve-Path '${work}/bad.ps1'),[ref]$null,[ref]$e); if($e){$e[0].Message;exit 1}"`, { shell: true, encoding: 'utf8' }));
writeFileSync(`${work}/bad.json`, '{ not json');
show('locale JSON, a broken file', spawnSync(`node -e "JSON.parse(require('fs').readFileSync('${work}/bad.json','utf8'))"`, { shell: true, encoding: 'utf8' }));
const tokens = spawnSync('node scripts/check-design-tokens.mjs --strict', { shell: true, encoding: 'utf8' });
console.log(`design tokens at HEAD: exit ${tokens.status}; names src/components/shared/Map.module.css: ${tokens.stdout.includes('src/components/shared/Map.module.css')}; names src/lib/utils.ts: ${tokens.stdout.includes('src/lib/utils.ts')}`);
writeFileSync(`${work}/bad.mjs`, 'const = ;\n');
show('file integrity, a syntax error in a script', spawnSync(`node scripts/check-file-integrity.mjs --files ${work}/bad.mjs`, { shell: true, encoding: 'utf8' }));
writeFileSync(`${work}/bad-locale.json`, '{ not json');
show('file integrity, a broken JSON file', spawnSync(`node scripts/check-file-integrity.mjs --files ${work}/bad-locale.json`, { shell: true, encoding: 'utf8' }));
rmSync(work, { recursive: true, force: true });
const related = spawnSync('node node_modules/vitest/vitest.mjs related src/app/global-error.tsx --run --passWithNoTests --reporter=dot', { shell: true, encoding: 'utf8' });
console.log(`vitest related, dot reporter, a file no test reaches: exit ${related.status}; says No test files found: ${/No test files found/.test(`${related.stdout}${related.stderr}`)}`);
const contract = spawnSync('node scripts/check-ui-contract.mjs --verify-gate', { shell: true, encoding: 'utf8' });
console.log(`UI contract gate, its own verify: exit ${contract.status}; ${`${contract.stdout}${contract.stderr}`.split('\n').filter(Boolean).at(-1)?.slice(0, 110)}`);
