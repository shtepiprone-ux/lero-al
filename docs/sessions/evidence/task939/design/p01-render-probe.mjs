// Task 939 design probe: open the failing Stories of the CI Storybook build (run 41300859846 artifact
// `storybook-build`) exactly as scripts/check-locale-leak.mjs does, and print every pageerror and
// console error with its first stack frames. Usage: node p01-render-probe.mjs <storybook-static dir>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(process.argv[2]);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const stories = [
  'mantine-primitives-favoritesshell--empty',
  'mantine-primitives-favoritesshell--error',
  'mantine-primitives-favoritesshell--populated',
  'mantine-primitives-favoritesshell--type-filter-no-matches',
  'patterns-mantine-dashboardperiodcontrol--custom-range-too-long',
  'mantine-primitives-alert--default',
];
const viewports = [{ name: 'mobile-320', width: 320, height: 800 }, { name: 'desktop-1280', width: 1280, height: 900 }];
const browser = await chromium.launch();
for (const id of stories) {
  for (const vp of viewports) {
    for (const locale of ['en', 'sq']) {
      const page = await browser.newPage();
      const events = [];
      page.on('pageerror', e => events.push(`pageerror: ${String(e.message).split('\n')[0]} @ ${String(e.stack || '').split('\n').slice(1, 3).map(s => s.trim()).join(' | ')}`));
      page.on('console', m => { if (m.type() === 'error') events.push(`console.error: ${m.text().split('\n')[0].slice(0, 300)}`); });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${base}/iframe.html?id=${id}&globals=locale:${locale}&viewMode=story`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      let phase = 'timeout';
      try {
        await page.waitForFunction(sid => { const r = window.__STORYBOOK_PREVIEW__?.currentRender; return r?.id === sid && ['finished', 'errored'].includes(r.phase); }, id, { timeout: 15000 });
        phase = await page.evaluate(() => window.__STORYBOOK_PREVIEW__?.currentRender?.phase);
      } catch { /* phase stays timeout */ }
      await page.waitForTimeout(1500);
      console.log(`${id} ${vp.name} ${locale}: phase=${phase} events=${events.length}`);
      for (const e of [...new Set(events)]) console.log(`   ${e}`);
      await page.close();
    }
  }
}
await browser.close();
server.close();
