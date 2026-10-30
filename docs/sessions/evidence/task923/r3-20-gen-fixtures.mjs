/**
 * r3-20-gen-fixtures.mjs - generator of the Revision 2 self-test fixtures (Task 923, R15, R16).
 *
 * Run from the repository root:  node docs/sessions/evidence/task923/r3-20-gen-fixtures.mjs
 * It writes `scripts/__fixtures__/rendered-state-census/<name>.html` for the Revision 2 cases only; the fixtures of the
 * earlier passes are left untouched. The fixtures are committed as static files, this script is the record of how they
 * were produced. Each case is the plain dialog page of `r2-20-gen-fixtures.mjs` plus one planted shape or its benign twin.
 * The geometry of the abs / transform pair is the one of the review-2 probes (`review-2/fixtures/`): the dialog box is
 * x 16..310 at 390px and the planted text paints at x 212..332, 22px past the box and inside the viewport.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join('scripts', '__fixtures__', 'rendered-state-census');

const BASE_STATE = {
  open: { kind: 'click', selector: '#open' },
  portals: 1,
  focus: 'trap',
  dismiss: ['escape', 'close-control', 'outside'],
  trigger: '#open',
  closeSelector: '[data-census-close]',
};

const TRAP = `
    if (e.key === 'Tab') {
      var f = Array.prototype.slice.call(portal.querySelectorAll('button'));
      var first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (!portal.contains(a)) { first.focus(); e.preventDefault(); }
      else if (e.shiftKey && a === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && a === last) { first.focus(); e.preventDefault(); }
    }`;

/** A dialog page: `app` is extra markup in the app root, `body` extra markup in the dialog, `style` extra CSS. */
function dialogPage({ name, comment, state = {}, app = '', body = '', style = '' }) {
  const reg = JSON.stringify({ id: `fixture-${name}`, story: name, ...BASE_STATE, ...state });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>rendered state census fixture: ${name}</title>
<style>
  html, body { margin: 0; font: 16px/1.4 sans-serif; }
  #storybook-root { padding: 16px; }
  button { min-width: 44px; min-height: 44px; font: inherit; }
  .backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, .4); }
  .dialog { position: fixed; left: 16px; right: 16px; top: 48px; padding: 16px; background: #fff; border-radius: 8px; }
  .dialog h2 { margin: 0 0 8px; font-size: 18px; }
  .dialog .footer { margin-top: 16px; display: flex; gap: 8px; }
${style}</style>
</head>
<body>
<!-- Task 923 Revision 2 self-test fixture "${name}". ${comment} -->
<div id="storybook-root">
  <button id="open" type="button">Open dialog</button>
  <p>Fixture page, not a product Story.</p>
  ${app}
</div>
<script type="application/json" id="census-state">${reg}</script>
<script>
(function () {
  var portal = null;
  var opener = document.getElementById('open');
  if (!opener) return;
  function close() {
    if (!portal) return;
    portal.remove();
    portal = null;
    opener.focus();
  }
  function open() {
    if (portal) return;
    portal = document.createElement('div');
    portal.setAttribute('data-portal', 'true');
    portal.innerHTML = '<div class="backdrop"></div>' +
      '<div class="dialog" role="dialog" aria-modal="true">' +
      '<button type="button" data-census-close aria-label="Close" style="float:right">&times;</button>' +
      '<h2>Dialog title</h2><p>Short body text.</p>' + ${JSON.stringify(body)} +
      '<div class="footer"><button type="button">Save</button><button type="button">Cancel</button></div></div>';
    document.body.appendChild(portal);
    portal.querySelector('.backdrop').addEventListener('click', close);
    portal.querySelector('[data-census-close]').addEventListener('click', close);
    portal.querySelector('[data-census-close]').focus();
  }
  opener.addEventListener('click', open);
  document.addEventListener('keydown', function (e) {
    if (!portal) return;
    if (e.key === 'Escape') close();${TRAP}
  });
})();
</script>
</body>
</html>
`;
}

// a dialog narrower than the viewport, so a 22px overshoot stays inside the viewport (viewport-overflow stays silent)
const NARROW = '  .dialog { right: 80px; }\n';

const cases = [
  // ---- R15: positioned and transformed content ----
  dialogPage({
    name: 'abs-past-panel',
    comment: 'Planted inside the portal root only: an absolutely positioned text paints 22px past the dialog box, inside the viewport.',
    style: NARROW,
    body: '<div style="position:relative;height:40px"><p style="position:absolute;left:180px;top:0;width:120px;margin:0;background:#ddd">absolute text past the dialog</p></div>',
  }),
  dialogPage({
    name: 'abs-badge-inside',
    comment: 'Benign twin of abs-past-panel: a count badge offset over the corner of its avatar, wholly inside the dialog box.',
    style: NARROW,
    body: '<div style="position:relative;width:40px;height:40px;margin:8px 0;background:#ccd;border-radius:50%"><span style="position:absolute;top:-6px;right:-6px;min-width:18px;background:#c33;color:#fff;font-size:12px;text-align:center;border-radius:9px">3</span></div>',
  }),
  dialogPage({
    name: 'transform-past-panel',
    comment: 'Planted inside the portal root only: a text moved by transform: translateX paints 22px past the dialog box, inside the viewport.',
    style: NARROW,
    body: '<p style="margin:0;width:120px;transform:translateX(180px);background:#ddd">transformed text past the dialog</p>',
  }),
  dialogPage({
    name: 'transform-inside',
    comment: 'Benign twin of transform-past-panel: the same kind of shift, but the text stays inside the dialog box.',
    style: NARROW,
    body: '<p style="margin:0;width:120px;transform:translateX(40px);background:#ddd">transformed text inside the dialog</p>',
  }),
  // ---- R15: the clipping-ancestor bound (a card that clips its overflow, inside a roomy dialog) ----
  dialogPage({
    name: 'abs-past-clipper',
    comment: 'Planted inside the portal root only: an absolutely positioned text sticks 30px out of a card that clips its overflow; it is still inside the dialog box, so only the clipping card is the bound.',
    body: '<div style="overflow:hidden;position:relative;width:150px;height:60px;background:#eee"><p style="position:absolute;left:100px;top:0;width:80px;margin:0;background:#ddd">cut by the card</p></div>',
  }),
  dialogPage({
    name: 'abs-inside-clipper',
    comment: 'Benign twin of abs-past-clipper: the same absolutely positioned text, wholly inside the clipping card.',
    body: '<div style="overflow:hidden;position:relative;width:150px;height:60px;background:#eee"><p style="position:absolute;left:10px;top:0;width:80px;margin:0;background:#ddd">inside the card</p></div>',
  }),
  // ---- R16: a transient open failure, and one that never recovers ----
  dialogPage({
    name: 'open-flaky-once',
    comment: 'The trigger is absent on the first load of the page and present on the next one (the self-test appends ?load=<n>, a counter it resets per case); the job is retried once on a fresh page and passes with its retry recorded.',
    app: '<script>if (new URLSearchParams(location.search).get("load") === "1") document.getElementById("open").remove();</script>',
  }),
  dialogPage({
    name: 'open-never',
    comment: 'The registered open selector matches nothing at any load: the retry fails as well and the job is an open-failed violation.',
    state: { open: { kind: 'click', selector: '#nothing' } },
  }),
];

for (const html of cases) {
  const name = html.match(/fixture "([^"]+)"/)[1];
  writeFileSync(join(OUT, `${name}.html`), html);
  console.log(`wrote ${name}.html`);
}

// ---- the Revision 1 fixture "stacked-dialogs": R15 flagged its own layout ----
// Its first dialog had no height, so the absolutely positioned Delete button hung ~40px below that dialog's box (a real
// defect shape, correctly found by the R15 bound). The benign intent - Delete lies under the confirmation dialog of the
// second portal root - is kept: the first dialog now has a 200px box that holds the button.
import { readFileSync } from 'node:fs';
const stacked = join(OUT, 'stacked-dialogs.html');
const before = readFileSync(stacked, 'utf8');
const after = before.replace('style="top:48px"><h2>Preview</h2>', 'style="top:48px;height:200px"><h2>Preview</h2>');
if (after !== before) { writeFileSync(stacked, after); console.log('patched stacked-dialogs.html (first dialog height 200px)'); }
