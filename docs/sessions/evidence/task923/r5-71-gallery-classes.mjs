/**
 * r5-71-gallery-classes.mjs - the remaining `gallery-track` details of the Revision 4 full run, by kind (Task 923, R22, AC21)
 *
 *   node docs/sessions/evidence/task923/r5-71-gallery-classes.mjs [rows.jsonl]
 * Takes the same details as `r5-70-d16-classes.mjs` (a positioned / transformed `component-overflow` detail of the gallery
 * Stories, not Leaflet and not an image layer) and sorts each into:
 *   (i)  a y-axis "<n> / <N>" counter detail (859 R58);
 *   (ii) a track detail whose `holds` names a tabbable, named slide `button` (the gallery desync, R22 / R23);
 *   other - anything else (AC21: must be 0).
 * It prints the counts by Story and every `other` detail. It also counts, for information, the in-flow detail that names a
 * `button` x-range past a `div` (the visible slide measured against its displaced track box; not a positioned detail).
 */
import { readFileSync } from 'node:fs';
const path = process.argv[2] ?? 'docs/sessions/evidence/task923/r5-full/rows.jsonl';
const rows = readFileSync(path, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const POS = /\((absolute|fixed|transformed|absolute\+transformed|fixed\+transformed)\) ([xy]) ([-\d.]+)\.\.([-\d.]+) past (\S+) ([-\d.]+)\.\.([-\d.]+)/;
const GALLERY = /lightboxview|listingdetailview|listingdetailpattern|listinggallerypattern/;
const kinds = { counter: {}, 'holds-named-tabbable-button': {}, other: {}, 'in-flow slide button': {} };
const others = [];
for (const r of rows) {
  for (const d of r.rules['component-overflow']) {
    if (!POS.test(d)) {
      if (GALLERY.test(r.story) && /^button\S* "" x [-\d.]+\.\.[-\d.]+ past div [-\d.]+\.\.[-\d.]+$/.test(d)) kinds['in-flow slide button'][r.story] = (kinds['in-flow slide button'][r.story] ?? 0) + 1;
      continue;
    }
    const cls = /leaflet/.test(d) ? 'leaflet' : /admindashboardview|semidonut/.test(r.story) ? 'chart' : /_imageLayer_/.test(d) ? 'image-layer' : GALLERY.test(r.story) ? 'gallery-track' : 'other';
    if (cls !== 'gallery-track') continue;
    const kind = /^div "\d+ \/ \d+" \(absolute\) y /.test(d) ? 'counter' : /^div "" \(transformed\) x .* holds button\S* "[^"]+"$/.test(d) ? 'holds-named-tabbable-button' : 'other';
    kinds[kind][r.story] = (kinds[kind][r.story] ?? 0) + 1;
    if (kind === 'other') others.push(`${r.story} ${r.root} ${r.width} :: ${d}`);
  }
}
const total = (k) => Object.values(kinds[k]).reduce((a, b) => a + b, 0);
console.log(`platform ${process.platform} node ${process.version}`);
console.log(`input ${path}`);
console.log(`(i) y-axis counter details: ${total('counter')}  ${JSON.stringify(kinds.counter)}`);
console.log(`(ii) track details that hold a named, tabbable slide button: ${total('holds-named-tabbable-button')}  ${JSON.stringify(kinds['holds-named-tabbable-button'])}`);
console.log(`track details of any other kind (AC21: must be 0): ${total('other')}`);
for (const o of others) console.log(`  OTHER ${o}`);
console.log(`for information - in-flow detail "button x..x past div" (visible slide against its displaced track box): ${total('in-flow slide button')}  ${JSON.stringify(kinds['in-flow slide button'])}`);
