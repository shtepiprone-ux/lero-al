// node --test scripts/quality/entry-point-guards.test.mjs
// Task 963 AC18 (found in the Task 951 design, 2026-11-09, after the Task 939 review 2 N1): a script that decides "am I
// the entry point" by comparing `process.argv[1]` with `import.meta.url` as typed skips its own run when started
// through a symlinked or junctioned path (Node gives import.meta.url the real path, argv[1] stays as typed) and exits 0
// having checked nothing. Every script asks `isEntryPoint(import.meta.url)` from scripts/lib/entry-point.mjs instead.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// A raw comparison of argv[1] with the module's own URL or path, in any of the spellings the census found.
const RAW_GUARD = /process\.argv\[1\][^\n]*import\.meta\.url|import\.meta\.url[^\n]*process\.argv\[1\]/;

// The 22 scripts outside scripts/quality/ that were still on the raw guard on 2026-11-09 were converted by Task 951 AC11;
// the Task 951 review 1 (2026-11-09) emptied this list after it found none left. No entry is ever added: from now on
// every raw guard fails.
export const PENDING_951 = new Set([]);

function trackedScripts() {
  const r = spawnSync('git', ['ls-files', '-z', '--', 'scripts/*.mjs', 'scripts/**/*.mjs'], { cwd: ROOT, encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, r.stderr);
  return [...new Set(r.stdout.split('\0').filter(Boolean))];
}

test('no script outside the Task 951 list compares argv[1] with its own URL as typed', () => {
  const raw = trackedScripts().filter((p) => p !== 'scripts/lib/entry-point.mjs' && p !== 'scripts/quality/entry-point-guards.test.mjs')
    .filter((p) => { try { return RAW_GUARD.test(readFileSync(path.join(ROOT, p), 'utf8')); } catch { return false; } });
  const unlisted = raw.filter((p) => !PENDING_951.has(p));
  assert.deepEqual(unlisted, [], 'a raw entry-point guard outside the Task 951 list: use isEntryPoint(import.meta.url) from scripts/lib/entry-point.mjs');
});

// Task 951 review 1 F2: the import of isEntryPoint sits in the module's import block, before any other statement, and
// the file ends with a newline (8 scripts appended it after the guard that calls it, with no final newline).
test('every script imports isEntryPoint in its import block, and ends with a newline', () => {
  const misplaced = [];
  for (const p of trackedScripts()) {
    if (p === 'scripts/lib/entry-point.mjs' || p === 'scripts/quality/entry-point-guards.test.mjs') continue;
    let text;
    try { text = readFileSync(path.join(ROOT, p), 'utf8'); } catch { continue; }
    const lines = text.split(/\r?\n/);
    const at = lines.findIndex((l) => /^import\s*\{[^}]*\bisEntryPoint\b[^}]*\}\s*from\s*['"][^'"]*entry-point\.mjs['"]/.test(l));
    if (at === -1) continue;
    const firstCall = lines.findIndex((l) => /\bisEntryPoint\(/.test(l) && !/^import\b/.test(l));
    if (firstCall !== -1 && firstCall < at) misplaced.push(`${p}: imported at line ${at + 1}, after its use at line ${firstCall + 1}`);
    if (!text.endsWith('\n')) misplaced.push(`${p}: no newline at the end of the file`);
  }
  assert.deepEqual(misplaced, [], 'move the import into the import block at the top of the file');
});

test('isEntryPoint answers for the real path, the typed path and a symlinked path, and never for an importer', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'entry-point-'));
  try {
    const real = path.join(dir, 'real');
    const script = path.join(real, 'probe.mjs');
    spawnSync(process.execPath, ['-e', `require('fs').mkdirSync(${JSON.stringify(real)})`]);
    writeFileSync(script, `import { isEntryPoint } from ${JSON.stringify(pathToFileURL(path.join(ROOT, 'scripts/lib/entry-point.mjs')).href)};\nprocess.stdout.write(String(isEntryPoint(import.meta.url)));\n`);
    const link = path.join(dir, 'link');
    symlinkSync(real, link, 'junction');
    const run = (p) => spawnSync(process.execPath, [p], { encoding: 'utf8' }).stdout;
    assert.equal(run(script), 'true', 'started by its real path');
    assert.equal(run(path.join(link, 'probe.mjs')), 'true', 'started through a symlinked directory (the fail-open case)');
    const importer = path.join(dir, 'importer.mjs');
    writeFileSync(importer, `const m = await import(${JSON.stringify(pathToFileURL(script).href)});\n`);
    assert.equal(run(importer), 'false', 'imported by another entry point');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  assert.equal(isEntryPoint(pathToFileURL(path.join(tmpdir(), 'no-such-module.mjs')).href, undefined), false, 'no argv[1]: not the entry point');
});
