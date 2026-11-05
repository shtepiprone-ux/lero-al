// Owner question after Task 945 review 1: what does ignore-scripts=true actually break. Installs the locked tree with scripts off into a temporary folder holding only
// package.json, the lock file and .npmrc (no project copy, the project's node_modules is untouched), then loads what each package with an install script provides.
// Run from the repository root. Native Windows only: the Linux runner and Vercel are not measured here.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const dir = mkdtempSync(join(tmpdir(), 'ignore-scripts-'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
console.log(`node ${process.version}, ${process.platform}`);
console.log('=== lifecycle scripts of the project itself: npm stops running these with ignore-scripts');
const names = Object.keys(pkg.scripts);
const hooks = names.filter(name => /^(pre|post)/.test(name) && (names.includes(name.replace(/^(pre|post)/, '')) || ['install', 'prepare', 'preinstall', 'postinstall'].includes(name)));
console.log(hooks.length ? hooks.map(name => `${name}: ${pkg.scripts[name]}`).join('\n') : 'none');
console.log('=== what each install script does, read from the installed package');
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
for (const [key, value] of Object.entries(lock.packages).filter(([, v]) => v.hasInstallScript)) {
  const file = join(ROOT, key, 'package.json');
  if (!existsSync(file)) { console.log(`${key}@${value.version}: not installed on this platform`); continue; }
  const s = JSON.parse(readFileSync(file, 'utf8')).scripts ?? {};
  console.log(`${key}@${value.version}: ${['preinstall', 'install', 'postinstall'].filter(k => s[k]).map(k => `${k}: ${s[k]}`).join('; ')}`);
}
for (const file of ['package.json', 'package-lock.json', '.npmrc']) copyFileSync(file, join(dir, file));
const begun = Date.now();
const install = spawnSync('npm ci --ignore-scripts --no-audit --no-fund', { cwd: dir, shell: true, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 500000 });
console.log(`=== npm ci --ignore-scripts: exit ${install.status}, ${Math.round((Date.now() - begun) / 1000)} s`);
console.log(`${install.stdout}${install.stderr}`.trim().split('\n').slice(-3).join('\n').slice(0, 400));
const probes = [
  ['sharp, what next/image uses', "const s=require('sharp');s({create:{width:1,height:1,channels:3,background:'red'}}).png().toBuffer().then(b=>console.log('rendered',b.length,'bytes'))"],
  ['@sentry/cli, what the build uploads source maps with', "const {execFileSync}=require('child_process');console.log(execFileSync(process.execPath,[require.resolve('@sentry/cli/bin/sentry-cli'),'--version'],{encoding:'utf8'}).trim())"],
  ['esbuild, what vite and storybook use', "console.log('esbuild',require('esbuild').transformSync('let a=1').code.trim())"],
  ['@swc/core under next-intl', "const m=require('path').join(process.cwd(),'node_modules/next-intl/node_modules/@swc/core');console.log('swc',require(m).transformSync('let a=1',{}).code.trim())"],
  ['@parcel/watcher', "console.log('watcher',typeof require('@parcel/watcher').subscribe)"],
  ['unrs-resolver', "const u=require('unrs-resolver');console.log('resolver',typeof u.ResolverFactory)"],
  ['next, its compiler', "console.log('next swc binary',require.resolve('@next/swc-win32-x64-msvc/package.json').length>0)"],
  ['msw', "console.log('msw',Object.keys(require('msw')).length>0)"],
];
console.log('=== each loaded from the tree installed with scripts off');
for (const [name, code] of probes) {
  const file = join(dir, 'probe.cjs');
  writeFileSync(file, code);
  const r = spawnSync(process.execPath, [file], { cwd: dir, encoding: 'utf8', timeout: 60000 });
  console.log(`${name}: exit ${r.status}; ${`${r.stdout}${r.stderr}`.trim().split('\n').slice(0, 2).join(' ').slice(0, 170)}`);
}
rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
console.log(`temporary folder removed: ${!existsSync(dir)}`);
