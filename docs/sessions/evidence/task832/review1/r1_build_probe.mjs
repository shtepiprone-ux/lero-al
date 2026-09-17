import { readFileSync, writeFileSync } from 'node:fs';
const repo = 'C:/Claude_Code_Projects/lero-al';
let src = readFileSync(`${repo}/scripts/check-click-shield.mjs`, 'utf8');
const tail = src.lastIndexOf('main().catch(');
if (tail < 0) throw new Error('tail not found');
src = src.slice(0, tail);
src = src.replaceAll("import('playwright')", `import('file:///${repo}/node_modules/playwright/index.mjs')`);
src += `
const STYLE = 'position:absolute;top:299px;left:40px;width:120px;height:1px;box-sizing:border-box;padding:0;border:0;margin:0;line-height:1;font-size:0;min-height:0;min-width:0;';
const COVER = 'position:absolute;top:290px;left:30px;width:140px;height:20px;z-index:5;background:rgba(255,0,0,.3);';
const COVER_MID = 'position:absolute;top:140px;left:30px;width:140px;height:20px;z-index:5;background:rgba(255,0,0,.3);';
const pagesHtml = {
  '/p1-multiband-edge-clean': '<!DOCTYPE html><html><body style="margin:0;height:1000px;position:relative;"><button id="t" style="' + STYLE + '">x</button></body></html>',
  '/p2-multiband-edge-intercepted': '<!DOCTYPE html><html><body style="margin:0;height:1000px;position:relative;"><button id="t" style="' + STYLE + '">x</button><span style="' + COVER + '"></span></body></html>',
  '/p0-control-mid-intercepted': '<!DOCTYPE html><html><body style="margin:0;height:1000px;position:relative;"><button id="t" style="' + STYLE.replace('top:299px','top:150px') + '">x</button><span style="' + COVER_MID + '"></span></body></html>',
};
const { chromium } = await import('file:///${repo}/node_modules/playwright/index.mjs');
const server = createServer((req, res) => { res.writeHead(200, {'Content-Type':'text/html'}); res.end(pagesHtml[req.url] ?? ''); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
console.log('platform=' + process.platform + ' node=' + process.version);
for (const url of Object.keys(pagesHtml)) {
  await page.goto(base + url, { waitUntil: 'domcontentloaded' });
  const geo = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: innerHeight, r: document.getElementById('t').getBoundingClientRect().toJSON() }));
  const r = await hitTestPage(page);
  console.log(url, JSON.stringify(geo), 'checked=' + r.checked, 'violations=' + r.violations.length, 'cleared=' + r.cleared.length, 'excluded=' + JSON.stringify(r.excluded.map(e => ({reason: e.reason, docTop: e.docTop}))), r.violations.map(v => v.reason ?? ('interceptor ' + v.interceptor?.tag)).join('|'));
}
await browser.close(); server.close(); process.exit(0);
`;
writeFileSync('C:/Users/Nox/AppData/Local/Temp/claude/C--Claude-Code-Projects-lero-al/43dc2fae-886e-43c0-9ddc-301b42d8215a/scratchpad/probe_832_multiband.mjs', src);
console.log('written');
