// Task 741 R3c review — reviewer GR-3b/3c/3d/3g measurement of the O46-2 matrix Stories (adapted from rev3a/review2-probe.mjs).
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const out = process.argv[2]
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const stories = ['mantine-primitives-listingcard--default', 'patterns-mantine-listingcardpattern--default', 'patterns-mantine-listingsshellview--default']
const browser = await chromium.launch()
const result = { platform: process.platform, node: process.version, stories: {} }
for (const id of stories) {
  result.stories[id] = {}
  for (const [loc, w] of [['en', 320], ['en', 390], ['en', 768], ['en', 1024], ['en', 1440], ['uk', 320], ['uk', 1440]]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`)
    await page.waitForSelector('#storybook-root .mantine-Badge-root', { timeout: 30000, state: 'attached' })
    await page.waitForTimeout(1500)
    result.stories[id][loc + "@" + w] = await page.evaluate(() => {
      const root = document.querySelector('#storybook-root')
      const vis = [...root.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && (e.children.length === 0 || e.matches('img,svg,button,[class*=Alert-root],[class*=Paper-root],[class*=Card-root]')) })
      let t = Infinity, l = Infinity, r = -Infinity, b = -Infinity
      for (const e of vis) { const x = e.getBoundingClientRect(); t = Math.min(t, x.top + scrollY); l = Math.min(l, x.left); r = Math.max(r, x.right); b = Math.max(b, x.bottom + scrollY) }
      const docH = document.documentElement.scrollHeight
      const fonts = {}
      for (const e of root.querySelectorAll('h1,h2,h3,h4,h5,h6,.mantine-Title-root,p,span,.mantine-Text-root')) { if (!e.textContent.trim() || e.getBoundingClientRect().width === 0) continue; const fs = getComputedStyle(e).fontSize; const tag = e.tagName.toLowerCase() + (e.classList.contains('mantine-Title-root') ? '.Title' : ''); fonts[tag] = [...new Set([...(fonts[tag] ?? []), fs])] }
      const labels = [...root.querySelectorAll('span')].filter(e => getComputedStyle(e).rotate === '-8deg').map(e => { const x = e.getBoundingClientRect(); const s = getComputedStyle(e); return { fs: s.fontSize, radius: s.borderTopLeftRadius, border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, bg: s.backgroundColor, w: Math.round(x.width), left: Math.round(x.left), right: Math.round(x.right) } })
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        gutter: { top: Math.round(t), right: Math.round(innerWidth - r), bottom: Math.round(docH - b), left: Math.round(l) },
        fonts, labels,
        horizontal: root.querySelectorAll('.listing-card--horizontal').length,
        gridCards: (root.querySelector('.mantine-SimpleGrid-root') || { children: [] }).children.length,
        // every badge outside a horizontal card sits inside its photo / placeholder box
        badgesOutsidePhoto: [...root.querySelectorAll('.mantine-Badge-root')].filter(bd => !bd.closest('.listing-card--horizontal')).filter(bd => { let p = bd.parentElement; let media = null; while (p && p !== root) { media = p.querySelector('img, [data-testid="media-placeholder"]'); if (media) break; p = p.parentElement } if (!media) return false; const box = (media.closest('[class*="media" i], [class*="photo" i], [class*="image" i]') || media).getBoundingClientRect(); const x = bd.getBoundingClientRect(); return x.left < box.left - 0.5 || x.right > box.right + 0.5 || x.top < box.top - 0.5 || x.bottom > box.bottom + 0.5 }).length,
        maxFont: Math.max(...[...root.querySelectorAll('*')].filter(e => e.textContent.trim() && e.children.length === 0).map(e => parseFloat(getComputedStyle(e).fontSize))),
      }
    })
    await page.close()
  }
}
await browser.close(); server.close()
await writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8')
console.log(JSON.stringify(result))
