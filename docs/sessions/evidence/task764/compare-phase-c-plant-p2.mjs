// P2 plant check: post-edit (correct) vs plant-p2 (transform removed from transition list).
// Expected: post-edit mid-flight (t=75ms) transform is mid-ease (not yet settled); plant-p2's
// t=75ms transform is ALREADY the settled value (snapped instantly), so the mid-flight sample
// no longer shows an eased value — the run fails (kickoff §10.5 P2).
import fs from 'fs';
const post = JSON.parse(fs.readFileSync('docs/sessions/evidence/task764/phase-a-transition-curve.post-edit.json', 'utf8'));
const plant = JSON.parse(fs.readFileSync('docs/sessions/evidence/task764/phase-a-transition-curve.plant-p2.json', 'utf8'));

const postSamples = post.fine.nonPriority.samples;
const plantSamples = plant.fine.nonPriority.samples;
const settled = postSamples[postSamples.length - 1].transform;

const postT0 = postSamples[0].transform;
const postT75 = postSamples[1].transform;
const plantT0 = plantSamples[0].transform;
const plantT75 = plantSamples[1].transform;

console.log('post-edit (correct) t=0ms transform:', postT0, '(expect identity, matrix(1,0,0,1,0,0))');
console.log('post-edit (correct) t=75ms transform:', postT75, '(expect mid-ease, NOT settled', settled, ')');
console.log('plant-p2 t=0ms transform:', plantT0);
console.log('plant-p2 t=75ms transform:', plantT75, '(plant expectation: ALREADY settled', settled, '— transform snapped instantly)');

const postMidFlightCorrect = postT75 !== settled && postT75 !== postT0;
const plantSnappedInstantly = plantT75 === settled || plantT0 === settled;

console.log(postMidFlightCorrect ? 'post-edit correctly shows mid-flight easing' : 'UNEXPECTED: post-edit did not show mid-flight easing');
console.log(plantSnappedInstantly
  ? 'EXPECTED FAIL: plant-p2 shows the settled value already at the first sample(s) — transform is no longer transitioned, run fails as required'
  : 'UNEXPECTED: plant-p2 still shows mid-flight easing — comparator is BLIND to this mutation (apparatus defect)');

process.exit(postMidFlightCorrect && plantSnappedInstantly ? 1 : 0);
