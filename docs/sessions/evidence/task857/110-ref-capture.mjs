import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const OUT = 'C:/Users/Nox/AppData/Local/Temp/claude/C--Claude-Code-Projects-lero-al/dd79fd06-85df-4da2-b961-09f0bd748272/scratchpad/refs'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await page.goto('https://demo.tailadmin.com/modals', { waitUntil: 'networkidle', timeout: 60000 })
await page.screenshot({ path: `${OUT}/ta-modals-page.png`, fullPage: true })
const btns = await page.locator('main button').all()
console.log('buttons', btns.length)
const labels = []
for (let i = 0; i < btns.length; i++) labels.push((await btns[i].innerText().catch(() => '')).trim())
console.log(JSON.stringify(labels))
let n = 0
for (let i = 0; i < btns.length && n < 8; i++) {
  if (!/open|modal/i.test(labels[i])) continue
  try {
    await btns[i].click({ timeout: 3000 }); await page.waitForTimeout(800)
    await page.screenshot({ path: `${OUT}/ta-modal-${n}.png` }); n++
    await page.keyboard.press('Escape'); await page.waitForTimeout(400)
    const close = page.locator('[class*="fixed"] button').first(); if (await close.isVisible().catch(() => false)) { await close.click().catch(() => {}); await page.waitForTimeout(300) }
  } catch (e) { console.log('fail', i, e.message.slice(0, 80)) }
}
const p2 = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await p2.goto('https://techzaa.in/lahomes/admin/property-grid.html', { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => console.log('lahomes', e.message))
await p2.screenshot({ path: `${OUT}/lahomes-grid.png`, fullPage: false })
const links = await p2.locator('a, button').evaluateAll((els) => els.map((e) => (e.getAttribute('data-bs-toggle') || '') + '|' + (e.textContent || '').trim().slice(0, 30)).filter((s) => s.startsWith('modal') || /modal/i.test(s)))
console.log('lahomes modal triggers', JSON.stringify(links.slice(0, 20)))
await browser.close()
