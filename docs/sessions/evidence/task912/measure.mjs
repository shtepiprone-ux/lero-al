import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:6107/iframe.html'
const STORIES = [
  'patterns-mantine-listingcontactpattern--default',
  'patterns-mantine-listingdetailpattern--default',
  'patterns-mantine-listingdetailview--public-listing',
]
const runs = []
for (const w of [320, 390, 768, 1024, 1440]) runs.push(['en', w])
for (const l of ['sq', 'uk', 'it']) for (const w of [320, 1440]) runs.push([l, w])

const browser = await chromium.launch()
const out = []
for (const id of STORIES) {
  for (const [loc, w] of runs) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
    await page.goto(`${BASE}?id=${id}&viewMode=story&globals=locale:${loc}`)
    await page.waitForSelector('#storybook-root p', { state: 'attached', timeout: 30000 })
    await page.waitForTimeout(1500)
    const r = await page.evaluate(() => {
      const root = document.querySelector('#storybook-root')
      const vw = document.documentElement.clientWidth
      const rects = [...root.querySelectorAll('*')]
        .filter(
          e =>
            (e.children.length === 0 && !['IMG', 'CANVAS'].includes(e.tagName) && !e.closest('.leaflet-container')) ||
            e.matches('.mantine-Paper-root, .mantine-Card-root'),
        )
        .map(e => e.getBoundingClientRect())
        .filter(b => b.width > 0 && b.height > 0)
      const sh = document.documentElement.scrollHeight
      const gut = {
        top: Math.round(Math.min(...rects.map(b => b.top)) + window.scrollY),
        right: Math.round(vw - Math.max(...rects.map(b => b.right))),
        bottom: Math.round(sh - Math.max(...rects.map(b => b.bottom + window.scrollY))),
        left: Math.round(Math.min(...rects.map(b => b.left))),
      }
      const blocks = []
      for (const el of root.querySelectorAll('p,div,span')) {
        const cs = getComputedStyle(el)
        if (
          cs.fontSize === '20px' &&
          cs.fontWeight === '700' &&
          el.children.length === 0 &&
          /[€\d]/.test(el.textContent) &&
          el.textContent.length < 40 &&
          el.parentElement.children.length <= 3
        ) {
          blocks.push(
            [...el.parentElement.children].map(c => {
              const s = getComputedStyle(c)
              return {
                text: c.textContent.trim(),
                top: Math.round(c.getBoundingClientRect().top),
                deco: s.textDecorationLine,
                size: s.fontSize,
              }
            }),
          )
        }
      }
      const heads = [...root.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({
        tag: h.tagName,
        size: getComputedStyle(h).fontSize,
      }))
      return { gut, blocks, heads, hOverflow: document.documentElement.scrollWidth > vw }
    })
    out.push({ id, loc, w, ...r })
    await page.close()
  }
}
await browser.close()
console.log(JSON.stringify(out, null, 1))
