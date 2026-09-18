// Task 844 Revision 2, review 2 — K1 rendered-text proof. Successor to 50-r7-inherit-probe.mjs
// (K1's required correction: "Re-run 50/51 as 60-…/61-…"). Same R7 computed-style-inheritance
// proof as 50, PLUS a new assertion: every plain RelativeTime fixture must render PAST-TENSE
// text ("тому" in uk) now that FIXTURE_ANCHOR equals the frozen Storybook clock
// (.storybook/preview-head.html:15, 2026-07-30T00:00:00.000Z). Before the fix, these fixtures
// were anchored at 2026-09-18T12:00Z — in the FUTURE relative to the frozen clock — so date-fns
// rendered "приблизно за 2 місяці" ("in about 2 months") instead of "2 місяці тому".

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

  rows.forEach((row, i) => {
    const inheritedOk = row.parent
      && row.element.fontSize === row.parent.fontSize
      && row.element.lineHeight === row.parent.lineHeight
      && row.element.fontWeight === row.parent.fontWeight
      && row.element.fontFamily === row.parent.fontFamily
      && row.element.color === row.parent.color
      && row.element.letterSpacing === row.parent.letterSpacing;
    const parentBlockifies = row.parent && /flex|grid/.test(row.parent.display);
    const displayOk = parentBlockifies ? row.element.display === 'block' : row.element.display === 'inline';
    const marginOk = row.element.margin === '0px';
    const paddingOk = row.element.padding === '0px';

    // K1 — the RelativeTime story's first four `time` elements are the "plain" section (see
    // RelativeTime.stories.tsx render order: plain(4) -> absolute(1) -> inherit(2) -> nested-link(1)).
    // With the frozen anchor now equal to the preview clock, every one must read past tense.
    const isPlainFixture = target.id === 'mantine-primitives-relativetime--default' && i < 4;
    const pastTenseOk = !isPlainFixture || row.text.includes('тому');

    const pass = Boolean(inheritedOk && displayOk && marginOk && paddingOk && pastTenseOk);
    allPass = allPass && pass;
    results.push({ target: target.name, storyId: target.id, index: i, isPlainFixture, ...row, pastTenseOk, pass });
    console.log(`${pass ? 'PASS' : 'FAIL'} [${target.name}] "${row.text}" display=${row.element.display} pastTenseOk=${pastTenseOk}`);
    if (!pass) console.log(`  element: ${JSON.stringify(row.element)}\n  parent:  ${JSON.stringify(row.parent)}`);
  });
}

await browser.close();
writeFileSync(new URL('./60-r7-inherit-probe.json', import.meta.url), JSON.stringify(results, null, 2));
process.exit(allPass ? 0 : 1);
