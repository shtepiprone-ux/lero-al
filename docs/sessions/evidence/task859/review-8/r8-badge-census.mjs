// Task 859 review 8 (Opus) — owner return of O78-13: "the Badge Story's badges are not the ones the cards have".
// Census of EVERY rendered Mantine Badge in EVERY Story of the final storybook-static (en, 1440, DPR 1): label, variant,
// computed fill, text colour, border, radius, height, font. Grouped by label so one status rendered two ways shows up.
// Output: r8-badge-census.json (raw) + r8-badge-groups.json (label -> distinct looks -> story ids).
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6176)
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8'))
const ids = Object.values(index.entries).filter(e => e.type === 'story').map(e => e.id)

const probe = () => [...document.querySelectorAll('.mantine-Badge-root')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }).map(el => {
  const s = getComputedStyle(el)
  return {
    label: el.textContent.trim().slice(0, 40),
    variant: el.getAttribute('data-variant'), size: el.getAttribute('data-size'),
    bg: s.backgroundColor, color: s.color, border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
    radius: s.borderTopLeftRadius, h: Math.round(el.getBoundingClientRect().height), fs: s.fontSize, fw: s.fontWeight, tt: s.textTransform,
    pad: `${s.paddingLeft}/${s.paddingRight}`, icon: !!el.querySelector('svg'),
  }
})

const browser = await chromium.launch()
const raw = []
let next = 0
async function worker() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  while (next < ids.length) {
    const id = ids[next++]
    try {
      await page.goto(`http://127.0.0.1:6176/iframe.html?id=${id}&globals=locale:en&viewMode=story`, { timeout: 30000 })
      await page.waitForSelector('#storybook-root > *', { timeout: 15000 }).catch(() => null)
      await page.waitForTimeout(1200)
      const badges = await page.evaluate(probe)
      for (const b of badges) raw.push({ id, ...b })
    } catch (e) { raw.push({ id, error: String(e.message).slice(0, 120) }) }
  }
  await ctx.close()
}
await Promise.all([worker(), worker(), worker(), worker()])
await browser.close()
server.close()
fs.writeFileSync(path.join(DIR, 'r8-badge-census.json'), JSON.stringify({ platform: process.platform, node: process.version, stories: ids.length, raw }, null, 1))
const groups = {}
for (const b of raw.filter(r => !r.error)) {
  const look = [b.variant, b.bg, b.color, b.border, b.radius, b.h, b.fs, b.fw, b.tt].join(' | ')
  ;((groups[b.label] ??= {})[look] ??= new Set()).add(b.id)
}
const out = Object.fromEntries(Object.entries(groups).map(([l, looks]) => [l, Object.fromEntries(Object.entries(looks).map(([k, v]) => [k, [...v]]))]))
fs.writeFileSync(path.join(DIR, 'r8-badge-groups.json'), JSON.stringify(out, null, 1))
console.log('stories', ids.length, 'badges', raw.filter(r => !r.error).length, 'errors', raw.filter(r => r.error).length, 'labels', Object.keys(out).length, 'labels with >1 look', Object.values(out).filter(v => Object.keys(v).length > 1).length)
