// Task 829 Revision 1 — AC7 probe. Reuses review/r1_loader_contrast_probe.mjs's selectors
// (button:has(.mantine-Loader-root), storybook-static static server) and adds the AC7 comparison:
// the Loader's ::after border-top-color must equal the button's own computed `color`, and the
// button must still be disabled. Writes only under docs/sessions/evidence/task829/rev1/.
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.argv[2];
const OUT = join(ROOT, 'docs', 'sessions', 'evidence', 'task829', 'rev1');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  try { const d = await readFile(join(ROOT, 'storybook-static', p)); res.writeHead(200, { 'Content-Type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(d); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const result = {};
let allPass = true;
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${base}/iframe.html?id=patterns-mantine-listingcontactpattern--default&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.locator('.mantine-Loader-root').first().waitFor({ timeout: 15000 });
  const loaders = page.locator('button:has(.mantine-Loader-root)');
  const n = await loaders.count();
  result[`${w}`] = [];
  for (let i = 0; i < n; i++) {
    const b = loaders.nth(i);
    const m = await b.evaluate((btn) => {
      const l = btn.querySelector('.mantine-Loader-root');
      const cs = getComputedStyle(btn);
      return {
        text: btn.textContent.trim(),
        disabled: btn.disabled,
        buttonColor: cs.color,
        loaderAfterBorderTopColor: getComputedStyle(l, '::after').borderTopColor,
      };
    });
    m.ac7Pass = m.disabled === true && m.loaderAfterBorderTopColor === m.buttonColor;
    if (!m.ac7Pass) allPass = false;
    result[`${w}`].push(m);
  }
  await page.close();
}
await browser.close();
server.close();
result.allPass = allPass;
await writeFile(join(OUT, 'r1_ac7_probe.json'), JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(result, null, 2));
