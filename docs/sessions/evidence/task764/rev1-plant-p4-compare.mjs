// P4 plant check (Task 764 Revision 1, kickoff §10.6): reads the current
// `rev1-favorites-composition.<label>.json` artifact and asserts the reveal fires under the
// coarse-override context — `actionOpacityOnCardHover` must equal '1' there.
//
// Correct implementation: the reveal's hover arm is guarded by `(hover: hover)` ONLY. The
// coarse-override context (D63-G) reports `hover:hover=true` && `pointer:coarse=true` &&
// `pointer:fine=false`, so `(hover: hover)` matches and the action reveals — PASS.
//
// P4 mutation: the hover arm guard changed to `(hover: hover) and (pointer: fine)`. The
// coarse-override context reports `pointer:fine=false`, so the guard no longer matches — the
// action stays at opacity 0 under card hover — the assertion below genuinely FAILs (exit 1).
import fs from 'fs';

const label = process.argv[2] || 'post';
const path = `docs/sessions/evidence/task764/rev1-favorites-composition.${label}.json`;
const d = JSON.parse(fs.readFileSync(path, 'utf8'));

const reveal = d.coarseOverride && d.coarseOverride.reveal;
const matchMedia = d.coarseOverride && d.coarseOverride.matchMedia;

console.log('artifact:', path);
console.log('coarse-override matchMedia:', JSON.stringify(matchMedia));
console.log('coarse-override reveal:', JSON.stringify(reveal));

const pass = !!reveal && reveal.actionOpacityAtRest === '0' && reveal.actionOpacityOnCardHover === '1';

console.log(pass
  ? 'PASS — action revealed (opacity 1) under the coarse-override (hover:hover, pointer:coarse, !pointer:fine) context'
  : 'FAIL — action did NOT reveal under the coarse-override context (reveal guard over-narrowed to require pointer:fine)');

process.exit(pass ? 0 : 1);
