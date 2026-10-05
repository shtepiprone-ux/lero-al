// Task 741 Revision 3 — AC32/AC33 preservation probe (evidence only, not a gate).
// usage: node probe.mjs <static-dir> <out.json>
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium } from 'playwright'

const [dir, out] = process.argv.slice(2)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png' }
const server = createServer(async (req, res) => {
  try {
    const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([\\/])+/, '')
    const buf = await readFile(join(dir, p || 'index.html'))
    res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' })
    res.end(buf)
  } catch { res.writeHead(404); res.end() }
})
await new Promise(r => server.listen(0, r))
const base = `http://127.0.0.1:${server.address().port}`

const LABEL_PROPS = ['background-color', 'border-top-width', 'border-top-style', 'border-top-color', 'border-right-width', 'border-bottom-width', 'border-left-width', 'color', 'font-size', 'font-weight', 'line-height', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'rotate', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius']
const SCRIM_PROPS = ['background-color', 'z-index', 'position']

const browser = await chromium.launch()
const result = { cards: {}, banner: {} }
for (const id of ['mantine-primitives-listingcard--default', 'patterns-mantine-listingcardpattern--default']) {
  for (const w of [1440, 320]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=locale:en`)
    await page.waitForSelector('[class*="overlayLabel"]', { timeout: 30000 })
    await page.waitForTimeout(1500)
    result.cards[`${id}@${w}`] = await page.evaluate(({ LABEL_PROPS, SCRIM_PROPS }) => {
      const pick = (el, props) => { const cs = getComputedStyle(el); return Object.fromEntries(props.map(p => [p, cs.getPropertyValue(p)])) }
      return [...document.querySelectorAll('[class*="overlayLabel"]')].map(label => {
        const scrim = label.parentElement
        const section = label.closest('.mantine-Card-section') ?? scrim.parentElement
        const fav = section.querySelector('button')
        let hit = null
        if (fav) {
          fav.scrollIntoView({ block: 'center', inline: 'nearest' })
          const r = fav.getBoundingClientRect()
          const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
          hit = e ? { sameAsFavOrInside: fav.contains(e), tag: e.tagName } : null
        }
        const lr = label.getBoundingClientRect()
        const ir = section.getBoundingClientRect()
        return {
          text: label.textContent,
          toneClasses: [...label.classList].map(c => c.replace(/^.*__/, '')),
          label: pick(label, LABEL_PROPS),
          labelInsidePhoto: lr.left >= ir.left && lr.right <= ir.right && lr.top >= ir.top && lr.bottom <= ir.bottom,
          scrim: pick(scrim, SCRIM_PROPS),
          favouriteHit: hit,
        }
      })
    }, { LABEL_PROPS, SCRIM_PROPS })
    await page.close()
  }
}
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${base}/iframe.html?id=mantine-primitives-listingstatusbanner--default&viewMode=story&globals=locale:en`)
  await page.waitForSelector('.mantine-Alert-root', { timeout: 30000 })
  await page.waitForTimeout(1000)
  result.banner = await page.evaluate(() =>
    [...document.querySelectorAll('.mantine-Alert-root')].map(el => ({
      text: el.querySelector('.mantine-Alert-message')?.textContent?.trim().slice(0, 40),
      background: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color,
      borderColor: getComputedStyle(el).borderTopColor,
    })))
  await page.close()
}
await browser.close()
server.close()
await writeFile(out, JSON.stringify(result, null, 2) + '\n', 'utf8')
console.log('wrote', out, Object.keys(result.cards).join(' | '), 'banner rows:', result.banner.length)
