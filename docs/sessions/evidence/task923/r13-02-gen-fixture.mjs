/**
 * r13-02-gen-fixture.mjs - generator of the self-test fixture of Revision 13 (Task 923, R57). Pattern of `fromPlanted` in r12-02-gen-fixtures.mjs.
 *
 * Run from the repository root:  node docs/sessions/evidence/task923/r13-02-gen-fixture.mjs
 * It writes `scripts/__fixtures__/rendered-state-census/html-text-overlap-in-inert-dialog-pinned-below.html`, a copy of Opus's planted page
 * `review-13/fixtures/planted-inert-self-overlap-pinned-below.html` (the page is copied, review-13/ stays unchanged) with its comment, title and state ids renamed:
 * two lines overlapping inside the inert dialog, the dialog above them moved off them, and one opaque card that is PINNED (`position: fixed`) in the app root below the portal.
 * Nothing lies above the two lines, so text-overlap fails on `portal:0` (`app` green). It is the page that tells R53's own guard (`upto = i`: only what is painted above the text
 * counts) from R54's `isCover`: the pinned card passes R54's test, so only the guard keeps it from hiding the overlap.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join('scripts', '__fixtures__', 'rendered-state-census');
const REVIEW = join('docs', 'sessions', 'evidence', 'task923', 'review-13', 'fixtures');
const planted = 'planted-inert-self-overlap-pinned-below';
const name = 'html-text-overlap-in-inert-dialog-pinned-below';
const comment = 'Copy of review-13/fixtures/planted-inert-self-overlap-pinned-below.html. Two lines overlapping inside the inert dialog, the dialog above it moved off them, and one opaque card that is PINNED (`position: fixed`) in the app root below the portal. Nothing lies above the two lines: text-overlap fails on the portal root (app green). The pinned card is a cover by R54\'s test, so only R53\'s own guard (only boxes painted above the text count) keeps it from hiding the overlap.';

let html = readFileSync(join(REVIEW, `${planted}.html`), 'utf8');
const stateOld = `{"id":"${planted}","story":"${planted}"`;
if (!html.includes(stateOld)) throw new Error(`no state ${planted}`);
html = html.replace(stateOld, `{"id":"fixture-${name}","story":"${name}"`);
html = html.replace('rendered state census fixture: html-text-over-inert-dialog', `rendered state census fixture: ${name}`);
html = html.replace(/<!-- Task 923[\s\S]*?fixture "html-text-over-inert-dialog"[\s\S]*?-->/, () => `<!-- Task 923 Revision 13 self-test fixture "${name}". ${comment} -->`);
if (!html.includes(`fixture "${name}"`) || !html.includes(`fixture: ${name}`) || !html.includes(`fixture-${name}`)) throw new Error('not retargeted');
writeFileSync(join(DIR, `${name}.html`), html);
console.log(`wrote ${name}.html`);
