// Review 4 (Opus): per probe run, which track slide is in the frame and which slide is the named, tabbable one.
// Input: rv4-gallery-probe.txt (run 1) and rv4-gallery-probe-2.txt (run 2); both load the detail pattern first, then
// the gallery pattern in the same page.  node docs/sessions/evidence/task923/review-4/rv4-gallery-sync.mjs
import { readFileSync } from 'node:fs';
console.log(`platform ${process.platform} node ${process.version}`);
for (const f of ['rv4-gallery-probe.txt', 'rv4-gallery-probe-2.txt']) {
  const t = readFileSync(`docs/sessions/evidence/task923/review-4/${f}`, 'utf8');
  for (const blk of t.split('\n== ').slice(1)) {
    const [h, ...r] = blk.split('\n');
    const j = JSON.parse(r.join('\n').replace(/EXIT_CODE=0[\s\S]*/, ''));
    const tr = j.tracks[0];
    if (!tr) continue;
    const [bl, br] = tr.bound[1];
    const shown = tr.slides.findIndex((s) => s.box[0] >= bl - 0.5 && s.box[1] <= br + 0.5);
    const named = tr.slides.findIndex((s) => s.label);
    const s = tr.slides[shown];
    console.log(`${f} ${h}: track box x ${tr.track[0]}..${tr.track[1]}; slide in the frame #${shown} (aria-hidden ${s.ariaHidden}, tabindex ${s.tabindex}); named tabbable slide #${named} at x ${tr.slides[named].box[0]}..${tr.slides[named].box[1]}; in sync ${shown === named}`);
  }
}
console.log('EXIT_CODE=0');
