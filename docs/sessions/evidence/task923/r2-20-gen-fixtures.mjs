/**
 * r2-20-gen-fixtures.mjs - generator of the Revision 1 self-test fixtures (Task 923, R10-R13).
 *
 * Run from the repository root:  node docs/sessions/evidence/task923/r2-20-gen-fixtures.mjs
 * It (re)writes `scripts/__fixtures__/rendered-state-census/<name>.html` for the Revision 1 cases only; the nine
 * first-pass fixtures are left untouched. The fixtures are committed as static files, this script is the record of how
 * they were produced. Each case is a plain dialog page (the same template as the first-pass fixtures) plus one planted
 * shape, or its benign twin. Every violation lives where its case says: `portal-*` cases plant inside the portal
 * root with a green app root.
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
function dialogPage({ name, comment, state = {}, app = '', body = '', style = '', head = '' }) {
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
${head}</head>
<body>
<!-- Task 923 Revision 1 self-test fixture "${name}". ${comment} -->
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

const SVG = (w, h) => `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#ccd"/></svg>`;

const cases = [
  // ---- R10: the page's own scroll, and the target root's own box ----
  dialogPage({
    name: 'page-scroll-only',
    comment: 'Planted: an in-flow transformed element in the APP root pushes the page sideways; the portal is clean.',
    app: '<div style="width:100px;transform:translateX(500px)">pushed text</div>',
  }),
  dialogPage({
    name: 'root-box-past-viewport',
    comment: 'Planted: the APP root box itself is wider than the viewport (position: fixed, so the page does not scroll; its children are narrow).',
    style: '  #storybook-root { position: fixed; left: 0; top: 0; width: 700px; }\n  #storybook-root p { display: inline-block; margin: 0 0 0 8px; }\n',
  }),
  // ---- R11: negative margin (bounded to its own size) ----
  dialogPage({
    name: 'neg-margin-overflow',
    comment: 'Planted inside the portal root only: a 300px block with a -8px right margin overflows its 160px parent by 140px.',
    body: '<div style="width:160px"><p style="margin:0 -8px 0 0;width:300px;background:#ddd">neg margin block text</p></div>',
  }),
  dialogPage({
    name: 'neg-margin-fullbleed',
    comment: 'Benign twin of neg-margin-overflow: a margin: 0 -16px full-bleed band overflows its parent by exactly its margin.',
    body: '<div class="stack"><p style="margin:0 -16px;padding:4px 16px;background:#eee">Full-bleed band</p></div>',
  }),
  // ---- R11: table box parent ----
  dialogPage({
    name: 'table-cell-overflow',
    comment: 'Planted inside the portal root only: a 160px button in an 80px cell of a table-layout: fixed table.',
    body: '<table style="table-layout:fixed;width:200px;border-collapse:collapse"><tr><td style="width:80px;padding:0"><button type="button" style="width:160px">Wide button</button></td><td style="padding:0"><span>Next</span></td></tr></table>',
  }),
  dialogPage({
    name: 'table-rowspan',
    comment: 'Benign twin of table-cell-overflow: a rowspan cell is taller than its own row because the table algorithm lays it out so; no author overflow.',
    body: '<table style="border-collapse:collapse;width:300px"><tr><td rowspan="2" style="padding:4px">Spans two rows</td><td style="padding:4px">A</td></tr><tr><td style="padding:4px">B</td></tr></table>',
  }),
  // ---- R11: clipped-away slide ----
  dialogPage({
    name: 'slide-carousel',
    comment: 'Benign: slides of a transformed carousel track lie wholly outside the overflow:hidden viewport by design.',
    body: `<div style="overflow:hidden;width:100%"><div style="display:flex;transform:translateX(0)"><div style="flex:0 0 100%">${SVG(40, 20)}</div><div style="flex:0 0 100%">${SVG(40, 20)}</div></div></div>`,
  }),
  dialogPage({
    name: 'slide-hidden-content',
    comment: 'Planted inside the portal root only: the same shape with no transformed track and no scroll region - the second block is content lost behind overflow:hidden.',
    body: `<div style="overflow:hidden;width:100%"><div style="display:flex"><div style="flex:0 0 100%">${SVG(40, 20)}</div><div style="flex:0 0 100%">${SVG(40, 20)}</div></div></div>`,
  }),
  // ---- R11: text-hidden inner box ----
  dialogPage({
    name: 'text-inner-box',
    comment: 'Benign: an overflow:hidden box whose scroll height exceeds its client height because of an empty absolute decoration; its text is fully inside.',
    body: '<div style="overflow:hidden;height:40px;position:relative"><span>short text</span><i style="position:absolute;top:0;left:0;width:10px;height:100px;background:#ccc"></i></div>',
  }),
  dialogPage({
    name: 'text-cut',
    comment: 'Planted inside the portal root only: the same overflow:hidden box, but its text really is cut off.',
    body: '<div style="overflow:hidden;height:20px;line-height:20px"><span>line one<br>line two<br>line three</span></div>',
  }),
  // ---- R11: hidden away from the viewport ----
  dialogPage({
    name: 'hidden-away-clipped',
    comment: 'Benign: a decorative bar wider than the viewport inside an overflow:hidden box that itself fits the viewport.',
    body: '<div style="overflow:hidden"><div style="width:600px;height:20px;background:#ddd"></div></div>',
  }),
  dialogPage({
    name: 'hidden-away-wide-clipper',
    comment: 'Planted inside the portal root only: the overflow:hidden box is itself wider than the viewport, so it hides nothing.',
    body: '<div style="overflow:hidden;width:600px"><div style="width:700px;height:20px;background:#ddd"></div></div>',
  }),
  // ---- R11: off-canvas panel ----
  dialogPage({
    name: 'offcanvas-closed-panel',
    comment: 'Benign: a CLOSED off-canvas panel - position: fixed, translated wholly out of view.',
    app: '<aside style="position:fixed;top:0;left:0;width:200px;transform:translateX(-100%)">Closed navigation panel</aside>',
  }),
  dialogPage({
    name: 'offcanvas-open-overflow',
    comment: 'Planted in the APP root: the same fixed panel, but half in view and running past the right edge.',
    app: '<aside style="position:fixed;top:0;left:300px;width:200px">Navigation panel past the edge</aside>',
  }),
  // ---- R11: a dialog stacked over a dialog (the action of the lower one is covered by design) ----
  dialogPage({
    name: 'covered-action',
    comment: 'Planted inside the portal root only: an unrelated sticky banner of the SAME portal root covers the Save button.',
    body: '<div style="position:fixed;left:0;right:0;top:0;height:400px;background:#fe9"><span>Sticky banner</span></div>',
  }),
  // ---- R12: widths ----
  dialogPage({
    name: 'widths-contradicted',
    comment: 'Planted: the state declares widths {min: 640} but its trigger opens its dialog at every width.',
    state: { widths: { min: 640 } },
  }),
  dialogPage({
    name: 'widths-honoured',
    comment: 'Benign twin of widths-contradicted: the trigger really exists only from 640px up.',
    state: { widths: { min: 640 } },
    style: '  @media (max-width: 639px) { #open { display: none; } }\n',
  }),
];

for (const html of cases) {
  const name = html.match(/fixture "([^"]+)"/)[1];
  writeFileSync(join(OUT, `${name}.html`), html);
  console.log(`wrote ${name}.html`);
}

// ---- R11 stacked dialogs (benign) and R13 bottom sheet: their own page scripts ----
function customPage({ name, comment, state, portalsJs, style = '' }) {
  const reg = JSON.stringify({ id: `fixture-${name}`, story: name, open: { kind: 'click', selector: '#open' }, trigger: '#open', ...state });
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
  .dialog { position: fixed; left: 16px; right: 16px; padding: 16px; background: #fff; border-radius: 8px; }
${style}</style>
</head>
<body>
<!-- Task 923 Revision 1 self-test fixture "${name}". ${comment} -->
<div id="storybook-root">
  <button id="open" type="button">Open</button>
  <p>Fixture page, not a product Story.</p>
</div>
<script type="application/json" id="census-state">${reg}</script>
<script>
(function () {
  var portals = [];
  var opener = document.getElementById('open');
  function close() {
    portals.forEach(function (p) { p.remove(); });
    portals = [];
    opener.focus();
  }
  function add(html) {
    var p = document.createElement('div');
    p.setAttribute('data-portal', 'true');
    p.innerHTML = html;
    document.body.appendChild(p);
    portals.push(p);
    return p;
  }
  function open() {
    if (portals.length) return;
${portalsJs}
  }
  opener.addEventListener('click', open);
  document.addEventListener('keydown', function (e) {
    if (!portals.length) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      var top = portals[portals.length - 1];
      var f = Array.prototype.slice.call(top.querySelectorAll('button'));
      var first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (!top.contains(a)) { first.focus(); e.preventDefault(); }
      else if (e.shiftKey && a === first) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && a === last) { first.focus(); e.preventDefault(); }
    }
  });
})();
</script>
</body>
</html>
`;
}

const custom = [
  customPage({
    name: 'stacked-dialogs',
    comment: 'Benign: a confirmation dialog (second portal root) stands over a first dialog and covers its Delete button by design.',
    state: { portals: 2, focus: 'trap', dismiss: ['escape'] },
    portalsJs: `    add('<div class="backdrop"></div><div class="dialog" role="dialog" aria-modal="true" style="top:48px"><h2>Preview</h2><p>Body</p><button type="button" style="position:absolute;left:16px;top:120px">Delete</button></div>');
    var b = add('<div class="backdrop"></div><div class="dialog" role="dialog" aria-modal="true" style="top:60px;height:140px"><h2>Confirm</h2><button type="button">Yes</button><button type="button">No</button></div>');
    b.querySelector('button').focus();`,
  }),
  customPage({
    name: 'sheet-no-pointer-dismissal',
    comment: 'A full-bleed bottom sheet with no close control: close-control and outside do not apply and are recorded as not applicable.',
    state: { portals: 1, focus: 'trap', dismiss: ['escape', 'close-control', 'outside'] },
    style: '  .mantine-Drawer-content { position: fixed; inset: 0; background: #fff; padding: 16px; }\n',
    portalsJs: `    var p = add('<div class="mantine-Drawer-content" role="dialog" aria-modal="true"><h2>Sheet title</h2><p>Sheet body.</p><button type="button">Apply</button><button type="button">Reset</button></div>');
    p.querySelector('button').focus();`,
  }),
];
for (const html of custom) {
  const name = html.match(/fixture "([^"]+)"/)[1];
  writeFileSync(join(OUT, `${name}.html`), html);
  console.log(`wrote ${name}.html`);
}
