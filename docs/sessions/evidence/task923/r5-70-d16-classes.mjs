// Review 3 (Opus): the positioned / transformed component-overflow details of r3-full by class and geometry.
import { readFileSync } from 'node:fs';
const L = readFileSync('docs/sessions/evidence/task923/r5-full/rows.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const cls = {}; const ex = {};
for (const r of L) for (const d of r.rules['component-overflow']) {
  const m = d.match(/\((absolute|fixed|transformed|absolute\+transformed|fixed\+transformed)\) ([xy]) ([-\d.]+)\.\.([-\d.]+) past (\S+) ([-\d.]+)\.\.([-\d.]+)/); if (!m) continue;
  const A = +m[3], B = +m[4], Lb = +m[6], Rb = +m[7];
  const geo = B <= Lb + 0.5 || A >= Rb - 0.5 ? 'wholly-out' : A <= Lb + 0.5 && B >= Rb - 0.5 ? 'covers' : 'partial';
  const c = /leaflet/.test(d) ? 'leaflet' : /admindashboardview|semidonut/.test(r.story) ? 'chart' : /_imageLayer_/.test(d) ? 'image-layer' : /lightboxview|listingdetailview|listingdetailpattern|listinggallerypattern/.test(r.story) ? 'gallery-track' : 'other';
  const k = `${c} ${geo} ${d.split(' ')[0].split('.')[0]}`; cls[k] = (cls[k] ?? 0) + 1; ex[k] ??= `${r.story} ${r.root} ${r.width} :: ${d}`;
}
for (const k of Object.keys(cls).sort()) console.log(`${cls[k]} ${k} -- e.g. ${ex[k]}`);
