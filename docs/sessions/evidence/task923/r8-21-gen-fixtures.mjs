/**
 * r8-21-gen-fixtures.mjs - generator of the self-test fixtures added in Revision 7 by the Story loop (Task 923, R33 (i)).
 *
 * Run from the repository root:  node docs/sessions/evidence/task923/r8-21-gen-fixtures.mjs
 * It writes into `scripts/__fixtures__/rendered-state-census/`, each page being `clean.html` plus one element inside the dialog:
 *  - `loading-label-invisible.html` (Story 018): a button in the stock Mantine loading state, its label slid out of the clipping
 *    button and not painted (`opacity: 0`, `translateY`). Text that is not painted is not hidden text: `text-hidden` stays green.
 *  - `scroll-row-in-dialog.html` (Story 021): a wide row inside a parent that scrolls horizontally (`overflow-x: auto`), as the
 *    lightbox thumbnail strip does. What lies past the right edge is reached by scrolling: `component-overflow` stays green.
 *  - `day-cells-exempt.html` / `day-cells-unexempt.html` (owner D9, RangeDatePicker): three 39px `.day` buttons in the dialog. In the first the
 *    state declares `exemptTargets: ".day"` with an `ownerDecision`: target-small stays green and the row counts 3 exempted controls; the
 *    second has the same buttons and no exemption: target-small fails on the portal root.
 *  - `scroll-viewport-wrapper.html` (Story 073): a Mantine ScrollArea shape - a viewport that scrolls horizontally (`overflow-x: scroll`,
 *    `overflow-y: hidden`), a content wrapper with `overflow: visible`, and a row wider than both. The row is reached by scrolling:
 *    `component-overflow` and `text-hidden` stay green.
 *  - `email-longer-than-box.html` (Story 075): an e-mail address wider than its box; the theme `Text` breaks it inside the word (Task 859
 *    R85): `word-split` stays green.
 *  - `bordered-input-wrapper.html` (Story 149): a 42px `input` inside its 44px bordered wrapper (the PasswordInput shape): the wrapper is the
 *    touch area, `target-small` stays green.
 *  - `scroll-rail-past-viewport.html` (Story 176): a rail that scrolls horizontally (`overflow-x: auto`, its box inside the viewport) whose items
 *    lie past the viewport edge: `viewport-overflow` stays green.
 *  - `inert-dialog-covered.html` (Story 199): a dialog that is `inert` (covered by another dialog) holding a 32px control under an overlay:
 *    `target-small` and `action-covered` stay green and the row counts it as skipped.
 *  - `canvas-taller-than-box-exempt.html` / `canvas-taller-than-box-unexempt.html` (owner D10, semi-donut): a `.canvas` box (with an svg) 240px tall inside a 120px
 *    box, as the Apex pie canvas inside the semi-donut pattern. In the first the state declares `exemptOverflow: ".canvas"` with an `ownerDecision`: component-overflow
 *    stays green and the row counts 1 exempted box or more; the second has the same canvas and no exemption: component-overflow fails on the portal root.
 *  - Revision 7, owner 2026-10-17 (the gate measured nothing inside an svg): `svg-labels-overlap` (eight axis labels turned -45 degrees and 4px apart, as the old
 *    dashboard trend chart printed them: text-overlap fails), `svg-labels-clear` (the same turned labels 20px apart: their axis-aligned boxes cross, the labels
 *    do not, so green proves the test follows the turn), `svg-labels-unpainted` (overlapping labels with opacity 0: green), `svg-label-clipped` (a label past
 *    the right edge of its svg: svg-text-clipped fails), `html-text-overlap` (two lines of text printed on one another) and `html-lines-tight` (two stacked lines
 *    with line-height 1.1: green), `html-text-under-opaque` (text that scrolled beneath an opaque pinned header, whose own text is printed over its
 *    box: the covered text is not seen, green) and `html-text-clipped-away` (the part of a line a scroll box cuts away overlaps a pinned footer: not
 *    seen, green).
 * The app root is green in all.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join('scripts', '__fixtures__', 'rendered-state-census');
const marker = "'<h2>Dialog title</h2><p>Short body text.</p>'";

function fixture(name, comment, extra, exempt = false) {
  // exempt: false (no exemption), true / 'targets' (exemptTargets ".day", owner D9) or 'overflow' (exemptOverflow ".canvas", owner D10)
  let html = readFileSync(join(DIR, 'clean.html'), 'utf8');
  html = html.replace('rendered state census fixture: clean', `rendered state census fixture: ${name}`);
  html = html.replace('<!-- Task 923 self-test fixture "clean". See scripts/check-rendered-state-census.mjs --verify-gate. -->', `<!-- Task 923 Revision 7 self-test fixture "${name}". ${comment} -->`);
  html = html.replace('"id":"fixture-clean","story":"clean"', `"id":"fixture-${name}","story":"${name}"`);
  if (!html.includes(marker)) throw new Error('clean.html has no dialog body marker');
  if (exempt === true || exempt === 'targets') html = html.replace('"portals":1,', '"portals":1,"exemptTargets":".day","ownerDecision":"owner D9 2026-10-16: the day cells of the calendar stay 39px (documented exemption 6t, Tasks 558-561)",');
  if (exempt === 'overflow') html = html.replace('"portals":1,', '"portals":1,"exemptOverflow":".canvas","ownerDecision":"owner D10 2026-10-17: the semi-donut chart stays as it is; its canvas is taller than its box",');
  html = html.replace(marker, `${marker} + ${JSON.stringify(extra)}`);
  writeFileSync(join(DIR, `${name}.html`), html);
  console.log(`wrote ${name}.html`);
}

fixture('loading-label-invisible',
  'The dialog holds a button in the stock Mantine loading state: its label is slid out of the clipping button and not painted (opacity 0). Text that is not painted is not hidden text; text-hidden stays green.',
  '<button type="button" style="overflow:hidden;height:44px;width:160px;padding:0;position:relative"><span style="display:block;opacity:0;transform:translateY(28px)">Alba Krasniqi account</span></button>');

fixture('scroll-row-in-dialog',
  'The dialog holds a row wider than its parent, and the parent scrolls horizontally (overflow-x auto), like the lightbox thumbnail strip. What lies past the right edge is reached by scrolling; component-overflow stays green.',
  '<div style="overflow-x:auto;width:150px"><div style="display:flex;gap:8px;width:300px"><span>first thumbnail</span><span>second thumbnail</span></div></div>');

const days = '<div><button type="button" class="day" style="min-width:0;min-height:0;width:39px;height:39px">1</button><button type="button" class="day" style="min-width:0;min-height:0;width:39px;height:39px">2</button><button type="button" class="day" style="min-width:0;min-height:0;width:39px;height:39px">3</button></div>';

fixture('day-cells-exempt',
  'The dialog holds three 39px day buttons and the registry state exempts them (exemptTargets .day + ownerDecision, owner D9). target-small stays green; the row counts the three exempted controls.',
  days, true);

fixture('day-cells-unexempt',
  'The same three 39px day buttons without any exemption in the state: target-small fails on the portal root.',
  days, false);

fixture('scroll-viewport-wrapper',
  'A Mantine ScrollArea shape: a viewport that scrolls horizontally (overflow-x scroll, overflow-y hidden), a content wrapper with overflow visible, and a row wider than both. The row is reached by scrolling; component-overflow and text-hidden stay green.',
  '<div style="overflow-x:scroll;overflow-y:hidden;width:150px"><div style="overflow:visible"><div style="display:inline-flex;gap:8px;width:300px"><span>first thumbnail</span><span>second thumbnail</span></div></div></div>');

fixture('email-longer-than-box',
  'An e-mail address wider than its 120px box. The theme Text breaks a long unbroken token inside the word (Task 859 R85, GR-3i): word-split stays green.',
  '<p style="width:120px;margin:0;overflow-wrap:break-word">arben.gjergj.krasniqi.marashi@example-domain.com</p>');

fixture('bordered-input-wrapper',
  'A 42px input inside its 44px bordered wrapper (a PasswordInput shape). The wrapper is the touch area; target-small stays green.',
  '<div style="border:1px solid #888;border-radius:8px;min-height:44px;box-sizing:border-box"><input aria-label="Password" style="display:block;width:100%;height:42px;border:0;padding:0 8px;margin:0;box-sizing:border-box;font:inherit"></div>');

fixture('scroll-rail-past-viewport',
  'A rail that scrolls horizontally (overflow-x auto, its box inside the viewport) with items past the viewport edge, like a carousel of cards. viewport-overflow stays green.',
  '<div style="overflow-x:auto;width:200px"><div style="display:flex;width:700px"><span>first card</span><span style="margin-left:450px">last card</span></div></div>');

fixture('inert-dialog-covered',
  'The dialog holds an inert subtree (a dialog covered by another one) with a 32px control under an overlay. An inert control cannot be operated: the action rules skip it and the row counts it.',
  '<div style="position:relative;width:120px;height:44px"><div inert aria-hidden="true"><button type="button" style="min-width:0;min-height:0;width:32px;height:32px">x</button></div><div style="position:absolute;inset:0;background:rgba(0,0,0,.2)"></div></div>');

const canvas = '<div style="height:120px"><div class="canvas" style="height:240px"><svg width="240" height="240" viewBox="0 0 240 240"><text x="10" y="20">Chart</text></svg></div></div>';

fixture('canvas-taller-than-box-exempt',
  'The dialog holds a 240px tall chart canvas inside a 120px box (the Apex pie canvas of the semi-donut) and the registry state exempts it (exemptOverflow .canvas + ownerDecision, owner D10). component-overflow stays green; the row counts the exempted box.',
  canvas, 'overflow');

fixture('canvas-taller-than-box-unexempt',
  'The same canvas taller than its box without any exemption in the state: component-overflow fails on the portal root.',
  canvas, false);

const turned = (gap, extra = '') => '<svg width="300" height="120" viewBox="0 0 300 120" role="img" aria-label="axis">' + Array.from({ length: 8 }, (_, i) => `<text transform="translate(${30 + i * gap},110) rotate(-45)" font-size="12" ${extra}>Sep ${17 + i}</text>`).join('') + '</svg>';

fixture('svg-labels-overlap',
  'Eight chart axis labels turned -45 degrees and 4px apart, printed over one another like the old dashboard trend chart. text-overlap fails on the portal root.',
  turned(4));

fixture('svg-labels-clear',
  'The same turned labels 20px apart. Their axis-aligned boxes cross but the labels do not: text-overlap stays green because the test follows the turn.',
  turned(20));

fixture('svg-labels-unpainted',
  'Overlapping turned labels that are not painted (opacity 0): not text a person reads, text-overlap stays green.',
  turned(4, 'opacity="0"'));

fixture('svg-label-clipped',
  'An axis label that runs past the right edge of its svg (the svg hides its overflow): svg-text-clipped fails on the portal root.',
  '<svg width="120" height="40" viewBox="0 0 120 40" role="img" aria-label="axis"><text x="70" y="24" font-size="14">Long axis label</text></svg>');

fixture('html-text-overlap',
  'Two lines of text printed on one another (absolutely positioned in one box): text-overlap fails on the portal root.',
  '<div style="position:relative;height:30px"><span style="position:absolute;left:0;top:0">First line of text</span><span style="position:absolute;left:10px;top:2px">Second line of text</span></div>');

fixture('html-lines-tight',
  'Two stacked lines with line-height 0.85: their content boxes cross by a quarter of a line but the glyph lines do not. text-overlap stays green.',
  '<div style="line-height:.85">First line of text</div><div style="line-height:.85">Second line of text</div>');

fixture('html-text-under-opaque',
  'Content text that scrolled beneath an opaque pinned header; the header text is printed over its own box. The covered text is not seen: text-overlap stays green.',
  '<div style="position:relative;height:30px"><span style="position:absolute;left:0;top:0">Content scrolled under the header</span><div style="position:absolute;left:0;top:0;width:280px;height:24px;background:#fff"><span>Pinned header text</span></div></div>');

fixture('html-text-clipped-away',
  'The second row of a box that clips its overflow lies where a pinned footer is printed. The clipped part is not seen: text-overlap stays green.',
  '<div style="position:relative;height:40px"><div style="height:20px;overflow-y:auto;line-height:20px"><div>Row one</div><div>Row two</div></div><div style="position:absolute;left:0;top:20px;line-height:20px">Pinned footer</div></div>');
