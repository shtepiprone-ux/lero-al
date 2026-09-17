// Reviewer counter-check for Task 828 R7: does I-G detect a display:grid card container nested
// inside a section beyond the first two candidates? Uses the gate's own evalRailCell source verbatim.
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';

const ROOT = 'C:/Claude_Code_Projects/lero-al';
const require = createRequire(join(ROOT, 'package.json'));
const { chromium } = require('playwright');

const src = readFileSync(join(ROOT, 'scripts/check-homepage-grid.mjs'), 'utf8');
const start = src.indexOf('function evalRailCell');
const end = src.indexOf('/* eslint-enable no-undef */', start);
const evalRailSrc = src.slice(start, end);
if (start < 0 || end < 0) throw new Error('evalRailCell not found');

const dir = join(ROOT, 'storybook-static');
if (!existsSync(dir)) throw new Error('no storybook-static');
const server = createServer(async (req, res) => {
  let p = req.url.split('?')[0]; if (p === '/') p = '/index.html';
  try { const d = await readFile(join(dir, p)); res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' }[extname(p)] ?? 'application/octet-stream' }); res.end(d); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(6031, '127.0.0.1', r));
const browser = await chromium.launch();

async function run(label, plantSection) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('http://127.0.0.1:6031/iframe.html?id=patterns-mantine-homepagelistinggrids--default&globals=locale:en&viewMode=story', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const out = await page.evaluate(({ evalRailSrc, plantSection }) => {
    const rails = [...document.querySelectorAll('#storybook-root *')].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.display === 'flex' && (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.querySelector('.listing-card');
    });
    const before = rails.length;
    if (plantSection != null) {
      const rail = rails[plantSection];
      const item = rail.lastElementChild;
      const wrap = document.createElement('div');
      wrap.style.display = 'grid';
      rail.appendChild(wrap);
      wrap.appendChild(item);
    }
    // eslint-disable-next-line no-new-func
    const evalRailCell = new Function(`${evalRailSrc}; return evalRailCell;`)();
    return { railsBefore: before, result: evalRailCell({ plantIndex: null }) };
  }, { evalRailSrc, plantSection });
  console.log(label, JSON.stringify(out));
  await page.close();
}

await run('CONTROL (no plant)', null);
await run('PLANT grid wrapper inside Latest rail', 1);
await run('PLANT grid wrapper inside Featured rail', 0);
await browser.close();
server.close();
