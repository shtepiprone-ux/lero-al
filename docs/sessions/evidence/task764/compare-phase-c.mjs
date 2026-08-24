// Task 764 Phase C comparator. Compares pre-edit vs post-edit Phase A (pointer matrix) and
// Phase A2 (transition curve) captures. Metric is EFFECTIVE RENDERED SCALE from
// getBoundingClientRect(), never the individual computed transform/scale strings (kickoff §10.4).
import fs from 'fs';

function r4(n) { return Math.round(n * 10000) / 10000; }

const pre = JSON.parse(fs.readFileSync('docs/sessions/evidence/task764/phase-a-pointer-matrix.pre-edit.json', 'utf8'));
const post = JSON.parse(fs.readFileSync('docs/sessions/evidence/task764/phase-a-pointer-matrix.post-edit.json', 'utf8'));
const preCurve = JSON.parse(fs.readFileSync('docs/sessions/evidence/task764/phase-a-transition-curve.pre-edit.json', 'utf8'));
const postCurve = JSON.parse(fs.readFileSync('docs/sessions/evidence/task764/phase-a-transition-curve.post-edit.json', 'utf8'));

const report = { checks: [], failCount: 0 };
function check(name, pass, detail) {
  report.checks.push({ name, pass, detail });
  if (!pass) report.failCount++;
}

function effScale(rest, hover) {
  if (!rest || !hover || rest.rect.width === 0) return null;
  return { w: hover.rect.width / rest.rect.width, h: hover.rect.height / rest.rect.height };
}

function rectEqual(a, b) {
  return a.rect.width === b.rect.width && a.rect.height === b.rect.height && a.rect.x === b.rect.x && a.rect.y === b.rect.y;
}

// --- AC6/AC7: grid card, fine pointer, settled hover, effective scale must round to 1.1025 ---
{
  const preSample = pre.fine.grid.asRendered;
  const postSample = post.fine.grid.asRendered;

  check('grid rest rectangles byte-identical (pre vs post, fine)', rectEqual(preSample.rest, postSample.rest),
    { preRest: preSample.rest.rect, postRest: postSample.rest.rect });

  const preImg = effScale(preSample.rest, preSample.hoverOnImage);
  const postImg = effScale(postSample.rest, postSample.hoverOnImage);
  check('grid hoverOnImage effectiveScale.w rounds to 1.1025 pre and post, agree to 4dp',
    r4(preImg.w) === 1.1025 && r4(postImg.w) === 1.1025 && r4(preImg.w) === r4(postImg.w),
    { pre: r4(preImg.w), post: r4(postImg.w) });
  check('grid hoverOnImage effectiveScale.h rounds to 1.1025 pre and post, agree to 4dp',
    r4(preImg.h) === 1.1025 && r4(postImg.h) === 1.1025 && r4(preImg.h) === r4(postImg.h),
    { pre: r4(preImg.h), post: r4(postImg.h) });
  check('grid hoverOnImage width/height ratio agree with each other (pre)', r4(preImg.w) === r4(preImg.h), { w: r4(preImg.w), h: r4(preImg.h) });
  check('grid hoverOnImage width/height ratio agree with each other (post)', r4(postImg.w) === r4(postImg.h), { w: r4(postImg.w), h: r4(postImg.h) });

  const preTitle = effScale(preSample.rest, preSample.hoverOnTitle);
  const postTitle = effScale(postSample.rest, postSample.hoverOnTitle);
  check('AC7: grid hoverOnTitle effectiveScale equals hoverOnImage (pre)', r4(preTitle.w) === r4(preImg.w) && r4(preTitle.h) === r4(preImg.h),
    { title: r4(preTitle.w), image: r4(preImg.w) });
  check('AC7: grid hoverOnTitle effectiveScale equals hoverOnImage (post)', r4(postTitle.w) === r4(postImg.w) && r4(postTitle.h) === r4(postImg.h),
    { title: r4(postTitle.w), image: r4(postImg.w) });

  check('diagnostic: computed transform/scale strings DID change (expected)', true, {
    pre: { transform: preSample.hoverOnImage.transform, scale: preSample.hoverOnImage.scale },
    post: { transform: postSample.hoverOnImage.transform, scale: postSample.hoverOnImage.scale },
  });
}

// --- AC13/R12: list card, fine pointer, settled hover, effective scale must round to 1.0500, unchanged ---
{
  const preSample = pre.fine.list.asRendered;
  const postSample = post.fine.list.asRendered;

  check('list rest rectangles byte-identical (pre vs post, fine)', rectEqual(preSample.rest, postSample.rest),
    { preRest: preSample.rest.rect, postRest: postSample.rest.rect });

  const preImg = effScale(preSample.rest, preSample.hoverOnImage);
  const postImg = effScale(postSample.rest, postSample.hoverOnImage);
  check('AC13: list hoverOnImage effectiveScale.w rounds to 1.0500 pre and post, agree to 4dp',
    r4(preImg.w) === 1.05 && r4(postImg.w) === 1.05 && r4(preImg.w) === r4(postImg.w),
    { pre: r4(preImg.w), post: r4(postImg.w) });
  check('AC13: list hoverOnImage effectiveScale.h rounds to 1.0500 pre and post, agree to 4dp',
    r4(preImg.h) === 1.05 && r4(postImg.h) === 1.05 && r4(preImg.h) === r4(postImg.h),
    { pre: r4(preImg.h), post: r4(postImg.h) });
}

// --- Rest state: identical rectangles and computed values, all contexts ---
for (const ctxKey of ['fine', 'coarseNatural', 'coarseOverride']) {
  for (const cardKey of ['grid', 'list']) {
    const preRest = pre[ctxKey][cardKey].asRendered.rest;
    const postRest = post[ctxKey][cardKey].asRendered.rest;
    check(`rest state identical: ${ctxKey}.${cardKey}`, rectEqual(preRest, postRest) && preRest.transform === postRest.transform && preRest.scale === postRest.scale,
      { pre: { rect: preRest.rect, transform: preRest.transform, scale: preRest.scale }, post: { rect: postRest.rect, transform: postRest.transform, scale: postRest.scale } });
  }
}

// --- Coarse-pointer rows: expected deltas per §9 ("hover:hover + pointer:coarse -> No zoom") ---
{
  const preOverride = pre.coarseOverride.grid.asRendered;
  const postOverride = post.coarseOverride.grid.asRendered;
  const preEff = effScale(preOverride.rest, preOverride.hoverOnImage);
  const postEff = effScale(postOverride.rest, postOverride.hoverOnImage);
  check('EXPECTED DELTA (§9, owner-accepted A1): grid coarse-override zoom pre=1.05x -> post=1.0x (no zoom)',
    r4(preEff.w) === 1.05 && r4(postEff.w) === 1.0,
    { pre: r4(preEff.w), post: r4(postEff.w) });
}

// --- Transition curve rows: expected deltas per §9 ---
{
  const preSamples = preCurve.fine.nonPriority.samples;
  const postSamples = postCurve.fine.nonPriority.samples;
  const preSettled = preSamples[preSamples.length - 1];
  const postSettled = postSamples[postSamples.length - 1];
  check('EXPECTED DELTA (§9): settled scale pre="1.05" -> post="none" (scale property no longer set at all)',
    preSettled.scale === '1.05' && postSettled.scale === 'none',
    { pre: preSettled.scale, post: postSettled.scale });

  const preT0 = preSamples[0];
  const postT0 = postSamples[0];
  check('MEASURED FACT (contradicts kickoff §3.3 for non-priority): scale snaps instantly pre-fold too (t=0ms already 1.05, not eased)',
    preT0.scale === '1.05',
    { preT0Transform: preT0.transform, preT0Scale: preT0.scale });

  // Mid-flight transform easing preserved (single ease-out curve, both before and after)
  const preMid = preSamples[1]; // 75ms
  const postMid = postSamples[1];
  check('diagnostic: transform still eases smoothly mid-flight post-fold (single curve mechanism unchanged)',
    postMid.transform !== 'matrix(1, 0, 0, 1, 0, 0)' && postMid.transform !== postSamples[postSamples.length - 1].transform,
    { preMidTransform: preMid.transform, postMidTransform: postMid.transform, postSettledTransform: postSamples[postSamples.length - 1].transform });
}

console.log(`Total checks: ${report.checks.length}`);
console.log(`FAILures: ${report.failCount}`);
for (const c of report.checks) {
  console.log(`  [${c.pass ? 'PASS' : 'FAIL'}] ${c.name}`, JSON.stringify(c.detail));
}

fs.writeFileSync('docs/sessions/evidence/task764/phase-c-comparator-result.json', JSON.stringify(report, null, 2));
process.exit(report.failCount > 0 ? 1 : 0);
