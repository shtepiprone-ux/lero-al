// Probe of Revision 16 (R80): lists the candidate triggers the census itself would find on one built Story, so that the registry row names the real selector.
//   node docs/sessions/evidence/task923/r17-12-probe-triggers.mjs <story-id> [width]
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { newMeasuringPage, loadStory, startStaticServer, storybookContext } from '../../../../scripts/rendered-state-census/runner.mjs';

const [story, width = '390'] = process.argv.slice(2);
if (!story) { console.error('usage: node r17-12-probe-triggers.mjs <story-id> [width]'); process.exit(2); }
const server = await startStaticServer(resolve('storybook-static'), 6061);
const browser = await chromium.launch();
try {
  const ctx = storybookContext('http://127.0.0.1:6061');
  const page = await newMeasuringPage(browser);
  const loaded = await loadStory(page, ctx, { story, state: 'closed', locale: 'en', width: Number(width) });
  console.log('loaded', JSON.stringify(loaded));
  const candidates = await page.evaluate(() => window.__census.candidates());
  for (const c of candidates) console.log(JSON.stringify(c));
  // every visible element with the role and name of each candidate (two triggers can share a label; the census lists one per tag + label)
  for (const c of candidates) console.log('same identity:', JSON.stringify(await page.evaluate(([r, n]) => window.__census.findByIdentity(r, n), ['button', c.label])));
} finally {
  await browser.close();
  server.close();
}
