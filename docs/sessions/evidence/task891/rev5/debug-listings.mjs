import { chromium } from 'playwright'
const BASE = process.env.APP_BASE || 'http://localhost:3000'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 1000 })
await page.goto(`${BASE}/en/listings`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map((b) => ({
  text: (b.textContent || '').trim().slice(0, 40),
  ariaLabel: b.getAttribute('aria-label'),
  ariaHaspopup: b.getAttribute('aria-haspopup'),
  visible: !!(b.offsetWidth || b.offsetHeight || b.getClientRects().length),
})))
console.log(JSON.stringify(buttons.filter(b => b.text || b.ariaLabel), null, 2))
await page.screenshot({ path: 'docs/sessions/evidence/task891/rev5/debug-listings-1440.png', fullPage: false })
await browser.close()
