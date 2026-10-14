// Review 2 probe: do hover-opened overlays exist on elements that discovery's candidates() never clicks?
const { chromium } = await import(pathToFileURL('C:/Claude_Code_Projects/lero-al/node_modules/playwright/index.mjs'));
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const ROOT = 'C:/Claude_Code_Projects/lero-al';
const { startStaticServer, newMeasuringPage, loadStory, waitStable } = await import(pathToFileURL(ROOT + '/scripts/rendered-state-census/runner.mjs'));
const index = JSON.parse(readFileSync(ROOT + '/storybook-static/index.json', 'utf8'));
const reg = JSON.parse(readFileSync(ROOT + '/scripts/rendered-interaction-states.json', 'utf8'));
const want = process.argv.slice(2);
const stories = Object.values(index.entries).filter((e) => e.type === 'story' && want.some((w) => e.id.includes(w)));
const server = await startStaticServer(ROOT + '/storybook-static', 6091);
const browser = await chromium.launch();
const page = await newMeasuringPage(browser);
const ctx = { baseUrl: 'http://127.0.0.1:6091', mode: 'storybook', height: 844, urlFor: ({ story, locale }) => `http://127.0.0.1:6091/iframe.html?id=${story}&viewMode=story&globals=locale:${locale}` };
for (const s of stories) {
  for (const width of [390, 1440]) {
    const t = { story: s.id, state: 'closed', locale: 'en', width };
    const l = await loadStory(page, ctx, t);
    if (!l.ok) { console.log('LOADFAIL', s.id, l.reason); continue; }
    const base = await waitStable(page, null, 1500);
    // elements discovery's candidates() does NOT include
    const targets = await page.evaluate(() => {
      const root = document.querySelector('#storybook-root');
      const sel = 'button, [role=button], input:not([type=checkbox]):not([type=radio]):not([type=hidden]), [aria-haspopup], [aria-expanded], select';
      const out = [];
      for (const el of root.querySelectorAll('time, [tabindex="0"], [data-census-hover]')) {
        if (el.matches(sel) || el.closest(sel)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        el.setAttribute('data-rv-hover', String(out.length));
        out.push({ i: out.length, tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 30) });
      }
      return out;
    });
    let hits = 0;
    for (const tg of targets.slice(0, 6)) {
      const loc = page.locator(`[data-rv-hover="${tg.i}"]`);
      try { await loc.scrollIntoViewIfNeeded({ timeout: 1500 }); await loc.hover({ timeout: 1500 }); } catch { continue; }
      const n = await waitStable(page, null, 1500);
      if (n > base) { hits++; console.log(`HOVER-OPENS ${s.id} @${width}: ${tg.tag} "${tg.text}" -> ${n} portal(s); rows for story: ${reg.states.filter((x) => x.story === s.id).length}`); }
      await page.mouse.move(0, 0); await waitStable(page, null, 800);
    }
    console.log(`${s.id} @${width}: ${targets.length} non-candidate hover targets, ${hits} open a portal`);
  }
}
await browser.close(); server.close();
