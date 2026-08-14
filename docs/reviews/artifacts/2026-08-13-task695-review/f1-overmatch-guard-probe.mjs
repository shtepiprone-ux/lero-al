#!/usr/bin/env node
/**
 * Task 695 review — F1 evidence probe.
 *
 * F1: after `runPlantP3` was re-pointed from `--color-overlay-foreground` to `--text-3xl`, its
 * over-match guard compared the declaration-site count of `--text-3xl--line-height` before and
 * after the plant. That name is not emitted in the shipped bundle at all (Tailwind inlines
 * `line-height` into the `.text-3xl` utility), so the comparison was `0 -> 0` unconditionally and
 * could not have come out wrong — a check of the exact class this gate exists to prevent, sitting
 * inside the gate's own self-test.
 *
 * The fix replaces it with a name-agnostic guard: diff the set of declared names in the plant's
 * target file before and after `removeDeclarationLine`, and require that exactly one name
 * disappeared and that it is the plant's own target.
 *
 * This probe demonstrates, against the real shipped bundle and in memory only (nothing on disk is
 * modified), that:
 *   ARM 1 — the correct single-declaration removal leaves the new guard silent;
 *   ARM 2 — a planted over-match that swallows the following declaration makes the new guard fire;
 *   ARM 3 — that same planted over-match leaves the RETIRED sibling-count guard silent (0 -> 0),
 *           which is the defect F1 reports.
 *
 * Run from the repo root:  node docs/reviews/artifacts/2026-08-13-task695-review/f1-overmatch-guard-probe.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { extractCssDeclaredNames, stripComments } from '../../../../scripts/check-css-var-resolvability.mjs';

const CSS_DIR = '.next/static/css';
const NAME = '--text-3xl';
const RETIRED_SIBLING = '--text-3xl--line-height';

// Locate the plant's real target file the same way findFirstDeclarationSite does.
const declFile = readdirSync(CSS_DIR)
  .filter((f) => f.endsWith('.css'))
  .map((f) => join(CSS_DIR, f))
  .find((f) => extractCssDeclaredNames(readFileSync(f, 'utf8')).has(NAME));
if (!declFile) {
  console.error(`probe precondition failed — no shipped declaration of ${NAME} found under ${CSS_DIR}`);
  process.exit(1);
}
console.log(`target file: ${declFile}`);

const raw = readFileSync(declFile, 'utf8');
const declaredBefore = extractCssDeclaredNames(raw);

/** removeDeclarationLine's exact mechanic: match in the comment-stripped text, splice the raw. */
function removeInMemory(src, re) {
  const stripped = stripComments(src, true);
  const m = re.exec(stripped);
  if (!m) throw new Error(`probe: regex ${re} matched nothing`);
  return src.slice(0, m.index) + src.slice(m.index + m[0].length);
}

function newGuardFires(after) {
  const declaredAfter = extractCssDeclaredNames(after);
  const removed = [...declaredBefore].filter((n) => !declaredAfter.has(n));
  return { fires: !(removed.length === 1 && removed[0] === NAME), removed };
}
function retiredGuardFires(after) {
  const before = declaredBefore.has(RETIRED_SIBLING) ? 1 : 0;
  const post = extractCssDeclaredNames(after).has(RETIRED_SIBLING) ? 1 : 0;
  return { fires: post !== before, before, post };
}

// ARM 1 — the production removal regex, exactly as removeDeclarationLine builds it.
const good = removeInMemory(raw, new RegExp(`${NAME}\\s*:[^;{}]*;?`));
const a1 = newGuardFires(good);
console.log(`ARM 1  correct removal        -> removed=[${a1.removed}]  newGuard.fires=${a1.fires}  (expected false)`);

// ARM 2 — planted over-match: a greedy variant that swallows the NEXT declaration too.
const bad = removeInMemory(raw, new RegExp(`${NAME}\\s*:[^;{}]*;[^;{}]*;`));
const a2 = newGuardFires(bad);
console.log(`ARM 2  planted over-match     -> removed=[${a2.removed}]  newGuard.fires=${a2.fires}  (expected true)`);

// ARM 3 — the SAME plant, judged by the guard F1 retired.
const a3 = retiredGuardFires(bad);
console.log(`ARM 3  same plant, OLD guard  -> ${RETIRED_SIBLING} ${a3.before} -> ${a3.post}  oldGuard.fires=${a3.fires}  (expected false — this is the F1 defect)`);

const ok = a1.fires === false && a2.fires === true && a3.fires === false;
console.log(ok ? 'PROBE: PASS — new guard is live, retired guard was inert' : 'PROBE: FAIL');
process.exit(ok ? 0 : 1);
