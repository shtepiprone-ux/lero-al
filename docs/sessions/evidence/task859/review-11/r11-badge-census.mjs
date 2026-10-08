// Review 11 (Opus): + per-Story probe timeout (20s), an error screen recorded as an error, progress on stderr. Revision 9 (Sonnet) copy of r9x-badge-census.mjs: look key adds padding and icon identity (GR-12 lists both); port 6212; outputs r9-*.
// usage: node r9x-badge-census.mjs <before|after>
// Census of EVERY badge-like element in EVERY Story of storybook-static (en, 1440, DPR 1):
//   - `.mantine-Badge-root` (the canonical element), and
//   - legacy: any element whose class contains `badge` (not mantine-Badge-*), and any `rounded-full` label with
//     `text-xs` / `text-2xs` (hand-made pill).
// Output: r9x-badge-census-<tag>.json (raw) + r7-badge-groups-<tag>.json (label -> distinct looks -> story ids).
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const tag = process.argv[2] ?? 'after'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6212)
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const ids = Object.values(index.entries).filter(e => e.type === 'story').map(e => e.id)

const probe = () => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
  const clsOf = el => (el.className?.baseVal ?? el.className ?? '').toString()
  const describe = (el, kind) => {
    const s = getComputedStyle(el)
    return {
      kind,
      label: el.textContent.trim().slice(0, 40),
      variant: el.getAttribute('data-variant'), size: el.getAttribute('data-size'),
      bg: s.backgroundColor, color: s.color, border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
      radius: s.borderTopLeftRadius, h: Math.round(el.getBoundingClientRect().height), fs: s.fontSize, fw: s.fontWeight, tt: s.textTransform,
      pad: `${s.paddingLeft}/${s.paddingRight}`, icon: (() => { const g = el.querySelector('svg'); if (!g) return null; const p = g.querySelector('path,circle,rect'); return (g.getAttribute('class') ?? '') + ':' + (p ? (p.getAttribute('d') ?? p.tagName).slice(0, 24) : '') })(),
      cls: kind === 'legacy' ? clsOf(el).slice(0, 120) : undefined,
    }
  }
  const out = []
  for (const el of document.querySelectorAll('.mantine-Badge-root')) if (vis(el)) out.push(describe(el, 'mantine'))
  for (const el of document.querySelectorAll('*')) {
    if (!vis(el) || el.closest('.mantine-Badge-root')) continue
    const c = clsOf(el)
    const badgeClass = /(^|\s|-)badge(\s|-|$)/i.test(c) && !/mantine-Badge/.test(c)
    const pill = /\brounded-full\b/.test(c) && /\btext-(xs|2xs)\b/.test(c) && el.textContent.trim() && el.children.length < 3
    if (badgeClass || pill) out.push(describe(el, 'legacy'))
  }
  return out
}

const browser = await chromium.launch()
const raw = []
let next = 0
async function worker() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  while (next < ids.length) {
    const id = ids[next++]
    if (next % 50 === 0) console.error(`progress ${next}/${ids.length} ${new Date().toISOString()}`)
    try {
      await page.goto(`http://127.0.0.1:6212/iframe.html?id=${id}&globals=locale:en&viewMode=story`, { timeout: 30000 })
      await page.waitForSelector('#storybook-root > *', { timeout: 15000 }).catch(() => null)
      await page.waitForTimeout(1200)
      const badges = await Promise.race([page.evaluate(probe), new Promise((_, rej) => setTimeout(() => rej(new Error('probe timeout 20s')), 20000))])
      const errScreen = await page.evaluate(() => document.body.classList.contains('sb-show-errordisplay'))
      if (errScreen) raw.push({ id, error: 'error screen (body.sb-show-errordisplay)' })
      for (const b of badges) raw.push({ id, ...b })
    } catch (e) { raw.push({ id, error: String(e.message).slice(0, 120) }) }
  }
  await ctx.close()
}
await Promise.all([worker(), worker(), worker(), worker()])
await browser.close()
server.close()
fs.writeFileSync(path.join(DIR, `r11-badge-census-${tag}.json`), JSON.stringify({ platform: process.platform, node: process.version, stories: ids.length, raw }, null, 1))
const groups = {}
for (const b of raw.filter(r => !r.error && r.kind === 'mantine')) {
  const look = [b.variant, b.bg, b.color, b.border, b.radius, b.h, b.fs, b.fw, b.tt, b.pad, b.icon].join(' | ')
  ;((groups[b.label] ??= {})[look] ??= new Set()).add(b.id)
}
const out = Object.fromEntries(Object.entries(groups).map(([l, looks]) => [l, Object.fromEntries(Object.entries(looks).map(([k, v]) => [k, [...v]]))]))
fs.writeFileSync(path.join(DIR, `r11-badge-groups-${tag}.json`), JSON.stringify(out, null, 1))
const legacy = raw.filter(r => !r.error && r.kind === 'legacy')
fs.writeFileSync(path.join(DIR, `r11-badge-legacy-${tag}.json`), JSON.stringify(legacy, null, 1))
console.log('stories', ids.length, 'mantine badges', raw.filter(r => !r.error && r.kind === 'mantine').length, 'legacy elements', legacy.length, 'errors', raw.filter(r => r.error).length, 'labels', Object.keys(out).length, 'labels with >1 look', Object.values(out).filter(v => Object.keys(v).length > 1).length)
