// Review 5 probe fixtures (diagnosis only): the faithful gallery DOM - in-flow, shrink-0 slides in a transformed flex
// track inside an overflow:hidden frame - built from scripts/__fixtures__/rendered-state-census/track-active-slide-inside.html.
import { readFileSync, writeFileSync } from 'node:fs';
const base = readFileSync('scripts/__fixtures__/rendered-state-census/track-active-slide-inside.html', 'utf8');
const IMG = '<img alt=\\"\\" src=\\"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==\\" style=\\"display:block;width:120px;height:80px\\">';
const hidden = `<button type=\\"button\\" aria-hidden=\\"true\\" tabindex=\\"-1\\" style=\\"flex:0 0 120px;width:120px;height:80px;padding:0;border:0\\">${IMG}</button>`;
const named = (n) => `<button type=\\"button\\" aria-label=\\"${n}\\" style=\\"flex:0 0 120px;width:120px;height:80px;padding:0;border:0\\">${IMG}</button>`;
const textSlide = '<div style=\\"flex:0 0 120px;width:120px;height:80px\\">Caption of slide two</div>';
const frame = (shift, slides) => `<div style=\\"margin:8px 0 8px 180px\\"><div style=\\"overflow:hidden;position:relative;width:120px;height:80px;background:#eee\\"><div style=\\"display:flex;width:120px;height:80px;transform:translateX(${shift}px)\\">${slides}</div></div></div>`;
const cases = {
  // synced gallery, active slide 1: what MantineListingGalleryPattern renders (C80/C82 shape)
  'rv5-flex-track-synced': frame(-120, hidden + named('Slide two') + hidden),
  // index 0 (identity transform): a text slide wholly outside the frame, not hidden from AT
  'rv5-flex-track-offscreen-text': frame(0, named('Slide one') + textSlide),
};
const anchor = base.match(/"<div style=\\"margin:8px 0 8px 180px\\">.*?<\/div><\/div><\/div>"/s)[0];
for (const [name, markup] of Object.entries(cases)) {
  const html = base.replaceAll('track-active-slide-inside', name).replace(anchor, `"${markup}"`);
  writeFileSync(`docs/sessions/evidence/task923/review-5/fixtures/${name}.html`, html);
  console.log('wrote', name, html.includes(markup));
}
