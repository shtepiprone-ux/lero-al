// node --test scripts/quality/codeql-models.test.mjs
// Task 951 F3 (owner decision 2026-11-09): CodeQL reads the repository model packs under .github/codeql/extensions. A
// barrier row tells CodeQL that a value is safe, so a wrong or stale row would hide a real finding. Every barrier row
// must be one the reviewer approved below, name a function the file still exports, and have a test that refuses the
// dangerous input; any other kind of row is refused, so a model pack can never mute a query by another route.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EXTENSIONS = path.join(ROOT, '.github', 'codeql', 'extensions');

// The approved barriers: "<type>|<path>|<kind>" -> the test that refuses each dangerous input, and one input it must name.
const APPROVED_BARRIERS = new Map([
  ['file:src/design-system/media/appImageConfig.ts|Member[safeImageSrc].ReturnValue|html-injection',
    { test: 'src/design-system/media/__tests__/safeImageSrc.test.ts', mustRefuse: 'javascript:alert(1)' }],
]);

function modelFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...modelFiles(p));
    else if (name.endsWith('.model.yml')) out.push(p);
  }
  return out;
}

function rows() {
  const all = [];
  for (const file of modelFiles(EXTENSIONS)) {
    const doc = yaml.load(readFileSync(file, 'utf8'));
    for (const ext of doc?.extensions ?? []) {
      for (const data of ext.data ?? []) all.push({ file: path.relative(ROOT, file), pack: ext.addsTo?.pack, extensible: ext.addsTo?.extensible, data });
    }
  }
  return all;
}

test('the model packs hold only approved barrier rows for codeql/javascript-all', () => {
  const found = rows();
  assert.ok(found.length > 0, 'no model rows found under .github/codeql/extensions');
  for (const r of found) {
    assert.equal(r.pack, 'codeql/javascript-all', `${r.file}: rows extend codeql/javascript-all only`);
    assert.equal(r.extensible, 'barrierModel', `${r.file}: only barrierModel rows are allowed, not ${r.extensible}`);
    assert.ok(APPROVED_BARRIERS.has(r.data.join('|')), `${r.file}: the barrier ${JSON.stringify(r.data)} is not in APPROVED_BARRIERS (a reviewer adds it with its test)`);
  }
});

test('every approved barrier names an exported function and a test that refuses the dangerous input', () => {
  const present = new Set(rows().map((r) => r.data.join('|')));
  for (const [key, { test: testFile, mustRefuse }] of APPROVED_BARRIERS) {
    assert.ok(present.has(key), `approved barrier ${key} has no model row: remove it from APPROVED_BARRIERS`);
    const [type, access] = key.split('|');
    const source = readFileSync(path.join(ROOT, type.replace(/^file:/, '')), 'utf8');
    const member = /^Member\[([A-Za-z0-9_$]+)\]\.ReturnValue$/.exec(access)?.[1];
    assert.ok(member, `${key}: the access path is Member[<name>].ReturnValue`);
    assert.match(source, new RegExp(`export function ${member}\\(`), `${type}: exports no function ${member}`);
    const testSource = readFileSync(path.join(ROOT, testFile), 'utf8');
    assert.ok(testSource.includes(member) && testSource.includes(mustRefuse), `${testFile}: tests ${member} against ${mustRefuse}`);
  }
});
