// Review 4 (Opus): one line per fact from rv4-gallery-probe.txt.  node docs/sessions/evidence/task923/review-4/rv4-gallery-summary.mjs
import { readFileSync } from 'node:fs';
console.log(`platform ${process.platform} node ${process.version}`);
const t = readFileSync('docs/sessions/evidence/task923/review-4/rv4-gallery-probe.txt', 'utf8');
for (const blk of t.split('\n== ').slice(1)) {
  const [h, ...rest] = blk.split('\n');
  const j = JSON.parse(rest.join('\n').replace(/EXIT_CODE=0[\s\S]*/, ''));
  for (const tr of j.tracks.slice(0, 1)) {
    const [bl, br] = tr.bound[1];
    const outside = tr.slides.filter((s) => s.box[1] <= bl + 0.5 || s.box[0] >= br - 0.5);
    const inside = tr.slides.filter((s) => s.box[0] >= bl - 0.5 && s.box[1] <= br + 0.5);
    console.log(`${h} track: box x ${tr.track[0]}..${tr.track[1]} bound x ${bl}..${br}; slides wholly outside ${outside.length}, of them aria-hidden+tabindex=-1+no text ${outside.filter((s) => s.ariaHidden === 'true' && s.tabindex === '-1' && !s.text).length}; slides inside ${inside.length}, tabbable and named: ${inside.map((s) => `${s.tag} tabindex=${s.tabindex} label="${s.label}"`).join(', ')}`);
  }
  if (!j.tracks.length) console.log(`${h} track: none (desktop branch)`);
  const c = j.counters[0];
  if (c) console.log(`${h} counter: "${c.text}" y ${c.box[2]}..${c.box[3]} bound y ${c.bound[1][2]}..${c.bound[1][3]}; computed top ${c.top} bottom ${c.bottom} left ${c.left}; inline style "${c.inlineStyle}"`);
}
console.log('EXIT_CODE=0');
