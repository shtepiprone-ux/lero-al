// Task 741 Revision 3j R76 — archived cards: effective opacity (product over ancestors) of the root, the image node,
// every badge, the photo count, the overlay label and the favourite, on both card Stories, grid and list, 390 and 1440.
// Exit 1 unless root/badges/photo count/label/favourite are 1 and the image node is 0.6.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const OUT = process.env.ARCHIVED_OUT ?? 'docs/sessions/evidence/task741r3/rev3j/exec/archived-opacity.json'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).split(String.fromCharCode(92)).join('/').replace(/^\/+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const result = { platform: process.platform, cards: [], failures: [] }
for (const w of [390, 1440]) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: w, height: 900 } })
  for (const id of ['patterns-mantine-listingcardpattern--default', 'mantine-primitives-listingcard--default']) {
    const p = await ctx.newPage()
    await p.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:en`)
    await p.waitForSelector('#storybook-root .mantine-Card-root', { timeout: 30000 }); await p.waitForTimeout(2500)
    const cards = await p.evaluate(() => {
      const eff = el => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return Math.round(o * 100) / 100 }
      return [...document.querySelectorAll('.mantine-Card-root')].filter(c => /archived/.test(c.className)).map(c => {
        const sec = c.querySelector('[class*="imageSection"]')
        const grid = !!c.closest('.mantine-SimpleGrid-root')
        const img = sec?.firstElementChild
        const rec = { layout: grid ? 'grid' : 'list', root: eff(c), image: img ? eff(img) : null, badges: [], photoCount: [], label: [], favourite: [] }
        c.querySelectorAll('[data-card-part="badges"] .mantine-Badge-root').forEach(e => rec.badges.push(eff(e)))
        c.querySelectorAll('[data-card-part="photo-count"]').forEach(e => rec.photoCount.push(eff(e)))
        c.querySelectorAll('[data-card-part="overlay"] span').forEach(e => rec.label.push(eff(e)))
        c.querySelectorAll('[aria-pressed]').forEach(e => rec.favourite.push(eff(e)))
        return rec
      })
    })
    cards.forEach((c, i) => {
      const tag = `${id}@${w}#${i}:${c.layout}`
      result.cards.push({ tag, ...c })
      if (c.root !== 1) result.failures.push(`${tag} root ${c.root}`)
      if (c.image !== 0.6) result.failures.push(`${tag} image ${c.image}`)
      for (const k of ['badges', 'photoCount', 'label', 'favourite']) c[k].forEach(v => { if (v !== 1) result.failures.push(`${tag} ${k} ${v}`) })
    })
    if (!cards.length) result.failures.push(`${id}@${w} no archived card found`)
    await p.close()
  }
  await ctx.close()
}
await browser.close(); server.close()
await writeFile(OUT, JSON.stringify(result, null, 1) + '\n')
console.log(`archived cards: ${result.cards.length}; failures: ${result.failures.length}`)
result.failures.slice(0, 12).forEach(f => console.log('FAIL', f))
process.exit(result.failures.length ? 1 : 0)
