// Owner question after Task 945 review 1: do the update commands work and what do they fix. Runs them on a temporary folder holding only package.json, the lock file
// and .npmrc, with --package-lock-only so nothing is installed and the project is untouched. Also answers what ignore-scripts does to npm run hooks, and the rest of the
// scripts-off probe. Run from the repository root.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sh = (command, cwd, ms = 280000) => {
  const r = spawnSync(command, { cwd, shell: true, encoding: 'utf8', maxBuffer: 1 << 28, timeout: ms });
  return { status: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
};
const dir = mkdtempSync(join(tmpdir(), 'upgrade-dry-'));
for (const file of ['package.json', 'package-lock.json', '.npmrc']) copyFileSync(file, join(dir, file));
const before = JSON.parse(readFileSync('package-lock.json', 'utf8')).packages;
const audit = cwd => JSON.parse(sh('npm audit --omit=dev --json', cwd).out);
console.log('=== audit --omit=dev, before', JSON.stringify(audit(dir).metadata.vulnerabilities));
const commands = [
  'npm install --package-lock-only --ignore-scripts --no-audit --no-fund --save-exact next@15.5.29 eslint-config-next@15.5.29',
  'npm install --package-lock-only --ignore-scripts --no-audit --no-fund @sentry/nextjs@10.78.0',
];
for (const command of commands) {
  const r = sh(command, dir);
  console.log(`=== ${command}\nexit ${r.status}; ${`${r.out}${r.err}`.trim().split('\n').slice(-2).join(' | ').slice(0, 300)}`);
}
const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
const lockFile = JSON.parse(readFileSync(join(dir, 'package-lock.json'), 'utf8'));
console.log('declared after', pkg.dependencies.next, pkg.devDependencies['eslint-config-next'], pkg.dependencies['@sentry/nextjs'], 'lockfileVersion', lockFile.lockfileVersion);
const after = lockFile.packages;
const changed = Object.keys({ ...before, ...after }).filter(k => k && before[k]?.version !== after[k]?.version);
const added = changed.filter(k => !before[k]);
const removed = changed.filter(k => !after[k]);
console.log(`lock entries changed ${changed.length}, added ${added.length}, removed ${removed.length}`);
console.log(changed.slice(0, 60).map(k => `${k.replace('node_modules/', '')}: ${before[k]?.version ?? '-'} -> ${after[k]?.version ?? '-'}`).join('\n'));
console.log('new install scripts', Object.entries(after).filter(([k, v]) => v.hasInstallScript && !before[k]?.hasInstallScript).map(([k]) => k).join(' ') || 'none');
const report = audit(dir);
console.log('=== audit --omit=dev, after', JSON.stringify(report.metadata.vulnerabilities));
for (const [name, e] of Object.entries(report.vulnerabilities)) if (['critical', 'high'].includes(e.severity)) console.log(` ${e.severity} ${name} direct ${e.isDirect} fix ${e.fixAvailable === true ? 'audit fix' : e.fixAvailable ? `${e.fixAvailable.name}@${e.fixAvailable.version}${e.fixAvailable.isSemVerMajor ? ' MAJOR' : ''}` : 'none'}`);
rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
console.log('=== publish times');
for (const spec of ['next@15.5.29', 'eslint-config-next@15.5.29', '@sentry/nextjs@10.78.0']) {
  const [name, version] = [spec.slice(0, spec.lastIndexOf('@')), spec.slice(spec.lastIndexOf('@') + 1)];
  const time = JSON.parse(sh(`npm view ${name} time --json`).out);
  console.log(`${spec}: ${time[version]}; age ${Math.round((Date.now() - Date.parse(time[version])) / 86400000)} days`);
}
const hook = mkdtempSync(join(tmpdir(), 'hook-'));
writeFileSync(join(hook, 'package.json'), JSON.stringify({ name: 'x', version: '1.0.0', scripts: { prework: 'echo PRE-HOOK-RAN', work: 'echo WORK-RAN' } }));
console.log('=== npm run with its pre hook, default\n' + sh('npm run work', hook).out.split('\n').filter(l => /RAN/.test(l) && !/^>/.test(l)).join(' '));
writeFileSync(join(hook, '.npmrc'), 'ignore-scripts=true\n');
console.log('=== npm run with its pre hook, ignore-scripts=true in .npmrc\n' + sh('npm run work', hook).out.split('\n').filter(l => /RAN/.test(l) && !/^>/.test(l)).join(' '));
rmSync(hook, { recursive: true, force: true, maxRetries: 3 });
console.log('=== Linux binaries the lock holds, for the runner and Vercel');
const now = before;
for (const name of ['@next/swc-linux-x64-gnu', '@img/sharp-linux-x64', '@esbuild/linux-x64', '@sentry/cli-linux-x64', '@unrs/resolver-binding-linux-x64-gnu', '@parcel/watcher-linux-x64-glibc', '@swc/core-linux-x64-gnu']) {
  const key = Object.keys(now).filter(k => k.endsWith(`node_modules/${name}`));
  console.log(`${name}: ${key.length ? key.map(k => `${k.replace('node_modules/', '')}@${now[k].version}`).join(', ') : 'absent'}`);
}
console.log('=== who runs a hooked script in CI and the package');
const pkgNow = JSON.parse(readFileSync('package.json', 'utf8'));
console.log('msw.workerDirectory', JSON.stringify(pkgNow.msw ?? null));
for (const file of ['.github/workflows/ci.yml']) if (existsSync(file)) readFileSync(file, 'utf8').split('\n').forEach((l, i) => { if (/npm (ci|install)|build-storybook|governance:storybook|npm run storybook/.test(l)) console.log(`${file}:${i + 1}: ${l.trim().slice(0, 120)}`); });
console.log('=== @swc/core under next-intl: who uses it');
const nextIntl = JSON.parse(readFileSync('node_modules/next-intl/package.json', 'utf8'));
console.log('next-intl deps', JSON.stringify(Object.keys(nextIntl.dependencies ?? {})));
const swc = sh('git grep -l "@swc/core" -- node_modules/next-intl/package.json', '.');
const scan = spawnSync(process.execPath, ['-e', "const fs=require('fs'),p=require('path');const hits=[];const w=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=p.join(d,e.name);if(e.isDirectory()){if(e.name==='node_modules')continue;w(f)}else if(/\\.js$/.test(e.name)&&/@swc\\/core/.test(fs.readFileSync(f,'utf8')))hits.push(f)}};w('node_modules/next-intl/dist');console.log(hits.slice(0,8).join('\\n')||'no reference')"], { encoding: 'utf8' });
console.log(scan.stdout.trim().replace(/\\/g, '/'), swc.status === undefined ? '' : '');
console.log('project code importing the extractor:', sh('git grep -n "useExtracted\\|experimental.*extract\\|messages.*extract" -- src next.config.ts next.config.mjs next.config.js').out.trim().slice(0, 300) || 'none');
