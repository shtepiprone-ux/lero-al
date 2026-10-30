// Revision 16: opens one Story of the BUILT Storybook and prints what the page reports (console errors, uncaught page errors, failed requests) and whether the Story rendered.
//   node docs/sessions/evidence/task923/r17-24-story-errors.mjs <story-id>
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { startStaticServer } from '../../../../scripts/rendered-state-census/runner.mjs';

const story = process.argv[2];
if (!story) { console.error('usage: node r17-24-story-errors.mjs <story-id>'); process.exit(2); }
const server = await startStaticServer(resolve('storybook-static'), 6064);
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const lines = [];
  page.on('console', (m) => { if (m.type() === 'error') lines.push('console.error: ' + m.text().slice(0, 400)); });
  page.on('pageerror', (e) => lines.push('pageerror: ' + String(e.message).slice(0, 400)));
  page.on('requestfailed', (r) => lines.push('requestfailed: ' + r.url().slice(0, 200)));
  await page.goto(`http://127.0.0.1:6064/iframe.html?id=${story}&viewMode=story&globals=locale:en`, { waitUntil: 'load' });
  await page.waitForTimeout(6000);
  const state = await page.evaluate(() => ({ classes: document.body.className, rootChildren: document.querySelector('#storybook-root')?.childElementCount ?? -1, error: document.querySelector('.sb-errordisplay') ? document.querySelector('.sb-errordisplay').textContent.slice(0, 400) : null }));
  console.log(JSON.stringify({ story, rendered: !state.classes.includes('sb-show-errordisplay'), rootChildren: state.rootChildren, classes: state.classes, errorText: state.classes.includes('sb-show-errordisplay') ? state.error : null }));
  for (const l of [...new Set(lines)].slice(0, 8)) console.log(l);
} finally { await browser.close(); server.close(); }
