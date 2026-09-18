// Task 844 Revision 1, review G3 — measured AC7r proof.
//
// Opens the legacy `Cabinet/ListingsTab` story (real production RelativeTime usage, Tailwind
// context: `<div className="flex ... text-xs text-muted-foreground">`) and the canonical
// `Mantine/Primitives/RelativeTime` story, both at 1280px. For every real rendered `<time>`
// element it records the computed font-size, line-height, font-weight, font-family, color,
// letter-spacing, display, margin and padding of the element AND of its immediate parent.
// Exits non-zero unless the first six properties equal the parent's values, `display` is
// `inline`, and margin/padding are `0px` — the same six properties a bare pre-migration `<span>`
// (no CSS of its own) would always inherit from its parent; that inherited-equality is the
// observable "unchanged" property this task's R7 requires, measured live, not assumed.

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const TARGETS = [
  { name: 'Cabinet/ListingsTab (legacy production consumer)', id: 'cabinet-listingstab--default' },
  { name: 'Mantine/Primitives/RelativeTime', id: 'mantine-primitives-relativetime--default' },
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

const results = [];
let allPass = true;

for (const target of TARGETS) {
  await page.goto(`http://localhost:6006/iframe.html?id=${target.id}&globals=locale:uk`, { waitUntil: 'networkidle' });

  const rows = await page.evaluate(() => {
    const root = document.querySelector('#storybook-root') || document.body;
    const times = [...root.querySelectorAll('time')];
    return times.map((el) => {
      const parent = el.parentElement;
      const s = getComputedStyle(el);
      const p = parent ? getComputedStyle(parent) : null;
      return {
        text: (el.textContent || '').slice(0, 30),
        element: {
          fontSize: s.fontSize, lineHeight: s.lineHeight, fontWeight: s.fontWeight,
          fontFamily: s.fontFamily, color: s.color, letterSpacing: s.letterSpacing,
          display: s.display, margin: s.margin, padding: s.padding,
        },
        parent: p ? {
          fontSize: p.fontSize, lineHeight: p.lineHeight, fontWeight: p.fontWeight,
          fontFamily: p.fontFamily, color: p.color, letterSpacing: p.letterSpacing,
          display: p.display,
        } : null,
      };
    });
  });

  for (const row of rows) {
    const inheritedOk = row.parent
      && row.element.fontSize === row.parent.fontSize
      && row.element.lineHeight === row.parent.lineHeight
      && row.element.fontWeight === row.parent.fontWeight
      && row.element.fontFamily === row.parent.fontFamily
      && row.element.color === row.parent.color
      && row.element.letterSpacing === row.parent.letterSpacing;
    // A flex/grid CONTAINER blockifies every direct child's outer display value regardless of
    // its markup (CSS Display Module Level 3) — a plain pre-migration <span> would blockify to
    // `block` in that exact context too, so `block` there is not a regression, it is the correct
    // browser behaviour for ANY element in that position. Only require literal `inline` when the
    // parent is NOT a flex/grid container.
    const parentBlockifies = row.parent && /flex|grid/.test(row.parent.display);
    const displayOk = parentBlockifies ? row.element.display === 'block' : row.element.display === 'inline';
    const marginOk = row.element.margin === '0px';
    const paddingOk = row.element.padding === '0px';
    const pass = Boolean(inheritedOk && displayOk && marginOk && paddingOk);
    allPass = allPass && pass;
    results.push({ target: target.name, storyId: target.id, ...row, pass });
    console.log(`${pass ? 'PASS' : 'FAIL'} [${target.name}] "${row.text}" display=${row.element.display} margin=${row.element.margin} padding=${row.element.padding}`);
    if (!pass) console.log(`  element: ${JSON.stringify(row.element)}\n  parent:  ${JSON.stringify(row.parent)}`);
  }
}

await browser.close();
writeFileSync(new URL('./50-r7-inherit-probe.json', import.meta.url), JSON.stringify(results, null, 2));
process.exit(allPass ? 0 : 1);
