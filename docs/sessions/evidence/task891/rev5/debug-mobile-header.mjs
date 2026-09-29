import { chromium } from 'playwright'

const BASE = process.env.SB_BASE || 'http://127.0.0.1:6323'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 390, height: 800 })
await page.goto(`${BASE}/iframe.html?id=mantine-primitives-rangedatepicker--open-bounded-no-value&viewMode=story&globals=locale:en`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.waitForSelector('.mantine-ScrollArea-viewport', { timeout: 10000 }).catch(() => {})
await page.waitForTimeout(700)

const info = await page.evaluate(() => {
  const scrollAreaRoot = document.querySelector('.mantine-ScrollArea-root')
  const groups = Array.from(document.querySelectorAll('.mantine-Group-root')).map((g) => ({
    className: g.className,
    buttons: g.querySelectorAll('button').length,
    text: g.textContent.slice(0, 60),
    parentTag: g.parentElement ? g.parentElement.tagName : null,
    parentClass: g.parentElement ? g.parentElement.className : null,
  }))
  return {
    scrollAreaRootFound: !!scrollAreaRoot,
    scrollAreaParentTag: scrollAreaRoot?.parentElement?.tagName,
    scrollAreaParentClass: scrollAreaRoot?.parentElement?.className,
    prevSiblingTag: scrollAreaRoot?.previousElementSibling?.tagName,
    prevSiblingClass: scrollAreaRoot?.previousElementSibling?.className,
    groups,
    bodyHTMLSnippet: document.body.innerHTML.length,
  }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
