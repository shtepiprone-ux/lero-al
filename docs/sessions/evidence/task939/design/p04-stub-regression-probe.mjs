// Task 939 design probe: for every Story of the Story files that statically reach src/lib/supabase/client.ts
// (p02-client-reach.txt), render it in two Storybook builds — A = CI run 41300859846 artifact (no stub),
// B = scratchpad build with the inert client alias (p03 stub) — and compare the rendered body text,
// the render phase and the render errors. Usage: node p04-stub-regression-probe.mjs <A dir> <B dir> <p02 txt>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [dirA, dirB, reachTxt] = process.argv.slice(2).map(p => path.resolve(p));
const files = fs.readFileSync(reachTxt, 'utf8').split('\n').filter(l => /^src\/.*\.stories\.tsx?$/.test(l.trim())).map(l => './' + l.trim());
const index = JSON.parse(fs.readFileSync(path.join(dirA, 'index.json'), 'utf8'));
const ids = Object.values(index.entries).filter(e => e.type === 'story' && files.includes(e.importPath)).map(e => e.id).sort();
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
function serve(root) {
  const s = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise(r => s.listen(0, '127.0.0.1', () => r(s)));
}
const [sa, sb] = await Promise.all([serve(dirA), serve(dirB)]);
const browser = await chromium.launch();
async function render(server, id) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let failure = false;
  page.on('pageerror', () => { failure = true; });
  page.on('console', m => { if (m.type() === 'error' && m.text().includes(`Error rendering story '${id}'`)) failure = true; });
  await page.goto(`http://127.0.0.1:${server.address().port}/iframe.html?id=${id}&globals=locale:en&viewMode=story`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  let phase = 'timeout';
  try {
    await page.waitForFunction(sid => { const r = window.__STORYBOOK_PREVIEW__?.currentRender; return r?.id === sid && ['finished', 'errored'].includes(r.phase); }, id, { timeout: 15000 });
    phase = await page.evaluate(() => window.__STORYBOOK_PREVIEW__?.currentRender?.phase);
  } catch { /* timeout */ }
  await page.waitForTimeout(800);
  const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
  await page.close();
  return { phase, failure, text };
}
let same = 0; const diffs = [];
for (const id of ids) {
  const a = await render(sa, id); const b = await render(sb, id);
  const ok = a.phase === b.phase && a.failure === b.failure && a.text === b.text;
  if (ok) same += 1; else diffs.push({ id, a: { phase: a.phase, failure: a.failure, len: a.text.length }, b: { phase: b.phase, failure: b.failure, len: b.text.length } });
  console.log(`${ok ? 'SAME' : 'DIFF'} ${id} A:${a.phase}/${a.failure ? 'error' : 'ok'} B:${b.phase}/${b.failure ? 'error' : 'ok'}`);
}
console.log(`\n${ids.length} stories from ${files.length} files: ${same} identical, ${diffs.length} different`);
for (const d of diffs) console.log(JSON.stringify(d));
await browser.close(); sa.close(); sb.close();
