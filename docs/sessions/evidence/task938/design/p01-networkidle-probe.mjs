// Task 938 design probe: load a locale homepage the way scripts/check-click-shield.mjs:1407 does
// (waitUntil 'networkidle', 30 s) and record which requests are still open, which repeat, and
// when 'domcontentloaded' / 'load' fire. Usage: node p01-networkidle-probe.mjs <baseUrl> [path]
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://127.0.0.1:3100';
const target = process.argv[3] || '/sq';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 800 } });
const t0 = Date.now();
const open = new Map();
const counts = new Map();
const key = u => { try { const x = new URL(u); return x.origin === new URL(base).origin ? x.pathname : `${x.host}${x.pathname}`; } catch { return u; } };
page.on('request', r => { open.set(r, Date.now() - t0); const k = `${r.method()} ${key(r.url())}`; counts.set(k, (counts.get(k) || 0) + 1); });
page.on('requestfinished', r => open.delete(r));
page.on('requestfailed', r => { open.delete(r); console.log(`failed ${Date.now() - t0}ms ${r.method()} ${key(r.url())} ${r.failure()?.errorText}`); });
page.on('domcontentloaded', () => console.log(`domcontentloaded ${Date.now() - t0}ms`));
page.on('load', () => console.log(`load ${Date.now() - t0}ms`));
page.on('websocket', ws => console.log(`websocket ${Date.now() - t0}ms ${key(ws.url())}`));
let result = 'networkidle reached';
try {
  const resp = await page.goto(`${base}${target}`, { waitUntil: 'networkidle', timeout: 30000 });
  console.log(`status ${resp?.status()}`);
} catch (e) { result = String(e.message).split('\n')[0]; }
console.log(`${result} after ${Date.now() - t0}ms`);
console.log('still open:');
for (const [r, at] of open) console.log(`   since ${at}ms ${r.method()} ${r.resourceType()} ${key(r.url())}`);
console.log('requests by count (top 15):');
for (const [k, n] of [...counts].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`   ${n}x ${k}`);
await browser.close();
