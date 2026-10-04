// Task 741 R3c review: GR-3g. DPR-1 crops of the sold/rented overlay label (uk@320, the widest label) and of the
// photo frame's corners, each scaled 10x with image-rendering: pixelated. Also records the label's clipping ancestors.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const dir = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const outDir = new URL('./', import.meta.url)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const out = { platform: process.platform, node: process.version, cells: {} }
for (const id of ['patterns-mantine-listingcardpattern--default', 'mantine-primitives-listingcard--default']) {
  const page = await browser.newPage({ viewport: { width: 320, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:uk`)
  await page.waitForSelector('#storybook-root .mantine-Badge-root', { timeout: 30000, state: 'attached' })
  await page.waitForTimeout(1500)
  const labels = await page.$$('#storybook-root span')
  const rotated = []
  for (const h of labels) if (await h.evaluate(e => getComputedStyle(e).rotate === '-8deg')) rotated.push(h)
  const info = []
  for (const [i, h] of rotated.entries()) {
    await h.scrollIntoViewIfNeeded()
    const meta = await h.evaluate(e => {
      const x = e.getBoundingClientRect()
      const clips = []
      for (let n = e.parentElement; n && n.id !== 'storybook-root'; n = n.parentElement) {
        const s = getComputedStyle(n)
        if (s.overflow !== 'visible' && parseFloat(s.borderTopLeftRadius) > 0) { const r = n.getBoundingClientRect(); clips.push({ cls: String(n.className).split(' ').slice(0, 2).join('.'), radius: s.borderTopLeftRadius, border: s.borderTopWidth, box: [r.left, r.top, r.right, r.bottom].map(Math.round) }) }
      }
      return { text: e.textContent.trim(), radius: getComputedStyle(e).borderTopLeftRadius, border: getComputedStyle(e).borderTopWidth, box: [x.left, x.top, x.right, x.bottom].map(Math.round), clips }
    })
    const [l, t, r, b] = meta.box
    const clip = { x: Math.max(0, l - 4), y: Math.max(0, t - 4), width: r - l + 8, height: b - t + 8 }
    const png = await page.screenshot({ clip })
    const name = `gr3g-${id.split('-')[1]}-label${i}-uk320`
    await writeFile(new URL(name + '.png', outDir), png)
    meta.crop = name + '.png'
    // 10x pixelated rendering of the same crop
    const p2 = await browser.newPage({ viewport: { width: clip.width * 10, height: clip.height * 10 }, deviceScaleFactor: 1 })
    await p2.setContent(`<body style="margin:0"><img src="data:image/png;base64,${png.toString('base64')}" style="width:${clip.width * 10}px;height:${clip.height * 10}px;image-rendering:pixelated;display:block"></body>`)
    await writeFile(new URL(name + '-10x.png', outDir), await p2.screenshot())
    await p2.close()
    meta.crop10x = name + '-10x.png'
    info.push(meta)
  }
  out.cells[id] = info
  await page.close()
}
await browser.close(); server.close()
await writeFile(new URL('./gr3g-label-crop.json', outDir), JSON.stringify(out, null, 1) + '\n', 'utf8')
console.log(JSON.stringify(out, null, 1))
