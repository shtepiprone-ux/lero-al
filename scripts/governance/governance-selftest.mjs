/**
 * Self-test for the governance scan (2026-10-07).
 *
 * Proves the scanner-correctness fix cannot hide real violations:
 *   1. `codeLines` blanks comments but keeps code, strings, template literals and line numbers.
 *   2. End to end: a planted file with real violations in CODE makes `governance.mjs all` exit 1
 *      and names each planted rule, while a twin file carrying the same text only in COMMENTS
 *      produces no blocking finding.
 *
 * The planted files live in a throw-away directory under src/ and are always removed.
 * Usage: npm run governance:verify
 */
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import assert from 'assert/strict';
import { codeLines, isTestSource } from './source-lines.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const PLANT_DIR = join(ROOT, 'src', '__governance_selftest__');

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failures++;
    console.log(`  ❌ ${name}\n     ${err.message.split('\n').join('\n     ')}`);
  }
}

console.log('governance self-test — 1. codeLines');
check('line comment blanked, code before it kept', () => {
  assert.deepEqual(codeLines("const a = 'bg-gray-100' // bg-gray-200"), ["const a = 'bg-gray-100' "]);
});
check('JSDoc block blanked, line count preserved', () => {
  const out = codeLines('/**\n * `<button>` bg-gray-100\n */\nconst x = 1');
  assert.equal(out.length, 4);
  assert.deepEqual(out.slice(0, 3), ['', '', '']);
  assert.equal(out[3], 'const x = 1');
});
check('JSX comment blanked', () => {
  assert.equal(codeLines('<div>{/* <button> */}</div>')[0], '<div>{}</div>');
});
check('comment markers inside strings are kept as string text', () => {
  assert.equal(codeLines("const u = 'https://x.al' + \"/* no */\"")[0], "const u = 'https://x.al' + \"/* no */\"");
});
check('template literal with nested expression kept', () => {
  const src = 'const c = `bg-gray-100 ${on ? `text-red-500` : "x"} // keep`';
  assert.equal(codeLines(src)[0], src);
});
check('escaped slashes in a regex literal are not a comment', () => {
  const src = "const re = /https?:\\/\\//; const k = 'bg-gray-100'";
  assert.equal(codeLines(src)[0], src);
});
check('isTestSource matches tests only', () => {
  assert.equal(isTestSource('src/a/__tests__/X.smoke.test.tsx'), true);
  assert.equal(isTestSource('src/a/X.test.ts'), true);
  assert.equal(isTestSource('src/a/X.stories.tsx'), false);
  assert.equal(isTestSource('src/a/Xtest.tsx'), false);
});

console.log('governance self-test — 2. planted violations, end to end');
const CODE_PLANT = `import { useMediaQuery } from 'some-other-hooks'
import { useWindowSize } from 'usehooks-ts'
export function Planted() {
  const wide = useMediaQuery('(min-width: 40em)')
  const size = useWindowSize()
  return <button className="bg-gray-100">{String(wide)}{size.width}</button>
}
`;
const COMMENT_PLANT = `import { useMediaQuery } from '@mantine/hooks'
/**
 * TailAdmin provenance: \`rounded-xl bg-gray-100 text-gray-500\`, a raw \`<button>\`,
 * useWindowSize() and useMediaQuery() named in prose only.
 */
export function Documented() {
  // bg-gray-200 <button> useWindowSize()
  const narrow = useMediaQuery('(max-width: 40em)') // SSR caveat: false until hydration
  return <div>{/* <button className="bg-gray-100"> */}{String(narrow)}</div>
}
`;

let run;
try {
  mkdirSync(PLANT_DIR, { recursive: true });
  writeFileSync(join(PLANT_DIR, 'CodePlant.tsx'), CODE_PLANT);
  writeFileSync(join(PLANT_DIR, 'CommentPlant.tsx'), COMMENT_PLANT);
  run = spawnSync(process.execPath, [join(__dirname, 'governance.mjs'), 'all'], { cwd: ROOT, encoding: 'utf-8' });
} finally {
  rmSync(PLANT_DIR, { recursive: true, force: true });
}
const output = `${run.stdout}\n${run.stderr}`;
const newSection = output.split('New HIGH/CRITICAL findings not in baseline:')[1] ?? '';
const plant = 'src/__governance_selftest__/';

check('gate exits 1 on planted code violations', () => assert.equal(run.status, 1, output.slice(-1500)));
for (const [label, key] of [
  ['raw <button> in JSX', `primitives :: ${plant}CodePlant.tsx :: <button>`],
  ['raw palette class in className', `tailwind :: ${plant}CodePlant.tsx :: raw palette color`],
  ['useWindowSize() call', `responsive :: ${plant}CodePlant.tsx :: useWindowSize/useViewportSize`],
  ['non-Mantine useMediaQuery() call', `responsive :: ${plant}CodePlant.tsx :: non-mantine useMediaQuery`],
]) {
  check(`catches ${label}`, () => assert.ok(newSection.includes(key), `missing "${key}"`));
}
check('comment-only twin produces no blocking finding', () => {
  assert.ok(!newSection.includes(`${plant}CommentPlant.tsx`), newSection);
});
check('Mantine useMediaQuery call is advisory (MEDIUM), not blocking', () => {
  assert.ok(!newSection.includes('mantine useMediaQuery/useMatches'), newSection);
});

if (failures > 0) {
  console.log(`\n❌ governance self-test FAILED — ${failures} check(s).`);
  process.exit(1);
}
console.log('\n✅ governance self-test PASSED');
