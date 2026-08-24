// P1 plant check: post-edit (correct, 1.1025) vs plant-p1 (mutated to 1.05) on the grid card's
// settled hover effectiveScale. Reuses the same AC6 assertion compare-phase-c.mjs runs.
import fs from 'fs';
function r4(n) { return Math.round(n * 10000) / 10000; }
const post = JSON.parse(fs.readFileSync('docs/sessions/evidence/task764/phase-a-pointer-matrix.post-edit.json', 'utf8'));
const plant = JSON.parse(fs.readFileSync('docs/sessions/evidence/task764/phase-a-pointer-matrix.plant-p1.json', 'utf8'));

function effScale(rest, hover) { return { w: hover.rect.width / rest.rect.width, h: hover.rect.height / rest.rect.height }; }

const postSample = post.fine.grid.asRendered;
const plantSample = plant.fine.grid.asRendered;
const postEff = effScale(postSample.rest, postSample.hoverOnImage);
const plantEff = effScale(plantSample.rest, plantSample.hoverOnImage);

const baseline = 1.1025;
const plantMatchesBaseline = r4(plantEff.w) === baseline;
const delta = r4(Math.abs(plantEff.w - baseline));

console.log('post-edit (correct) effectiveScale.w:', r4(postEff.w));
console.log('plant-p1 (mutated) effectiveScale.w:', r4(plantEff.w));
console.log('delta from 1.1025 baseline:', delta);
console.log(plantMatchesBaseline
  ? 'UNEXPECTED: plant-p1 still matches baseline — comparator is BLIND to this mutation (apparatus defect)'
  : `EXPECTED FAIL: plant-p1 (${r4(plantEff.w)}) != baseline (${baseline}), non-zero delta (${delta}) — comparator correctly detects the P1 mutation, run exits non-zero`);
// Exit non-zero when the comparator correctly detects the plant's delta (the required
// observation per kickoff §10.5 P1: "reports a non-zero delta, and the run exits non-zero").
// Exit 0 only in the apparatus-defect case (plant went undetected), which would itself be a FAIL
// finding to report, not a clean pass.
process.exit(plantMatchesBaseline ? 0 : 1);
