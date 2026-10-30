import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function run(mode, flags = []) {
  const root = mkdtempSync(join(tmpdir(), 'lero-locale-gate-'));
  try {
    for (const dir of ['scripts/lib', 'scripts/workflow-gates', 'storybook-static', 'node_modules/playwright']) mkdirSync(join(root, dir), { recursive: true });
    for (const file of ['scripts/check-locale-leak.mjs', 'scripts/lib/mantine-story-scope.mjs', 'scripts/workflow-gates/contract.mjs']) copyFileSync(file, join(root, file));
    writeFileSync(join(root, 'storybook-static/index.json'), JSON.stringify({ entries: { fixture: { id: 'fixture', title: 'Patterns/Mantine/Fixture', name: 'Default', type: 'story' } } }));
    writeFileSync(join(root, 'node_modules/playwright/package.json'), JSON.stringify({ name: 'playwright', type: 'module', exports: './index.mjs' }));
    writeFileSync(join(root, 'node_modules/playwright/index.mjs'), `import {appendFileSync} from 'node:fs';
export const chromium={launch:async()=>({close:async()=>{},newPage:async()=>({on:(event,handler)=>{
if(event==='console'&&${JSON.stringify(mode)}==='play-error')handler({type:()=> 'error',text:()=> "Error rendering story 'fixture':"});
if(event==='console'&&${JSON.stringify(mode)}==='network-error')handler({type:()=> 'error',text:()=> 'Failed to load resource: 404'});
if(event==='pageerror'&&${JSON.stringify(mode)}==='runtime-error')handler(Error('Synthetic uncaught component error'));
},setViewportSize:async()=>{},goto:async()=>{${mode === 'error' ? "throw Error('synthetic render failure')" : 'return {ok:()=>true}'}},waitForFunction:async()=>{},waitForTimeout:async()=>{},evaluate:async(fn)=> typeof fn==='string'?${mode === 'leak' ? "['Untranslated account label']" : '[]'}:false,close:async()=>appendFileSync('closed.txt','closed\\n')})})};`);
    // This executes the actual CLI and its detector; only the browser I/O is doubled.
    const result = spawnSync(process.execPath, [join(root, 'scripts/check-locale-leak.mjs'), '--mantine-only', ...flags], { cwd: root, encoding: 'utf8', timeout: 15000 });
    const reportDir = join(root, '.screenshots/locale-leak');
    const reports = readdirSync(reportDir, { recursive: true }).filter(f => f.endsWith('report.json'));
    return { result, report: reports.length ? JSON.parse(readFileSync(join(reportDir, reports[0]), 'utf8')) : undefined,
      closed: readFileSync(join(root, 'closed.txt'), { encoding: 'utf8', flag: 'a+' }).trim().split('\n').filter(Boolean).length };
  } finally { rmSync(root, { recursive: true, force: true }); }
}
test('actual locale CLI rejects failed rendering instead of reporting zero leaks', () => {
  const { result, report, closed } = run('error');
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.ok(report.errors.length > 0); assert.equal(report.complete, false); assert.ok(closed > 0);
});
test('actual detector fails on a planted English leak and closes every page', () => {
  const { result, report, closed } = run('leak');
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.ok(report.leakCount > 0); assert.equal(report.complete, true); assert.equal(closed, 12);
});
test('restored clean rendering passes with complete tuple coverage', () => {
  const { result, report, closed } = run('clean');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(report.complete, true); assert.equal(report.scanned, 9); assert.equal(closed, 12);
});

test('owner migration mode retains leaks as warnings but does not excuse incomplete rendering', () => {
  const warning = run('leak', ['--report-only-leaks']);
  assert.equal(warning.result.status, 0); assert.ok(warning.report.leakCount > 0);
  assert.equal(warning.report.leaksBlocking, false); assert.equal(warning.report.complete, true);
  const broken = run('error', ['--report-only-leaks']);
  assert.equal(broken.result.status, 1); assert.equal(broken.report.complete, false);
});

test('finished render phase cannot erase a reported Storybook play failure', () => {
  const broken = run('play-error', ['--report-only-leaks']);
  assert.equal(broken.result.status, 1, broken.result.stdout + broken.result.stderr);
  assert.equal(broken.report.complete, false);
  assert.ok(broken.report.errors.length > 0);
  assert.equal(run('network-error', ['--report-only-leaks']).result.status, 0, 'A resource console line alone is not a Storybook render assertion');
});

test('uncaught browser exceptions cannot pass as a clean locale render', () => {
  const broken = run('runtime-error', ['--report-only-leaks']);
  assert.equal(broken.result.status, 1, broken.result.stdout + broken.result.stderr);
  assert.equal(broken.report.complete, false);
});
