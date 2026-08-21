// Task 757 - evidence producer for the review ledger's TAILWIND_V4 compiler rows.
// Replicates scripts/check-review-ledger.mjs's own probe (TAILWIND_PROBE_SCRIPT) so the
// retained before-rules are machine-produced from the base revision, not transcribed by hand.
// Run from the project root:  node docs/sessions/evidence/task757/dump-generated-rules.mjs
import { compile } from '@tailwindcss/node';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const BASE_REVISION = 'a9952d0073189f15c0d8c646431414c5a245f3bb';
const INPUT_PATH = 'src/app/globals.css';
const CANDIDATES = ['text-lg', 'text-sm', 'text-xs', 'transition-colors'];
const OUT = 'docs/sessions/evidence/task757/ac3-generated-before-rules.css';

const show = spawnSync('git', ['show', `${BASE_REVISION}:${INPUT_PATH}`], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
if (show.status !== 0) { console.error(show.stderr); process.exit(1); }
const css = show.stdout;

function escapeClass(c) { return c.replace(/[^a-zA-Z0-9_-]/g, ch => `\\${ch}`); }
function extract(out, candidate) {
  const start = out.indexOf(`.${escapeClass(candidate)}`);
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < out.length; i += 1) {
    if (out[i] === '{') depth += 1;
    else if (out[i] === '}') { depth -= 1; if (depth === 0) return out.slice(start, i + 1); }
  }
  return null;
}

const blocks = [
  `/* Task 757 - exact generated before-rules, compiled from ${INPUT_PATH} at base revision ${BASE_REVISION}.`,
  `   Producer: docs/sessions/evidence/task757/dump-generated-rules.mjs`,
  `   tailwindcss ${JSON.parse(spawnSync('node', ['-p', "JSON.stringify(require('./node_modules/tailwindcss/package.json').version)"], { encoding: 'utf8' }).stdout.trim())}`,
  `   These strings are what review-ledger's TAILWIND_V4 rows must carry as before.rawRule. */`,
  '',
];
for (const candidate of CANDIDATES) {
  const compiler = await compile(css, { base: process.cwd(), from: `${process.cwd()}/${INPUT_PATH}`, onDependency() {} });
  const rule = extract(compiler.build([candidate]), candidate);
  console.log(`===== ${candidate} =====\n${rule ?? 'NOT FOUND'}\n`);
  blocks.push(`/* candidate: ${candidate} */`, rule ?? `/* NOT FOUND */`, '');
}
fs.writeFileSync(OUT, blocks.join('\n'), 'utf8');
console.log(`written ${OUT}`);
