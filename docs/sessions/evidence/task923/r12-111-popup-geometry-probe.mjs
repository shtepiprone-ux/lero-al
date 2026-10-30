// Task 923 R55 (outcome (iv)): where does the popup-under-its-controls overlap come from? A read-only probe of the BUILT Storybook, gate unchanged (it uses no census code).
// Opens a `listingdetailview` Story, waits for Map.tsx to open its popup, and prints, per width, the boxes of the map container, the popup content, the popup close button ("×"),
// the zoom-out button ("−") and the zoom-in button ("+") and the intersection of the popup content with each control, plus the options the product passes (read from the DOM:
// the popup's computed max-width). Nothing is edited.
//   node docs/sessions/evidence/task923/r12-111-popup-geometry-probe.mjs <storyId> <locale> <width,width,...>
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'

const [storyId, locale, widthsArg] = process.argv.slice(2)
const ROOT = resolve('storybook-static')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' }
const server = createServer(async (req, res) => {
  const path = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (path !== ROOT && !path.startsWith(ROOT + sep)) { res.writeHead(404); return res.end() }
  try { const body = await readFile(path === ROOT ? join(path, 'index.html') : path); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body) } catch { res.writeHead(404); res.end() }
}).listen(0)
const port = server.address().port
const browser = await chromium.launch()
for (const width of widthsArg.split(',').map(Number)) {
  const context = await browser.newContext({ viewport: { width, height: 844 } }) // 844 = HEIGHT of scripts/rendered-state-census/runner.mjs
  const page = await context.newPage()
  await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${storyId}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(3500)
  const out = await page.evaluate(() => {
    const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x1: +r.left.toFixed(1), y1: +r.top.toFixed(1), x2: +r.right.toFixed(1), y2: +r.bottom.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) } }
    const inter = (a, b) => { if (!a || !b) return null; const w = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1); const h = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1); return w > 0 && h > 0 ? `${w.toFixed(1)}x${h.toFixed(1)}px` : 'none' }
    const container = document.querySelector('.leaflet-container')
    const content = document.querySelector('.leaflet-popup-content')
    const wrapper = document.querySelector('.leaflet-popup-content-wrapper')
    const close = document.querySelector('.leaflet-popup-close-button')
    const zoomOut = document.querySelector('.leaflet-control-zoom-out')
    const zoomIn = document.querySelector('.leaflet-control-zoom-in')
    const b = { container: box(container), content: box(content), wrapper: box(wrapper), close: box(close), zoomIn: box(zoomIn), zoomOut: box(zoomOut) }
    const text = (content?.textContent ?? '').trim().slice(0, 30)
    return { popupOpen: !!content, popupText: text, popupContentStyleWidth: content?.style.width ?? null, boxes: b, contentVsClose: inter(b.content, b.close), contentVsZoomOut: inter(b.content, b.zoomOut), contentVsZoomIn: inter(b.content, b.zoomIn) }
  })
  console.log(`width ${width} ${locale}: ${JSON.stringify(out)}`)
  await context.close()
}
await browser.close()
server.close()
