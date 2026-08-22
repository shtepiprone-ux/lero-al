// Task 763 — I4 comparator. Cell-by-cell diff of pre-edit (I2) vs post-edit (I4) computed styles,
// per kickoff §10.4's explicit pass rule: geometry byte-identical; state/hover identical per state.
import fs from 'fs';

const pre = JSON.parse(fs.readFileSync('docs/sessions/evidence/task763/i2/capture-pre-edit.json', 'utf8'));
const post = JSON.parse(fs.readFileSync('docs/sessions/evidence/task763/i4/capture-post-edit.json', 'utf8'));

let totalCells = 0;
let deltas = [];

function diffGeo(a, b, label) {
  for (const k of Object.keys(a)) {
    totalCells++;
    if (a[k] !== b[k]) {
      deltas.push({ label, prop: k, pre: a[k], post: b[k] });
    }
  }
}

for (const storyId of Object.keys(pre)) {
  const preStory = pre[storyId];
  const postStory = post[storyId];
  if (!postStory) { deltas.push({ label: storyId, prop: '(whole story)', pre: 'present', post: 'MISSING' }); continue; }

  for (const width of Object.keys(preStory.widths)) {
    for (const locale of Object.keys(preStory.widths[width])) {
      const preImgs = preStory.widths[width][locale];
      const postImgs = postStory.widths[width]?.[locale];
      if (!postImgs) { deltas.push({ label: `${storyId}@${width}/${locale}`, prop: '(whole cell)', pre: 'present', post: 'MISSING' }); continue; }
      if (preImgs.length !== postImgs.length) {
        deltas.push({ label: `${storyId}@${width}/${locale}`, prop: 'img count', pre: preImgs.length, post: postImgs.length });
      }
      const n = Math.min(preImgs.length, postImgs.length);
      for (let i = 0; i < n; i++) {
        diffGeo(preImgs[i].containerComputed, postImgs[i].containerComputed, `${storyId}@${width}/${locale}[${i}].container`);
        diffGeo(preImgs[i].imgComputed, postImgs[i].imgComputed, `${storyId}@${width}/${locale}[${i}].img`);
        diffGeo(preImgs[i].imgState, postImgs[i].imgState, `${storyId}@${width}/${locale}[${i}].state`);
      }
    }
  }

  // Hover comparison
  const preHover = preStory.hover1024en || [];
  const postHover = postStory.hover1024en || [];
  const hn = Math.min(preHover.length, postHover.length);
  for (let i = 0; i < hn; i++) {
    totalCells += 2;
    if (preHover[i].hoverTransform !== postHover[i].hoverTransform) {
      deltas.push({ label: `${storyId}.hover[${i}]`, prop: 'hoverTransform', pre: preHover[i].hoverTransform, post: postHover[i].hoverTransform });
    }
    if (preHover[i].hoverFilter !== postHover[i].hoverFilter) {
      deltas.push({ label: `${storyId}.hover[${i}]`, prop: 'hoverFilter', pre: preHover[i].hoverFilter, post: postHover[i].hoverFilter });
    }
  }
}

console.log(`Total cells compared: ${totalCells}`);
console.log(`Deltas found: ${deltas.length}`);
for (const d of deltas) {
  console.log(`  DELTA ${d.label} :: ${d.prop} :: PRE=${JSON.stringify(d.pre)} POST=${JSON.stringify(d.post)}`);
}

fs.writeFileSync('docs/sessions/evidence/task763/i4/diff-result.json', JSON.stringify({ totalCells, deltaCount: deltas.length, deltas }, null, 2));
process.exit(deltas.length > 0 ? 1 : 0);
