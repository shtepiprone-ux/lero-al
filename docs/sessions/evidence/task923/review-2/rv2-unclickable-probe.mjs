// Review 2 probe (Opus, diagnosis only): how many of discovery's candidates() can Playwright not operate
// (clickThrough() skips them with `continue`, unrecorded)? Trial click = actionability check only, nothing clicked.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { startStaticServer, storybookContext, loadStory, runPool } from '../../../../../scripts/rendered-state-census/runner.mjs';
import { inScopeStories, clickWidths } from '../../../../../scripts/rendered-state-census/discover.mjs';
const index = JSON.parse(readFileSync('storybook-static/index.json', 'utf8'));
const reg = JSON.parse(readFileSync('scripts/rendered-interaction-states.json', 'utf8'));
const server = await startStaticServer('storybook-static', 6093);
const browser = await chromium.launch();
const ctx = storybookContext('http://127.0.0.1:6093');
const stories = inScopeStories(index);
let total = 0, blocked = 0;
const out = [];
const jobs = stories.map((s) => ({ target: { story: s.id, state: 'closed', locale: 'en', width: 390 }, run: async (page) => {
  const rows = reg.states.filter((x) => x.story === s.id);
  const hasMount = rows.some((x) => x.open.kind === 'mount');
  for (const width of clickWidths(rows)) {
    const l = await loadStory(page, ctx, { story: s.id, locale: 'en', width });
    if (!l.ok) continue;
    const cands = await page.evaluate(() => window.__census.candidates());
    for (const c of cands) {
      total++;
      try { await page.locator('#storybook-root').locator(':scope > ' + c.sel).first().click({ trial: true, timeout: 1500 }); }
      catch (e) { blocked++; out.push(`${s.id} @${width} mountRow=${hasMount} ${c.tag} "${c.label}" :: ${String(e.message).split('\n').find((x) => /intercepts|not visible|outside|detached|not stable|disabled/.test(x)) ?? String(e.message).split('\n')[0]}`.slice(0, 260)); }
    }
  }
  return [];
} }));
await runPool(browser, jobs, 8, () => {});
console.log(`candidates ${total}; not operable at first load ${blocked}`);
const noMount = out.filter((l) => l.includes('mountRow=false'));
console.log(`of which in Stories with no mount row: ${noMount.length}`);
for (const l of out.sort()) console.log('  ' + l);
await browser.close(); server.close();
