// Review 5 probe (diagnosis only): runs the delivered, unmodified in-page measuring code on the review fixtures.
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fixtureContext, runStateJob, startStaticServer } from '../../../../../scripts/rendered-state-census/runner.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const source = readFileSync('scripts/rendered-state-census/in-page.mjs', 'utf8').replace('export function installCensus', 'function installCensus');
const dir = 'docs/sessions/evidence/task923/review-5/fixtures';
const server = await startStaticServer(dir, 6049);
const browser = await chromium.launch();
const ctx = fixtureContext('http://127.0.0.1:6049');
for (const f of readdirSync(dir).filter((x) => x.endsWith('.html'))) {
  const html = readFileSync(`${dir}/${f}`, 'utf8');
  const state = JSON.parse(html.match(/<script type="application\/json" id="census-state">(.*?)<\/script>/s)[1]);
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await page.addInitScript(`(${source.slice(source.indexOf('function installCensus'))})()`);
  const rows = await runStateJob(page, ctx, state, 'en', 390);
  for (const r of rows) {
    const failing = Object.entries(r.rules).filter(([, v]) => v.length);
    console.log(`${f.replace('.html', '')} ${r.root}: ${failing.length ? failing.map(([k, v]) => `${k} [${v.join(' | ')}]`).join(' ; ') : 'green'}`);
  }
  await page.close();
}
await browser.close();
await new Promise((r) => server.close(r));
