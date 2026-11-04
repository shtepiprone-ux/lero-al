// Task 945 design: the failing baseline of the unit tests, what `vitest related` does with no test, and how a real tsc sees a consumer. Read-only.
// Run from the project root: node docs/sessions/evidence/task945/design/p02-baseline.mjs
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const clean = text => text.replace(/\u001b\[[0-9;]*m/g, '').replace(/[A-Za-z]:\\Users\\[^\\\s]+/g, '<user-home>');
const sh = command => { const t0 = performance.now(); const r = spawnSync(command, { shell: true, encoding: 'utf8', timeout: 400000, maxBuffer: 1 << 28 }); return { status: r.status, ms: Math.round(performance.now() - t0), text: clean(`${r.stdout || ''}\n${r.stderr || ''}`) }; };

console.log('## 1. whole vitest: every failing identity');
const whole = sh('npx vitest run --reporter=default');
const failed = [...new Set(whole.text.split('\n').filter(line => /^\s*(?:FAIL|❯ .*\.test\.)/.test(line)).map(line => line.trim()))];
console.log(`exit ${whole.status}; ${whole.ms} ms; ${failed.length} failing lines`);
for (const line of failed.slice(0, 30)) console.log(`  ${line.slice(0, 150)}`);
for (const line of whole.text.split('\n').filter(line => /Failed to resolve import|^\s*Test Files |^\s*Tests /.test(line)).slice(0, 12)) console.log(`  ${line.trim().slice(0, 170)}`);

console.log('\n## 2. vitest related');
for (const file of ['src/app/global-error.tsx', 'next.config.ts', 'src/lib/utils.ts']) {
  const r = sh(`npx vitest related ${file} --run --reporter=default`);
  const summary = r.text.split('\n').filter(line => /^\s*Test Files |No test files found/.test(line)).map(line => line.trim()).join(' / ');
  console.log(`${file}: exit ${r.status}; ${r.ms} ms; ${summary.slice(0, 130)}`);
}
const none = sh('npx vitest related src/app/global-error.tsx --run --passWithNoTests --reporter=default');
console.log(`with --passWithNoTests: exit ${none.status}; ${none.ms} ms`);

console.log('\n## 3. a real tsc reports a consumer of a changed signature, in a temporary root');
const fx = mkdtempSync(join(tmpdir(), 'lero-945-tsc-'));
const tsc = resolve('node_modules/typescript/bin/tsc');
writeFileSync(join(fx, 'tsconfig.json'), JSON.stringify({ compilerOptions: { noEmit: true, strict: true, skipLibCheck: true, target: 'es2022', module: 'esnext', moduleResolution: 'bundler' }, include: ['*.ts'] }));
writeFileSync(join(fx, 'owner.ts'), 'export const price = (value: number): number => value;\n');
writeFileSync(join(fx, 'consumer.ts'), "import { price } from './owner';\nexport const shown = price(1);\n");
const before = spawnSync(process.execPath, [tsc, '--pretty', 'false', '-p', fx], { encoding: 'utf8' });
writeFileSync(join(fx, 'owner.ts'), 'export const price = (value: string): number => Number(value);\n');
const after = spawnSync(process.execPath, [tsc, '--pretty', 'false', '-p', fx], { encoding: 'utf8' });
console.log(`before the change: exit ${before.status}`);
console.log(`after the change of owner.ts only: exit ${after.status}; ${clean(after.stdout).split('\n')[0].replaceAll(fx, '<fx>').slice(0, 130)}`);
rmSync(fx, { recursive: true, force: true });
