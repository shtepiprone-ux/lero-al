/**
 * r10-102-gen-fixtures.mjs - generator of the self-test fixtures added in Revision 11 by the R33 handling of AC36's final full run (Task 923, R52, R33 (i)). Pattern of r8-21-gen-fixtures.mjs.
 *
 * Run from the repository root:  node docs/sessions/evidence/task923/r10-102-gen-fixtures.mjs
 * It writes into `scripts/__fixtures__/rendered-state-census/`, each page being `clean.html` (or `stylesheet-fails-once.html`) plus one element:
 *  - below-the-fold cover (the six `listingdetailview` Stories: a map popup under the map's zoom control, below the fold):
 *      `html-text-under-opaque-below-fold`  an opaque box printed over a line of text, 1 100px down the page (below the 844px fold): the covered text is not seen, green on the app root;
 *      `html-text-overlap-below-fold`       two lines printed on one another at the same place, no box over them: text-overlap fails on the app root (the violating twin).
 *  - inert layer under a modal (`listingpreviewdialogview--delete-confirm`, `reportdetaildialogview--delete-confirm`: a confirm dialog over an inert dialog):
 *      `html-text-under-inert-dialog`       an inert dialog whose title is printed under the title of the opaque dialog above it: the lower text is not seen, green on the portal root;
 *      `html-text-over-inert-dialog`        the same with the dialog above it transparent: the two titles are printed on one another, text-overlap fails on the portal root.
 *  - reopen of a dismissal check:
 *      `stylesheet-fails-on-reopen`         a MOUNT state (a dismissal check reopens it by loading the page again; a click state is reopened in place). The stylesheet of the page is answered
 *                                           503 on the SECOND load of the case only (the reopen for the close-control check), the first and every later load are fine: the job is
 *                                           retried once on a fresh page and passes with `retry` recorded.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join('scripts', '__fixtures__', 'rendered-state-census');
const dialogMarker = "'<div class=\"dialog\" role=\"dialog\" aria-modal=\"true\">' +";
const appMarker = '<p>Fixture page, not a product Story.</p>';

function base(name, comment, from = 'clean.html') {
  let html = readFileSync(join(DIR, from), 'utf8');
  const fromName = from.replace(/\.html$/, '');
  html = html.replace(`rendered state census fixture: ${fromName}`, `rendered state census fixture: ${name}`);
  html = html.replace(new RegExp(`<!-- Task 923[\\s\\S]*?fixture "${fromName}"[\\s\\S]*?-->`), `<!-- Task 923 Revision 11 self-test fixture "${name}". ${comment} -->`);
  html = html.replace(`"id":"fixture-${fromName}","story":"${fromName}"`, `"id":"fixture-${name}","story":"${name}"`);
  if (!html.includes(`fixture-${name}`)) throw new Error(`${from}: the state id was not renamed`);
  if (!html.includes(`fixture "${name}"`)) throw new Error(`${from}: the comment was not replaced`);
  return html;
}
const write = (name, html) => { writeFileSync(join(DIR, `${name}.html`), html); console.log(`wrote ${name}.html`); };

// ---- below the fold: the app root holds a 1 100px spacer, then the pair ----
function belowFold(name, comment, pair) {
  let html = base(name, comment);
  if (!html.includes(appMarker)) throw new Error('clean.html has no app marker');
  html = html.replace(appMarker, `${appMarker}\n  <div style="height:1100px"></div>${pair}`);
  write(name, html);
}
belowFold('html-text-under-opaque-below-fold',
  'A line of text 1 100px down the page (below the 844px fold) with an opaque box printed over it, like a map popup under the map zoom control. The covered text is not seen: text-overlap stays green on the app root, as it does for the same pair inside the viewport.',
  '<div style="position:relative;height:30px"><span style="position:absolute;left:0;top:0">Content under the control</span><div style="position:absolute;left:0;top:0;width:280px;height:24px;background:#fff"><span>Pinned control text</span></div></div>');
belowFold('html-text-overlap-below-fold',
  'Two lines of text printed on one another 1 100px down the page (below the 844px fold), with no box over them: text-overlap fails on the app root, as it does for the same pair inside the viewport.',
  '<div style="position:relative;height:30px"><span style="position:absolute;left:0;top:0">First line of text</span><span style="position:absolute;left:0;top:0">Second line of text</span></div>');

// ---- an inert dialog under the dialog above it ----
const lower = "'<div class=\"dialog\" inert aria-hidden=\"true\"><h2>Underlying dialog title</h2></div>' +";
function underInert(name, comment, upperTransparent) {
  let html = base(name, comment);
  if (!html.includes(dialogMarker)) throw new Error('clean.html has no dialog marker');
  const upper = upperTransparent ? "'<div class=\"dialog\" role=\"dialog\" aria-modal=\"true\" style=\"background:transparent\">' +" : dialogMarker;
  html = html.replace(dialogMarker, `${lower}\n      ${upper}`);
  write(name, html);
}
underInert('html-text-under-inert-dialog',
  'An inert dialog (a layer covered by the modal above it) whose title is printed under the title of the opaque dialog above it, like a confirm dialog over the dialog it was opened from. The lower text is not seen and is not hit-testable: text-overlap stays green on the portal root.',
  false);
underInert('html-text-over-inert-dialog',
  'The same inert dialog under a dialog that is transparent: the two titles are printed on one another and both are seen. text-overlap fails on the portal root.',
  true);

// ---- the reopen of a dismissal check fails once ----
{
  const name = 'stylesheet-fails-on-reopen';
  let html = base(name, 'The 44px button rule is in census-target.css. The stylesheet is answered 503 on the SECOND load of the case only (the self-test appends ?load=<n>): the load that reopens the state for the next dismissal check. That reopen fails with a resource failure, the job is retried once on a fresh page and passes with its retry recorded.', 'stylesheet-fails-once.html');
  if (!html.includes('get("load") === "1"')) throw new Error('stylesheet-fails-once.html has no load === "1" switch');
  html = html.replace('get("load") === "1"', 'get("load") === "2"');
  // a MOUNT state: the dialog is open when the page loads, so a dismissal check reopens it by loading the page again (a click state is reopened in place, with no load)
  const clickState = '"open":{"kind":"click","selector":"#open"},"portals":1,"focus":"trap","dismiss":["escape","close-control","outside"],"trigger":"#open","closeSelector":"[data-census-close]"';
  if (!html.includes(clickState)) throw new Error('stylesheet-fails-once.html: the click state text changed');
  html = html.replace(clickState, '"open":{"kind":"mount"},"portals":1,"focus":"trap","dismiss":["escape","close-control","outside"],"closeSelector":"[data-census-close]"');
  if (!html.includes("opener.addEventListener('click', open);")) throw new Error('stylesheet-fails-once.html: no click listener line');
  html = html.replace("opener.addEventListener('click', open);", "opener.addEventListener('click', open);\n  open(); // a mount state");
  write(name, html);
}
