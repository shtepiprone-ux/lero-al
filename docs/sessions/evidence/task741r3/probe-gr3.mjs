// Task 741 R3 — GR-3b/3c/3d/3g measurements on storybook-static (evidence only).
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium } from 'playwright'
const dir = process.argv[2]
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' }
const server = createServer(async (req, res) => { try { const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\/])+/, ''); const b = await readFile(join(dir, p || 'index.html')); res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' }); res.end(b) } catch { res.writeHead(404); res.end() } })
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`
const stories = { 'Mantine/Primitives/ListingCard': 'mantine-primitives-listingcard--default', 'Patterns/Mantine/ListingCardPattern': 'patterns-mantine-listingcardpattern--default', 'Mantine/Primitives/ListingStatusBanner': 'mantine-primitives-listingstatusbanner--default' }
const browser = await chromium.launch(); const out = {}
for (const [name, id] of Object.entries(stories)) for (const w of [320, 390, 768, 1024, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:en`)
  await page.waitForSelector('.mantine-Card-root, .mantine-Alert-root', { timeout: 30000 }); await page.waitForTimeout(1500)
  out[`${name}@${w}`] = await page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    const rr = root.firstElementChild.getBoundingClientRect()
    const content = [...root.querySelectorAll('.mantine-Card-root, .mantine-Alert-root, .mantine-Title-root')]
    const left = Math.min(...content.map(e => e.getBoundingClientRect().left))
    const right = Math.max(...content.map(e => e.getBoundingClientRect().right))
    const top = Math.min(...content.map(e => e.getBoundingClientRect().top + scrollY))
    const bottom = Math.max(...content.map(e => e.getBoundingClientRect().bottom + scrollY))
    const fs = sel => [...new Set([...root.querySelectorAll(sel)].map(e => getComputedStyle(e).fontSize))]
    const lab = [...root.querySelectorAll('[class*="overlayLabel"]')].map(l => { const s = l.closest('.mantine-Card-section').getBoundingClientRect(), r = l.getBoundingClientRect(); return { gapL: Math.round(r.left - s.left), gapR: Math.round(s.right - r.right), gapT: Math.round(r.top - s.top), gapB: Math.round(s.bottom - r.bottom) } })
    return {
      hOverflow: document.documentElement.scrollWidth > innerWidth, scrollWidth: document.documentElement.scrollWidth,
      edgeGaps: { top: Math.round(top), right: Math.round(innerWidth - right), bottom: Math.round(document.documentElement.scrollHeight - bottom), left: Math.round(left) },
      titleFontSizes: fs('.mantine-Title-root'), overlayLabelFontSize: fs('[class*="overlayLabel"]'), cardTitleFontSize: fs('h3'), badgeFontSize: fs('.mantine-Badge-root'), alertTextFontSize: fs('.mantine-Alert-message'),
      overlayLabelGaps: lab,
    }
  })
  await page.close()
}
await browser.close(); server.close()
await writeFile('probe-gr3.json', JSON.stringify(out, null, 2) + '\n', 'utf8')
for (const [k, v] of Object.entries(out)) console.log(k, 'hOver', v.hOverflow, 'gaps', JSON.stringify(v.edgeGaps), 'title', v.titleFontSizes.join(','), 'label', v.overlayLabelFontSize.join(','), 'h3', v.cardTitleFontSize.join(','), 'alert', v.alertTextFontSize.join(','), 'minLabelGap', v.overlayLabelGaps.length ? Math.min(...v.overlayLabelGaps.flatMap(g => Object.values(g))) : '-')
