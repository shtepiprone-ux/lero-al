/**
 * r12-02-gen-fixtures.mjs - generator of the self-test fixtures of Revision 12 (Task 923, R53, R54). Pattern of r10-102-gen-fixtures.mjs.
 *
 * Run from the repository root:  node docs/sessions/evidence/task923/r12-02-gen-fixtures.mjs
 * It writes into `scripts/__fixtures__/rendered-state-census/`:
 *  R53 (an inert layer's text is covered only by what is painted above it) - copies of Opus's planted pages `review-12/fixtures/` (the pages are copied, review-12/ stays unchanged):
 *    `html-text-over-inert-dialog-opaque-below`  = planted-opaque-below.html: the failing twin `html-text-over-inert-dialog` plus one opaque card in the app root BELOW the portal. Red on `portal:0`.
 *    `html-text-overlap-in-inert-dialog`         = planted-inert-self-overlap.html: two lines overlapping inside the inert dialog, the upper dialog moved off them, the same card below. Red on `portal:0`.
 *  R54 (an opaque box hides text only when it is pinned or floating over it):
 *    `html-text-under-opaque`                    REBUILT: a `position: sticky` header in a scroll container with the content under it (the Revision 7 header was `position: absolute`). Green.
 *    `html-text-under-opaque-below-fold`         REBUILT: the same below the fold, its comment without the map wording. Green.
 *    `html-text-under-floating-menu`             NEW: an inline `role="menu"` box over page text. Green.
 *    `html-text-under-control`                   NEW: an opaque, absolutely positioned control of the same layer over a popup-like box's text, inside the viewport. Red on the app root.
 *    `html-text-under-control-below-fold`        NEW: the same below the fold. Red on the app root.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join('scripts', '__fixtures__', 'rendered-state-census');
const REVIEW = join('docs', 'sessions', 'evidence', 'task923', 'review-12', 'fixtures');
const dialogMarker = "'<h2>Dialog title</h2><p>Short body text.</p>'";
const appMarker = '<p>Fixture page, not a product Story.</p>';
const write = (name, html) => { writeFileSync(join(DIR, `${name}.html`), html); console.log(`wrote ${name}.html`); };

function fromClean(name, comment) {
  let html = readFileSync(join(DIR, 'clean.html'), 'utf8');
  html = html.replace('rendered state census fixture: clean', `rendered state census fixture: ${name}`);
  html = html.replace(/<!-- Task 923[\s\S]*?fixture "clean"[\s\S]*?-->/, `<!-- Task 923 Revision 12 self-test fixture "${name}". ${comment} -->`);
  html = html.replace('"id":"fixture-clean","story":"clean"', `"id":"fixture-${name}","story":"${name}"`);
  if (!html.includes(`fixture-${name}`) || !html.includes(`fixture "${name}"`)) throw new Error(`${name}: clean.html was not retargeted`);
  return html;
}

// ---- R53: Opus's planted pages, copied under the names of the kickoff ----
function fromPlanted(file, planted, name, comment) {
  let html = readFileSync(join(REVIEW, file), 'utf8');
  const stateOld = `{"id":"${planted}","story":"${planted}"`;
  if (!html.includes(stateOld)) throw new Error(`${file}: no state ${planted}`);
  html = html.replace(stateOld, `{"id":"fixture-${name}","story":"${name}"`);
  html = html.replace('rendered state census fixture: html-text-over-inert-dialog', `rendered state census fixture: ${name}`);
  html = html.replace(/<!-- Task 923[\s\S]*?fixture "html-text-over-inert-dialog"[\s\S]*?-->/, `<!-- Task 923 Revision 12 self-test fixture "${name}". ${comment} -->`);
  if (!html.includes(`fixture "${name}"`) || !html.includes(`fixture: ${name}`)) throw new Error(`${file}: not retargeted`);
  write(name, html);
}
fromPlanted('planted-opaque-below.html', 'planted-opaque-below', 'html-text-over-inert-dialog-opaque-below',
  'Copy of review-12/fixtures/planted-opaque-below.html. The failing twin html-text-over-inert-dialog (an inert dialog whose title is printed on the title of the transparent dialog above it, both seen) plus one opaque card in the app root BELOW the portal. A box painted below the text hides nothing: text-overlap fails on the portal root.');
fromPlanted('planted-inert-self-overlap.html', 'planted-inert-self-overlap', 'html-text-overlap-in-inert-dialog',
  'Copy of review-12/fixtures/planted-inert-self-overlap.html. Two lines overlapping inside the inert dialog, the dialog above it moved off them, and one opaque card in the app root below the portal. Nothing lies above the two lines: text-overlap fails on the portal root.');

// ---- R54 ----
const stickyPair = '<div style="height:60px;overflow-y:auto;position:relative"><div style="position:sticky;top:0;height:24px;background:#fff;z-index:1"><span>Pinned header text</span></div><div style="height:24px;margin-top:-24px"><span>Content scrolled under the header</span></div><div style="height:120px"></div></div>';
{
  const name = 'html-text-under-opaque';
  let html = fromClean(name, 'Content text that scrolled beneath an opaque header that is PINNED (`position: sticky` in a scroll container); the header text is printed over its own box. The covered text is not seen: text-overlap stays green. (Rebuilt in Revision 12: the Revision 7 header was `position: absolute`, not a pinned box.)');
  if (!html.includes(dialogMarker)) throw new Error('clean.html has no dialog body marker');
  html = html.replace(dialogMarker, `${dialogMarker} + ${JSON.stringify(stickyPair)}`);
  write(name, html);
}
// spacerPx: the pair lies this far down the app root. 320px clears the open dialog of clean.html (it covers about 48..270px: text under an opaque FIXED dialog is covered by it, which would hide the cases);
// 1 100px is below the 844px fold
function inApp(name, comment, content, spacerPx) {
  let html = fromClean(name, comment);
  if (!html.includes(appMarker)) throw new Error('clean.html has no app marker');
  html = html.replace(appMarker, `${appMarker}\n  ${spacerPx ? `<div style="height:${spacerPx}px"></div>` : ''}${content}`);
  write(name, html);
}
inApp('html-text-under-opaque-below-fold',
  'A line of text 1 100px down the page (below the 844px fold) under an opaque header that is PINNED (`position: sticky` in a scroll container). The covered text is not seen: text-overlap stays green on the app root, as it does for the same pair inside the viewport. (Rebuilt in Revision 12; the R52 comment named a map popup, which is not a pinned box.)',
  stickyPair, 1100);
inApp('html-text-under-floating-menu',
  'A line of page text with an opaque box that is FLOATING over it (`role="menu"`, absolutely positioned), like a dropdown over the page: the covered text is not seen, text-overlap stays green on the app root.',
  '<div style="position:relative;height:30px"><span style="position:absolute;left:0;top:0">Page text under the menu</span><div role="menu" style="position:absolute;left:0;top:0;width:280px;height:24px;background:#fff"><span role="menuitem">Menu item</span></div></div>',
  320);
const control = '<div style="position:relative;height:48px;width:300px;border:1px solid #999"><span style="position:absolute;left:8px;top:12px">Popup title text</span><a href="#" role="button" style="position:absolute;left:0;top:0;width:44px;height:44px;background:#fff;display:flex;align-items:center;justify-content:center;text-decoration:none;color:#000">&minus;</a></div>';
inApp('html-text-under-control',
  'A popup-like box whose title is partly under an opaque, absolutely positioned control of the SAME layer (a map zoom control over a popup title), inside the viewport. The control is neither pinned nor floating over the page: the title is text a person can neither read nor scroll out from under, text-overlap fails on the app root.',
  control, 320);
inApp('html-text-under-control-below-fold',
  'The same popup-like box 1 100px down the page (below the 844px fold): the verdict does not depend on where the box lies. text-overlap fails on the app root.',
  control, 1100);
