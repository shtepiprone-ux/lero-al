// Opus review probe for Task 923 (diagnosis only; never repository evidence of a gate).
import { readFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Claude_Code_Projects/lero-al/node_modules/playwright/index.mjs';
import { startStaticServer, fixtureContext, storybookContext, runStateJob, newMeasuringPage, loadStory } from 'file:///C:/Claude_Code_Projects/lero-al/scripts/rendered-state-census/runner.mjs';

const SP = process.argv[2];
const REPO = 'C:/Claude_Code_Projects/lero-al';
const out = [];
const log = (m) => { out.push(m); console.log(m); };
const browser = await chromium.launch();

// ── 1. planted fixtures ──
const fxServer = await startStaticServer(SP + '/fx', 6091);
const fctx = fixtureContext('http://127.0.0.1:6091');
const page = await newMeasuringPage(browser);
for (const name of ['neg-margin', 'page-scroll']) {
  const html = readFileSync(`${SP}/fx/${name}.html`, 'utf8');
  const state = JSON.parse(html.match(/id="census-state">(.*?)<\/script>/s)[1]);
  const rows = await runStateJob(page, fctx, state, 'en', 390);
  const extra = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  log(`FIXTURE ${name}: ` + rows.map((r) => `${r.root} ${r.pass ? 'green' : Object.entries(r.rules).filter(([, v]) => v.length).map(([k, v]) => k + ':' + v[0]).join(' ; ')}`).join(' | ') + `  [page scrollWidth ${extra.sw} clientWidth ${extra.cw}]`);
}
fxServer.close();

// ── 2. widths rows: is the trigger really absent at the skipped matrix widths? ──
const sbServer = await startStaticServer(REPO + '/storybook-static', 6092);
const ctx = storybookContext('http://127.0.0.1:6092');
const reg = JSON.parse(readFileSync(REPO + '/scripts/rendered-interaction-states.json', 'utf8')).states;
const W = [320, 390, 639, 640, 1024, 1440];
const inRange = (s, w) => (s.widths.min === undefined || w >= s.widths.min) && (s.widths.max === undefined || w <= s.widths.max);
const sample = reg.filter((s) => s.widths && s.open.kind === 'click');
const picked = [];
const seenStory = new Set();
for (const s of sample) { if (!seenStory.has(s.story)) { seenStory.add(s.story); picked.push(s); } }
log(`widths click rows ${sample.length}, distinct Stories ${picked.length}; probing up to 40`);
let opensElsewhere = 0;
for (const s of picked.slice(0, 40)) {
  // accessible name of the trigger at an in-range width
  const wIn = W.find((w) => inRange(s, w));
  await loadStory(page, ctx, { story: s.story, locale: 'en', width: wIn });
  const name = await page.evaluate((sel) => {
    const els = [...document.querySelector('#storybook-root').querySelectorAll(sel.replace(/:scope\s*>/g, '#storybook-root >'))].filter((e) => window.__census.vis(e));
    const e = els[0];
    return e ? { label: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 40), tag: e.tagName } : null;
  }, s.open.selector);
  if (!name || !name.label) { log(`  ${s.id}: no labelled trigger at ${wIn}`); continue; }
  const res = [];
  for (const w of W.filter((w) => !inRange(s, w))) {
    await loadStory(page, ctx, { story: s.story, locale: 'en', width: w });
    const cands = await page.evaluate(({ label, tag }) => {
      const all = [...document.querySelector('#storybook-root').querySelectorAll(tag)].filter((e) => window.__census.vis(e) && (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 40) === label);
      all.forEach((e, i) => e.setAttribute('data-rv-probe', String(i)));
      return all.length;
    }, name);
    let opened = 0;
    if (cands) {
      try { await page.locator('[data-rv-probe="0"]').first().click({ timeout: 2500 }); await page.waitForTimeout(700); opened = await page.evaluate(() => window.__census.portals().length); } catch { /* not clickable */ }
    }
    res.push(`${w}:${cands ? (opened ? 'OPENS' : 'present') : 'absent'}`);
    if (opened) opensElsewhere++;
  }
  log(`  ${s.id} widths ${JSON.stringify(s.widths)} trigger ${name.tag} "${name.label}" -> ${res.join(' ')}`);
}
log(`states whose same-named trigger opens a portal at a skipped width: ${opensElsewhere}`);
sbServer.close();
await browser.close();
