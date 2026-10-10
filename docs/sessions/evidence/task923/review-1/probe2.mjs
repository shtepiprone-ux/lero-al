// Opus review probe 2 for Task 923: does a registered Story hold a portal-opening trigger with no registry row?
import { readFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Claude_Code_Projects/lero-al/node_modules/playwright/index.mjs';
import { startStaticServer, storybookContext, newMeasuringPage, loadStory } from 'file:///C:/Claude_Code_Projects/lero-al/scripts/rendered-state-census/runner.mjs';

const REPO = 'C:/Claude_Code_Projects/lero-al';
const reg = JSON.parse(readFileSync(REPO + '/scripts/rendered-interaction-states.json', 'utf8')).states;
const byStory = new Map();
for (const s of reg) byStory.set(s.story, [...(byStory.get(s.story) ?? []), s]);
const stories = [...byStory.keys()].filter((_, i) => i % 6 === 0); // every 6th registered Story
const browser = await chromium.launch();
const server = await startStaticServer(REPO + '/storybook-static', 6093);
const ctx = storybookContext('http://127.0.0.1:6093');
const page = await newMeasuringPage(browser);
let misses = 0;
console.log(`registered Stories ${byStory.size}; sampled ${stories.length}`);
for (const story of stories) {
  for (const width of [390, 1440]) {
    const target = { story, locale: 'en', width };
    if (!(await loadStory(page, ctx, target)).ok) continue;
    const cands = await page.evaluate(() => window.__census.candidates(40));
    for (const c of cands) {
      if (!(await loadStory(page, ctx, target)).ok) continue;
      if ((await page.evaluate(() => window.__census.portals().length)) > 0) break; // a mount state: skip
      // is this candidate the trigger of a registered state at this width?
      const registered = await page.evaluate(({ sel, rows }) => {
        const root = document.querySelector('#storybook-root');
        const target = root.querySelector(':scope > ' + sel);
        return rows.some((r) => {
          if (!r.open.selector) return false;
          try { return [...root.querySelectorAll(r.open.selector.replace(/:scope\s*>/g, '#storybook-root >'))].includes(target); } catch { return false; }
        });
      }, { sel: c.sel, rows: byStory.get(story) });
      if (registered) continue;
      try { await page.locator('#storybook-root > ' + c.sel).first().click({ timeout: 2000 }); } catch { continue; }
      await page.waitForTimeout(600);
      const n = await page.evaluate(() => window.__census.portals().length);
      if (n > 0) { misses++; console.log(`  UNREGISTERED ${story} @${width}: ${c.tag} "${c.label}" opens ${n} portal(s)`); }
    }
  }
}
console.log(`unregistered portal-opening triggers found in registered Stories: ${misses}`);
server.close();
await browser.close();
