// Task 923 R52 / AC36 (R33 diagnosis): why does `text-overlap` fail on a Story? Opens the BUILT Storybook Story, finds the two text runs the rule names (by a text prefix of each), prints their boxes and the
// stack of elements painted at the centre of their intersection (elementsFromPoint, top first) with each element's background, position, z-index, opacity and whether an ancestor is inert / aria-hidden.
// Read-only: nothing is edited. The gate's own exemption is `coveredAt` (text under an opaque box that is not its ancestor), so the stack shows whether a covering opaque box exists.
//   node docs/sessions/evidence/task923/r10-101-overlap-probe.mjs <storyId> <width> <locale> <textA prefix> <textB prefix> [clickSelector]
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'

const [storyId, widthArg, locale, textA, textB, clickSelector] = process.argv.slice(2)
const ROOT = resolve('storybook-static')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' }
const server = createServer(async (req, res) => {
  const path = resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (path !== ROOT && !path.startsWith(ROOT + sep)) { res.writeHead(404); return res.end() }
  try { const body = await readFile(path === ROOT ? join(path, 'index.html') : path); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body) } catch { res.writeHead(404); res.end() }
}).listen(0)
const port = server.address().port

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: Number(widthArg), height: 844 } }) // 844 = HEIGHT of scripts/rendered-state-census/runner.mjs
const page = await context.newPage()
const failedRequests = []
page.on('requestfailed', (r) => failedRequests.push(`${r.resourceType()} ${r.url().slice(0, 90)} ${r.failure()?.errorText}`))
await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${storyId}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(3500)
if (clickSelector) { await page.locator(clickSelector).first().click({ timeout: 5000 }); await page.waitForTimeout(2500) }

const result = await page.evaluate(([a, b]) => {
  const rectOf = (prefix) => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const out = []
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.nodeValue.trim().startsWith(prefix)) continue
      const range = document.createRange(); range.selectNodeContents(n)
      const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0)
      if (rects.length) out.push({ el: n.parentElement, rects })
    }
    return out
  }
  const describe = (e) => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${[...e.classList].slice(0, 2).map((c) => '.' + c).join('')}`
  const A = rectOf(a)
  const B = rectOf(b)
  const lines = [`runs A "${a}": ${A.length}; B "${b}": ${B.length}`]
  for (const ra of A) for (const rb of B) {
    if (ra.el === rb.el) continue
    for (const x of ra.rects) for (const y of rb.rects) {
      const l = Math.max(x.left, y.left), r = Math.min(x.right, y.right), t = Math.max(x.top, y.top), bt = Math.min(x.bottom, y.bottom)
      if (r - l <= 2 || bt - t <= 0) continue
      const cx = (l + r) / 2, cy = (t + bt) / 2
      lines.push(`OVERLAP ${describe(ra.el)} [${Math.round(x.left)},${Math.round(x.top)} ${Math.round(x.width)}x${Math.round(x.height)}] x ${describe(rb.el)} [${Math.round(y.left)},${Math.round(y.top)} ${Math.round(y.width)}x${Math.round(y.height)}] by ${Math.round(r - l)}x${Math.round(bt - t)} at centre ${Math.round(cx)},${Math.round(cy)} (viewport ${innerWidth}x${innerHeight})`)
      // elementsFromPoint only answers for a point inside the viewport: scroll the centre of the overlap into view first (the gate's `coveredAt` does not, it treats such a point as not covered)
      const before = scrollY
      const outside = cy < 0 || cy >= innerHeight
      if (outside) scrollBy(0, cy - innerHeight / 2)
      const cy2 = cy - (scrollY - before)
      lines.push(`   (centre ${outside ? `was outside the viewport; scrolled by ${Math.round(scrollY - before)}px, now at y ${Math.round(cy2)}` : 'inside the viewport'})`)
      const stack = document.elementsFromPoint(cx, cy2)
      stack.slice(0, 14).forEach((s, i) => {
        const cs = getComputedStyle(s)
        const inert = s.closest('[inert]') ? ' INERT-ANCESTOR' : ''
        const hidden = s.closest('[aria-hidden="true"]') ? ' ARIA-HIDDEN-ANCESTOR' : ''
        const mark = (s === ra.el || ra.el.contains(s)) ? ' <== A' : (s === rb.el || rb.el.contains(s)) ? ' <== B' : ''
        lines.push(`   ${String(i).padStart(2)} ${describe(s)} bg ${cs.backgroundColor} pos ${cs.position} z ${cs.zIndex} op ${cs.opacity}${inert}${hidden}${mark}`)
      })
      return lines
    }
  }
  return lines
}, [textA, textB])
console.log(`story ${storyId} @${widthArg} ${locale}`)
for (const l of result) console.log(l)
const leaflet = await page.evaluate(() => { const p = document.querySelector('.leaflet-popup'); return p ? `leaflet-popup position ${getComputedStyle(p).position}; leaflet css applied: ${getComputedStyle(document.querySelector('.leaflet-pane') ?? document.body).position === 'absolute'}` : 'no .leaflet-popup' })
console.log(leaflet)
console.log(`failed requests: ${failedRequests.length ? failedRequests.join(' | ') : 'none'}`)
await browser.close()
server.close()
