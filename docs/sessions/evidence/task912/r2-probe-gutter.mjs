import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:6107/iframe.html'
const browser = await chromium.launch()
const out = []
for (const [id, w] of [
  ['patterns-mantine-listingprice--default', 320],
  ['patterns-mantine-listingprice--default', 1440],
  ['patterns-mantine-listingdetailpattern--default', 320],
  ['patterns-mantine-listingdetailpattern--default', 390],
  ['patterns-mantine-listingdetailpattern--default', 1440],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
  await page.goto(`${BASE}?id=${id}&viewMode=story&globals=locale:en`)
  await page.waitForSelector('#storybook-root p', { state: 'attached', timeout: 30000 })
  await page.waitForTimeout(1500)
  const r = await page.evaluate(() => {
    const root = document.querySelector('#storybook-root')
    const gutter = [...root.querySelectorAll("*")].find(e => parseFloat(getComputedStyle(e).paddingTop) > 0 && parseFloat(getComputedStyle(e).paddingLeft) > 0)
    const cs = getComputedStyle(gutter)
    const kids = [...gutter.querySelectorAll('*')].slice(0, 400)
    // first Paper / first label text of the first section, for the top-edge reading
    const first = kids.find(e => e.children.length === 0 && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().width > 0)
    const last = [...kids].reverse().find(e => e.children.length === 0 && e.getBoundingClientRect().height > 0)
    const gb = gutter.getBoundingClientRect()
    return {
      gutterPad: { t: cs.paddingTop, r: cs.paddingRight, b: cs.paddingBottom, l: cs.paddingLeft },
      gutterBox: { top: Math.round(gb.top + scrollY), bottom: Math.round(gb.bottom + scrollY), h: Math.round(gb.height) },
      firstLeaf: first && { tag: first.tagName, text: first.textContent.slice(0, 30), top: Math.round(first.getBoundingClientRect().top + scrollY) },
      lastLeafBottom: last && Math.round(last.getBoundingClientRect().bottom + scrollY),
      scrollHeight: document.documentElement.scrollHeight,
    }
  })
  out.push({ id, w, ...r })
  await page.close()
}
await browser.close()
console.log(JSON.stringify(out, null, 1))
